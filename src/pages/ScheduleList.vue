<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16">
        <h2 class="text-h5 mb-4">📋 전체 작업 일정</h2>

        <!-- 에러 표시 -->
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

        <!-- 중앙 로딩 -->
        <v-progress-circular
          v-if="isLoading"
          indeterminate
          color="primary"
          size="48"
          width="5"
          style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 999;"
        ></v-progress-circular>

        <!-- 🔍 필터 및 검색 -->
        <v-expansion-panels flat class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>🔍 필터 및 검색</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="6" sm="4" md="2">
                  <v-select v-model="filterStatus" :items="statuses" label="작업 상태" clearable outlined dense @change="applyFiltersDebounced"/>
                </v-col>
                <v-col cols="6" sm="4" md="2">
                  <v-select v-model="filterBuilding" :items="buildings" label="건물" clearable outlined dense @change="applyFiltersDebounced"/>
                </v-col>
                <v-col cols="6" sm="4" md="2">
                  <v-select v-model="filterInvoice" :items="invoiceOptions" label="세금계산서" clearable outlined dense @change="applyFiltersDebounced"/>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field v-model="searchText" label="호수 또는 메모" clearable outlined dense @input="applyFiltersDebounced"/>
                </v-col>
                <v-col cols="6" sm="3" md="1">
                  <flat-pickr v-model="filterStartDate" :config="dateConfig" placeholder="시작일" class="flatpickr-input" @change="applyFiltersDebounced"/>
                </v-col>
                <v-col cols="6" sm="3" md="1">
                  <flat-pickr v-model="filterEndDate" :config="dateConfig" placeholder="종료일" class="flatpickr-input" @change="applyFiltersDebounced"/>
                </v-col>
                <v-col cols="6" sm="3" md="1">
                  <v-btn color="primary" block @click="applyFilters" size="small">적용</v-btn>
                </v-col>
                <v-col cols="6" sm="3" md="1">
                  <v-btn color="grey" block @click="clearDateFilter" size="small">초기화</v-btn>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- 📋 날짜별 작업 리스트 -->
        <v-slide-y-transition group>
          <div v-for="[date, items] in groupedSchedules" :key="date" class="mb-6">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">
              📅 {{ formatDateWithDay(date) }}
            </h3>
            <v-row>
              <v-col
                v-for="(item, idx) in items"
                :key="item.id"
                cols="12"
                sm="12"
                md="6"
              >
                <v-expand-transition>
                  <v-card class="mb-4 pa-4" hover style="cursor: pointer" @click="goToDetail(item.id)">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <div class="text-subtitle-1 font-weight-medium">
                        🕓 {{ item.date }}
                      </div>
                      <div>
                        <v-chip :color="displayStatusColor(item)" size="small" class="me-1" text-color="white">
                          {{ displayStatusText(item) }}
                        </v-chip>
                        <v-chip :color="item.invoice ? 'blue' : 'grey'" size="small" text-color="white">
                          세금계산서 {{ item.invoice ? 'O' : 'X' }}
                        </v-chip>
                      </div>
                    </div>
                    <div class="text-body-1 font-weight-bold mb-2">
                      🏢 {{ item.building }} {{ item.unit }}동 {{ item.room }}호
                    </div>
                    <div class="text-body-2 text-grey-darken-2">
                      <span class="font-weight-medium">🛠️ 작업 내용:</span>
                      <template v-if="item.tasks && item.tasks.length">
                        <v-chip
                          v-for="(task, i) in item.tasks"
                          :key="`${task.name}-${i}`"
                          size="small"
                          class="me-1 mt-1"
                          color="secondary"
                          variant="tonal"
                        >
                          {{ task.name }} ({{ task.count }} )
                        </v-chip>
                      </template>
                      <span v-else class="text-grey">없음</span>
                    </div>
                    <div class="text-caption text-grey mt-2" v-if="item.memo">
                      ✏️ {{ item.memo }}
                    </div>
                  </v-card>
                </v-expand-transition>
              </v-col>
            </v-row>
          </div>
        </v-slide-y-transition>

        <div v-if="!groupedSchedules.length" class="text-grey text-subtitle-1 mt-4">등록된 작업이 없습니다.</div>
      </v-container>

      <!-- ⬅️ 하단 고정 버튼 -->
      <v-container
        class="pa-2"
        style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
      >
        <v-row dense>
          <v-col cols="12">
            <v-btn color="secondary" block @click="goHome">홈으로</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Korean } from 'flatpickr/dist/l10n/ko.js'
import { useScheduleStore } from '@/stores/schedule'
import debounce from 'lodash/debounce'

const router = useRouter()
const scheduleStore = useScheduleStore()

const loading = ref(true)
const error = ref('')
const isLoading = ref(false)

const statuses = ['진행', '보류', '완료']
const buildings = ['테라타워1', '테라타워2', 'SKV1', '현대지식산업', '현대비지니스파크', '대명벨리온']
const invoiceOptions = ['O', 'X']

const filterStatus = ref(null)
const filterBuilding = ref(null)
const filterInvoice = ref(null)
const searchText = ref('')
const filterStartDate = ref(null)
const filterEndDate = ref(null)

const dateConfig = {
  locale: Korean,
  dateFormat: 'Y-m-d',
  disableMobile: true
}

function applyFilters() {
  isLoading.value = true
  setTimeout(() => { isLoading.value = false }, 200)
}
const applyFiltersDebounced = debounce(applyFilters, 200)

function clearDateFilter() {
  filterStartDate.value = null
  filterEndDate.value = null
  applyFilters()
}

function goToDetail(id) {
  router.push(`/schedule/${id}`)
}

function goHome() {
  router.push('/')
}

function getTodayStr() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.toISOString().split('T')[0]
}
const todayStr = getTodayStr()

function displayStatusText(item) {
  if (item.status === '진행' && item.date > todayStr) {
    return '예정'
  }
  return item.status
}

function displayStatusColor(item) {
  if (item.status === '진행' && item.date > todayStr) {
    return 'purple'
  }
  switch (item.status) {
    case '진행': return 'orange'
    case '완료': return 'green'
    case '보류': return 'red'
    default: return 'grey'
  }
}

function formatDateWithDay(dateStr) {
  const date = new Date(dateStr)
  const day = date.toLocaleDateString('ko-KR', { weekday: 'short' })
  return `${dateStr} (${day})`
}

const filteredSchedules = computed(() => {
  return scheduleStore.schedules.filter(item => {
    const matchStatus = !filterStatus.value || item.status === filterStatus.value
    const matchBuilding = !filterBuilding.value || item.building === filterBuilding.value
    const matchInvoice = !filterInvoice.value || (filterInvoice.value === 'O' ? item.invoice === true : item.invoice === false)
    const matchSearch = !searchText.value || (item.room?.includes(searchText.value) || item.memo?.includes(searchText.value))
    const matchDate = (!filterStartDate.value || new Date(item.date) >= new Date(filterStartDate.value)) &&
                      (!filterEndDate.value || new Date(item.date) <= new Date(filterEndDate.value))
    return matchStatus && matchBuilding && matchInvoice && matchSearch && matchDate
  })
})

const groupedSchedules = computed(() => {
  const groups = {}
  for (const item of filteredSchedules.value) {
    const date = item.date
    if (!groups[date]) groups[date] = []
    groups[date].push(item)
  }
  return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]))
})

onMounted(async () => {
  try {
    const q = query(collection(db, 'schedules'), orderBy('date', 'desc'))
    const snapshot = await getDocs(q)
    const fetchedSchedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => item.status !== '취소됨')

    scheduleStore.setSchedules(fetchedSchedules)
  } catch (err) {
    error.value = '작업을 불러오지 못했습니다.'
  } finally {
    loading.value = false
    isLoading.value = false
  }
})
</script>

<style scoped>
.flatpickr-input {
  font-size: 14px;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: 100%;
}
</style>
