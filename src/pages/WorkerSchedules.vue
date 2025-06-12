<template>
  <v-container class="pa-4 pb-16">
    <h2 class="text-h5 mb-4">👷 작업자별 일정</h2>

    <!-- 작업자 선택 -->
    <v-select
      v-model="selectedWorker"
      :items="workers"
      label="작업자 선택"
      outlined
      dense
      class="mb-4"
      item-title="name"
      item-value="id"
    />

    <v-alert v-if="!selectedWorker" type="info">작업자를 선택해주세요.</v-alert>

    <template v-else>
      <!-- 남은 일정 -->
      <h3 class="text-subtitle-1 font-weight-bold mb-2">📅 남은 일정</h3>
      <v-alert v-if="upcomingMeta.length === 0" type="warning">남은 일정이 없습니다.</v-alert>
      <v-card
        v-for="(item, index) in upcomingMeta"
        :key="index"
        class="mb-3 pa-3"
        outlined
      >
        <div class="text-subtitle-2 font-weight-bold">[D-{{ item.dday }}] {{ item.date }}</div>
        <div>시작 시간: {{ item.startTime || '-' }}</div>
        <div>작업 인원: {{ item.workerNames.join(', ') }}</div>
        <div v-if="item.notice" class="text-grey">📌 {{ item.notice }}</div>
      </v-card>

      <!-- 지난 일정 -->
      <h3 class="text-subtitle-1 font-weight-bold mt-6 mb-2">📜 지난 일정</h3>
      <v-alert v-if="pastMeta.length === 0" type="info">지난 일정이 없습니다.</v-alert>
      <v-card
        v-for="(item, index) in pastMeta"
        :key="index"
        class="mb-3 pa-3"
        outlined
      >
        <div class="text-subtitle-2 font-weight-bold">[D+{{ item.dday }}] {{ item.date }}</div>
        <div>시작 시간: {{ item.startTime || '-' }}</div>
        <div>작업 인원: {{ item.workerNames.join(', ') }}</div>
        <div v-if="item.notice" class="text-grey">📌 {{ item.notice }}</div>
      </v-card>
    </template>
  </v-container>

  <!-- 하단 고정 버튼 -->
  <v-container
    class="pa-2"
    style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
  >
    <v-row dense>
      <v-col>
        <v-btn color="primary" block @click="$router.push('/')">홈으로</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'

// 날짜를 KST 기준으로 반환하는 함수
function getTodayKST() {
  const now = new Date()
  const offset = 9 * 60 * 60 * 1000
  const kst = new Date(now.getTime() + offset)
  return kst.toISOString().split('T')[0]
}

// 날짜 차이 계산
function dateDiff(from, to) {
  const fromDate = new Date(from + 'T00:00:00+09:00')
  const toDate = new Date(to + 'T00:00:00+09:00')
  const diff = Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24))
  return diff
}

const selectedWorker = ref(null)
const workers = ref([])
const metaList = ref([])
const userMap = ref({}) // ✅ userMap 캐싱 적용
const loading = ref(true) // ✅ loading 상태 추가

const today = getTodayKST()

async function fetchUsers() {
  const userSnap = await getDocs(collection(db, 'users'))
  workers.value = userSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name || doc.id }))

  // ✅ userMap 구축
  userMap.value = {}
  for (const user of workers.value) {
    userMap.value[user.id] = user.name
  }
}

async function fetchMeta() {
  const snap = await getDocs(collection(db, 'schedulesMeta'))
  const metaItems = []
  const allUserIds = new Set()

  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    if (!data.date || !Array.isArray(data.workers)) continue

    // ✅ userMap 기반으로 workerNames resolve (getDoc 제거)
    const workerNames = (data.workers || []).map(id => userMap.value[id] || '알 수 없음')
    data.workers.forEach(id => allUserIds.add(id))

    metaItems.push({
      id: docSnap.id,
      date: data.date,
      startTime: data.startTime || '',
      workers: data.workers,
      notice: data.notice || '',
      workerNames
    })
  }

  metaList.value = metaItems

  // ✅ workers 목록은 전체 users 중 meta 에 포함된 users 만 표시
  const userSnap = await getDocs(collection(db, 'users'))
  workers.value = userSnap.docs
    .filter(doc => allUserIds.has(doc.id))
    .map(doc => ({ id: doc.id, name: doc.data().name || doc.id }))
}

onMounted(async () => {
  loading.value = true
  await fetchUsers()
  await fetchMeta()
  loading.value = false
})

const upcomingMeta = computed(() => {
  if (!selectedWorker.value) return []
  return metaList.value
    .filter(m => m.workers.includes(selectedWorker.value) && m.date >= today)
    .map(m => ({ ...m, dday: dateDiff(today, m.date) }))
})

const pastMeta = computed(() => {
  if (!selectedWorker.value) return []
  return metaList.value
    .filter(m => m.workers.includes(selectedWorker.value) && m.date < today)
    .map(m => ({ ...m, dday: dateDiff(m.date, today) }))
})
</script>


<style scoped>
.font-weight-bold {
  font-weight: bold;
}
</style>
