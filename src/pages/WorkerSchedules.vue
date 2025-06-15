<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16">
        <h2 class="text-h5 mb-4 responsive-title">👷 작업자별 일정</h2>

        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

        <v-progress-circular
          v-if="loadingMeta"
          indeterminate
          color="primary"
          size="48"
          width="5"
          style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 999;"
        ></v-progress-circular>

        <div class="worker-scroll mb-4">
          <v-btn
            v-for="worker in workers"
            :key="worker.id"
            :color="selectedWorker === worker.id ? 'primary' : 'grey-lighten-2'"
            size="small"
            class="ma-1"
            @click="selectWorker(worker.id)"
          >{{ worker.name }}</v-btn>
        </div>

        <v-alert v-if="!selectedWorker" type="info">작업자를 선택해주세요.</v-alert>

        <template v-else>
          <h3 class="text-subtitle-1 font-weight-bold mb-2">📅 남은 일정</h3>
          <v-alert v-if="upcomingMeta.length === 0" type="warning">남은 일정이 없습니다.</v-alert>

          <transition-group name="fade-stagger" tag="div">
            <v-card
              v-for="item in upcomingMeta"
              :key="`${item.id}-${item.dday}`"
              class="mb-3 pa-3"
              outlined
            >
              <div class="text-subtitle-2 font-weight-bold">[D-{{ item.dday }}] {{ item.date }}</div>
              <div>시작 시간: {{ item.startTime || '-' }}</div>
              <div>작업 인원: {{ item.workerNames.join(', ') }}</div>
              <div v-if="item.notice" class="text-grey">📌 {{ item.notice }}</div>
            </v-card>
          </transition-group>

          <h3 class="text-subtitle-1 font-weight-bold mt-6 mb-2">📜 지난 일정</h3>
          <v-alert v-if="pastMeta.length === 0" type="info">지난 일정이 없습니다.</v-alert>

          <transition-group name="fade-stagger" tag="div">
            <v-card
              v-for="item in pastMeta"
              :key="`${item.id}-${item.dday}`"
              class="mb-3 pa-3"
              outlined
            >
              <div class="text-subtitle-2 font-weight-bold">[D+{{ item.dday }}] {{ item.date }}</div>
              <div>시작 시간: {{ item.startTime || '-' }}</div>
              <div>작업 인원: {{ item.workerNames.join(', ') }}</div>
              <div v-if="item.notice" class="text-grey">📌 {{ item.notice }}</div>
            </v-card>
          </transition-group>
        </template>
      </v-container>

      <v-container
        class="pa-2"
        style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
      >
        <v-row dense>
          <v-col>
            <v-btn color="primary" block class="responsive-btn" @click="$router.push('/')">홈으로</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

function getTodayKST() {
  const now = new Date()
  const offset = 9 * 60 * 60 * 1000
  const kst = new Date(now.getTime() + offset)
  return kst.toISOString().split('T')[0]
}

function dateDiff(from, to) {
  const fromDate = new Date(from + 'T00:00:00+09:00')
  const toDate = new Date(to + 'T00:00:00+09:00')
  const diff = Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24))
  return diff
}

const selectedWorker = ref(null)
const workers = ref([])
const metaList = ref([])
const userMap = ref({})
const loadingMeta = ref(false)
const error = ref('')
const today = getTodayKST()

onMounted(async () => {
  await fetchUsers()
  const queryId = route.query.worker
  const currentUserId = userStore.userId
  if (queryId && workers.value.find(w => w.id === queryId)) {
    selectedWorker.value = queryId
  } else if (!selectedWorker.value && currentUserId) {
    const match = workers.value.find(w => w.id === currentUserId)
    selectedWorker.value = match ? match.id : null
  }
  await fetchMeta()
})

const selectWorker = (id) => {
  selectedWorker.value = selectedWorker.value === id ? null : id
  router.replace({ query: { worker: selectedWorker.value || undefined } })
}

async function fetchUsers() {
  const snap = await getDocs(collection(db, 'users'))
  workers.value = snap.docs.map(doc => ({ id: doc.id, name: doc.data().name || doc.id }))
  userMap.value = Object.fromEntries(workers.value.map(u => [u.id, u.name]))
}

async function fetchMeta() {
  loadingMeta.value = true
  error.value = ''
  try {
    const snap = await getDocs(collection(db, 'schedulesMeta'))
    const result = []
    for (const doc of snap.docs) {
      const data = doc.data()
      if (!data.date || !Array.isArray(data.workers)) continue
      result.push({
        id: doc.id,
        date: data.date,
        startTime: typeof data.startTime === 'string' ? data.startTime : '',
        workers: data.workers,
        notice: typeof data.notice === 'string' ? data.notice : '',
        workerNames: data.workers.map(id => userMap.value[id] || '알 수 없음')
      })
    }
    metaList.value = result
  } catch (err) {
    console.error(err)
    error.value = '작업자별 일정 조회 중 오류가 발생했습니다.'
  } finally {
    loadingMeta.value = false
  }
}

const upcomingMeta = computed(() => {
  if (!selectedWorker.value) return []
  return metaList.value
    .filter(m => m.workers.includes(selectedWorker.value) && m.date >= today)
    .map(m => ({ ...m, dday: dateDiff(today, m.date) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
})

const pastMeta = computed(() => {
  if (!selectedWorker.value) return []
  return metaList.value
    .filter(m => m.workers.includes(selectedWorker.value) && m.date < today)
    .map(m => ({ ...m, dday: dateDiff(m.date, today) }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})
</script>

<style scoped>
.font-weight-bold {
  font-weight: bold;
}
.worker-scroll {
  overflow-x: auto;
  white-space: nowrap;
  display: flex;
}
.worker-scroll .v-btn {
  flex-shrink: 0;
  padding: 0 12px;
  font-size: 13px;
  margin-right: 8px;
}
.fade-stagger-enter-active {
  transition: all 0.3s ease;
}
.fade-stagger-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-stagger-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.fade-stagger-leave-active {
  transition: all 0.2s ease;
  opacity: 0;
  transform: translateY(8px);
}
</style>