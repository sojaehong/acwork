<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16">
        <h2 class="text-h5 mb-4">📋 전체 작업 일정</h2>

        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

        <v-progress-circular
          v-if="isLoading"
          indeterminate
          color="primary"
          size="48"
          width="5"
          style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 999;"
        ></v-progress-circular>

        <!-- 🔽 필터 토글 버튼 -->
        <!-- <v-btn @click="showFilters = !showFilters" class="mb-4" color="primary" variant="outlined" block>
          {{ showFilters ? '🔽 필터 및 검색 닫기' : '🔍 필터 및 검색 열기' }}
        </v-btn> -->

        <!-- 🔽 필터 영역 -->
        <v-slide-y-transition>
          <div v-show="true" class="filter-bar">
            <div class="filter-row">
              <div class="filter-group">
                <label>📌 상태</label>
                <div class="filter-scroll">
                  <v-btn
                    v-for="s in statuses"
                    :key="s"
                    :color="store.filters.status.includes(s) ? 'primary' : 'grey-lighten-2'"
                    size="small"
                    class="ma-1"
                    @click="toggleFilter('status', s)"
                  >{{ s }}</v-btn>
                </div>
              </div>

              <div class="filter-group">
                <label>🏢 건물</label>
                <div class="filter-scroll">
                  <v-btn
                    v-for="b in buildings"
                    :key="b"
                    :color="store.filters.building.includes(b) ? 'primary' : 'grey-lighten-2'"
                    size="small"
                    class="ma-1"
                    @click="toggleFilter('building', b)"
                  >{{ b }}</v-btn>
                </div>
              </div>

              <div class="filter-group">
                <label>🧾 세금계산서 유무</label>
                <div class="filter-scroll">
                  <v-btn
                    v-for="opt in invoiceOptions"
                    :key="opt"
                    :color="store.filters.invoice === opt ? 'primary' : 'grey-lighten-2'"
                    size="small"
                    class="ma-1"
                    @click="toggleFilter('invoice', opt)"
                  >{{ opt }}</v-btn>
                </div>
              </div>

              <div class="filter-group">
                <label>🛠️ 작업 종류</label>
                <div class="filter-scroll">
                  <v-btn
                    v-for="t in taskTypes"
                    :key="t"
                    :color="store.filters.task.includes(t) ? 'primary' : 'grey-lighten-2'"
                    size="small"
                    class="ma-1"
                    @click="toggleFilter('task', t)"
                  >{{ t }}</v-btn>
                </div>
              </div>
            </div>

            <v-row dense class="mt-2">
              <v-col cols="6" sm="3">
                <flat-pickr v-model="store.filters.startDate" :config="dateConfig" placeholder="시작일" class="flatpickr-input" @change="applyFiltersDebounced" />
              </v-col>
              <v-col cols="6" sm="3">
                <flat-pickr v-model="store.filters.endDate" :config="dateConfig" placeholder="종료일" class="flatpickr-input" @change="applyFiltersDebounced" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="store.filters.searchText" label="호수 또는 메모" clearable outlined dense @input="applyFiltersDebounced" />
              </v-col>
              <v-col cols="12" sm="2">
                <v-btn block color="grey-darken-2" @click="resetFilters">초기화</v-btn>
              </v-col>
            </v-row>
          </div>
        </v-slide-y-transition>

        <!-- 🔽 일정 리스트 -->
        <v-slide-y-transition group>
          <div v-for="[date, items] in groupedSchedules" :key="date" class="mb-6">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">🗓️ {{ formatDateWithDay(date) }}</h3>
            <v-row>
              <v-col v-for="item in items" :key="item.id" cols="12" sm="12" md="6">
                <v-card class="mb-4 pa-4" hover @click="goToDetail(item.id)">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <div class="text-subtitle-1 font-weight-medium">🕓 {{ item.date }}</div>
                    <div>
                      <v-chip :color="displayStatusColor(item)" size="small" class="me-1" text-color="white">
                        {{ displayStatusText(item) }}
                      </v-chip>
                      <v-chip :color="item.invoice ? 'blue' : 'grey'" size="small" text-color="white">
                        세금계산서 {{ item.invoice ? 'O' : 'X' }}
                      </v-chip>
                    </div>
                  </div>
                  <div class="text-body-1 font-weight-bold mb-2">🏢 {{ item.building }} {{ item.unit }}동 {{ item.room }}호</div>
                  <div class="text-body-2 text-grey-darken-2">
                    <span class="font-weight-medium">🛠️ 작업 내용:</span>
                    <v-chip
                      v-for="(task, i) in item.tasks"
                      :key="`${task.name}-${i}`"
                      size="small"
                      class="me-1 mt-1"
                      color="secondary"
                      variant="tonal"
                    >{{ task.name }} ({{ task.count }})</v-chip>
                  </div>
                  <div class="text-caption text-grey mt-2" v-if="item.memo">✏️ {{ item.memo }}</div>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-slide-y-transition>

        <div v-if="!groupedSchedules.length" class="text-grey text-subtitle-1 mt-4">등록된 작업이 없습니다.</div>
      </v-container>

      <v-container class="pa-2" style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);">
        <v-row dense>
          <v-col cols="12">
            <v-btn color="primary" block @click="goHome">홈으로</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useScheduleStore } from '@/stores/schedule'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Korean } from 'flatpickr/dist/l10n/ko.js'
import debounce from 'lodash/debounce'

const router = useRouter()
const store = useScheduleStore()

const error = ref('')
const isLoading = ref(false)
const showFilters = ref(false)
const statuses = ref([])
const buildings = ref([])
const taskTypes = ref([])
const invoiceOptions = ['O', 'X']

const dateConfig = { locale: Korean, dateFormat: 'Y-m-d', disableMobile: true }

const toggleFilter = (type, value) => {
  if (type === 'invoice') {
    store.setFilters({ invoice: store.filters.invoice === value ? null : value })
    applyFiltersDebounced()
    return
  }
  const target = [...store.filters[type]]
  const updated = target.includes(value)
    ? target.filter(v => v !== value)
    : [...target, value]
  store.setFilters({ [type]: updated })
  applyFiltersDebounced()
}

const resetFilters = () => {
  store.resetFilters()
  applyFilters()
}

const applyFilters = () => {
  isLoading.value = true
  setTimeout(() => { isLoading.value = false }, 200)
}
const applyFiltersDebounced = debounce(applyFilters, 200)

const goToDetail = id => router.push(`/schedule/${id}`)
const goHome = () => router.push('/')

const formatDateWithDay = dateStr => {
  const date = new Date(dateStr)
  const day = date.toLocaleDateString('ko-KR', { weekday: 'short' })
  return `${dateStr} (${day})`
}

const displayStatusColor = item => {
  const today = new Date().toISOString().split('T')[0]
  if (item.status === '진행') {
    if (item.date === today) return 'orange'
    if (item.date > today) return 'purple'
  }
  switch (item.status) {
    case '완료': return 'green'
    case '보류': return 'red'
    default: return 'grey'
  }
}

const displayStatusText = item => {
  const today = new Date().toISOString().split('T')[0]
  if (item.status === '진행') {
    if (item.date === today) return '진행'
    if (item.date > today) return '예정'
  }
  return item.status
}

const filteredSchedules = computed(() => {
  return store.schedules.filter(item => {
    const { status, building, task, invoice, searchText, startDate, endDate } = store.filters
    const matchStatus = status.length ? status.includes(item.status) : item.status !== '취소됨'
    const matchBuilding = !building.length || building.includes(item.building)
    const matchTask = !task.length || item.tasks?.some(t => task.includes(t.name))
    const matchInvoice = !invoice || (invoice === 'O' ? item.invoice : !item.invoice)
    const matchSearch = !searchText || (item.room?.includes(searchText) || item.memo?.includes(searchText))
    const matchDate = (!startDate || new Date(item.date) >= new Date(startDate)) &&
                      (!endDate || new Date(item.date) <= new Date(endDate))
    return matchStatus && matchBuilding && matchInvoice && matchTask && matchSearch && matchDate
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
    const fetchedSchedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    store.setSchedules(fetchedSchedules)
    statuses.value = [...new Set(fetchedSchedules.map(s => s.status))]
    buildings.value = [...new Set(fetchedSchedules.map(s => s.building))]
    taskTypes.value = [...new Set(fetchedSchedules.flatMap(s => s.tasks?.map(t => t.name) || []))]
  } catch (err) {
    error.value = '작업을 불러오지 못했습니다.'
  } finally {
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
.filter-bar { margin-bottom: 24px; }
.filter-row { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.filter-group label { font-weight: bold; margin-bottom: 4px; display: block; }
.filter-scroll { overflow-x: auto; white-space: nowrap; }
</style>