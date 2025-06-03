<template>
  <v-container class="pa-4 pb-16">
    <h2 class="text-h5 mb-4">📋 전체 작업 일정</h2>

    <!-- 🔍 필터 및 검색 -->
    <v-expansion-panels flat class="mb-4">
      <v-expansion-panel>
        <v-expansion-panel-title>🔍 필터 및 검색</v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row dense>
            <v-col cols="6" sm="4" md="2">
              <v-select v-model="filterStatus" :items="statuses" label="작업 상태" clearable outlined dense />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-select v-model="filterBuilding" :items="buildings" label="건물" clearable outlined dense />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-select v-model="filterInvoice" :items="invoiceOptions" label="세금계산서" clearable outlined dense />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-text-field v-model="searchText" label="호수 또는 메모" clearable outlined dense />
            </v-col>
            <v-col cols="6" sm="3" md="1">
              <flat-pickr v-model="filterStartDate" :config="dateConfig" placeholder="시작일" class="flatpickr-input" />
            </v-col>
            <v-col cols="6" sm="3" md="1">
              <flat-pickr v-model="filterEndDate" :config="dateConfig" placeholder="종료일" class="flatpickr-input" />
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

    <!-- ⏳ 로딩 / 에러 -->
    <v-alert v-if="loading" type="info">불러오는 중...</v-alert>
    <v-alert v-if="error" type="error">{{ error }}</v-alert>

    <!-- 📋 작업 리스트 -->
    <v-row v-if="filteredSchedules.length">
      <v-col
        v-for="(item, idx) in filteredSchedules"
        :key="idx"
        cols="12"
        sm="12"
        md="6"
        @click="goToDetail(item.id)"
      >
        <v-card class="mb-4 pa-4" hover style="cursor: pointer">
          <div class="d-flex justify-space-between align-center mb-2">
            <div class="text-subtitle-1 font-weight-medium">
              📅 {{ item.date }}
            </div>
            <div>
              <v-chip :color="statusColor(item.status)" size="small" class="me-1" text-color="white">
                {{ item.status }}
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
                :key="i"
                size="small"
                class="me-1 mt-1"
                color="secondary"
                variant="tonal"
              >
                {{ task.name }} ({{ task.count }})
              </v-chip>
            </template>
            <span v-else class="text-grey">없음</span>
          </div>

          <div class="text-caption text-grey mt-2" v-if="item.memo">
            ✏️ {{ item.memo }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <div v-else class="text-grey text-subtitle-1 mt-4">등록된 작업이 없습니다.</div>
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Korean } from 'flatpickr/dist/l10n/ko.js'

const router = useRouter()
const schedules = ref([])
const loading = ref(true)
const error = ref('')

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
  // 컴포넌트 리렌더 유도용 (computed는 자동)
}

function clearDateFilter() {
  filterStartDate.value = null
  filterEndDate.value = null
}

function goToDetail(id) {
  router.push(`/schedule/${id}`)
}

function goHome() {
  router.push('/')
}

const statusColor = (status) => {
  switch (status) {
    case '진행': return 'orange'
    case '완료': return 'green'
    case '보류': return 'red'
    default: return 'grey'
  }
}

const filteredSchedules = computed(() => {
  return schedules.value.filter(item => {
    const matchStatus = !filterStatus.value || item.status === filterStatus.value
    const matchBuilding = !filterBuilding.value || item.building === filterBuilding.value
    const matchInvoice =
      !filterInvoice.value ||
      (filterInvoice.value === 'O' ? item.invoice === true : item.invoice === false)
    const matchSearch =
      !searchText.value ||
      (item.room?.includes(searchText.value) || item.memo?.includes(searchText.value))
    const matchDate =
      (!filterStartDate.value || new Date(item.date) >= new Date(filterStartDate.value)) &&
      (!filterEndDate.value || new Date(item.date) <= new Date(filterEndDate.value))

    return matchStatus && matchBuilding && matchInvoice && matchSearch && matchDate
  })
})

onMounted(async () => {
  try {
    const q = query(collection(db, 'schedules'), orderBy('date', 'desc'))
    const snapshot = await getDocs(q)
    schedules.value = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(item => item.status !== '취소됨')
  } catch (err) {
    error.value = '작업을 불러오지 못했습니다.'
  } finally {
    loading.value = false
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
