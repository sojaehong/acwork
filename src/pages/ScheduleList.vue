<template>
  <v-container class="pa-4 pb-16">
    <h2 class="text-h5 mb-4">📋 전체 작업 일정</h2>

    <!-- 🔍 필터 패널 -->
    <v-expansion-panels flat class="mb-4">
      <v-expansion-panel>
        <v-expansion-panel-title>🔍 필터 및 검색</v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row>
            <v-col cols="12" md="3">
              <v-select v-model="filterStatus" :items="statuses" label="작업 상태" clearable outlined dense />
            </v-col>
            <v-col cols="12" md="3">
              <v-select v-model="filterBuilding" :items="buildings" label="건물" clearable outlined dense />
            </v-col>
            <v-col cols="12" md="3">
              <v-select v-model="filterInvoice" :items="invoiceOptions" label="세금계산서 여부" clearable outlined dense />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field v-model="searchText" label="호수 또는 메모 검색" clearable outlined dense />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-alert v-if="loading" type="info">불러오는 중...</v-alert>
    <v-alert v-if="error" type="error">{{ error }}</v-alert>

    <v-row v-if="filteredSchedules.length">
      <v-col
        v-for="(item, idx) in filteredSchedules"
        :key="idx"
        cols="12"
        md="6"
        @click="goToDetail(item.id)"
      >
        <v-card class="mb-3 pa-3" hover style="cursor: pointer">
          <v-card-title class="text-h6">
            {{ item.date }} – {{ item.building }} {{ item.unit }}동 {{ item.room }}호
          </v-card-title>
          <v-card-subtitle>
            <div v-if="item.tasks && item.tasks.length">
              작업:
              <span v-for="(task, i) in item.tasks" :key="i">
                {{ task.name }} ({{ task.count }})<span v-if="i < item.tasks.length - 1">, </span>
              </span>
            </div>
            <div v-else>
              작업: -
            </div>
            상태: {{ item.status }} / 세금계산서: {{ item.invoice ? 'O' : 'X' }}
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <div v-else class="text-grey text-subtitle-1 mt-4">등록된 작업이 없습니다.</div>
  </v-container>

  <!-- ✅ 하단 고정 버튼 -->
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
import { db } from '@/firebase/config'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const router = useRouter()
const schedules = ref([])
const loading = ref(true)
const error = ref('')

const statuses = ['진행', '보류', '완료']
const buildings = ['테라타워', 'SKV1', '현대지식산업']
const invoiceOptions = ['O', 'X']

const filterStatus = ref(null)
const filterBuilding = ref(null)
const filterInvoice = ref(null)
const searchText = ref('')

function goToDetail(id) {
  router.push(`/schedule/${id}`)
}

function goHome() {
  router.push('/')
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
      item.room?.includes(searchText.value) ||
      item.memo?.includes(searchText.value)
    return matchStatus && matchBuilding && matchInvoice && matchSearch
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
