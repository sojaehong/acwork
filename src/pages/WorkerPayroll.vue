<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16">
        <h2 class="text-h5 mb-4 responsive-title">💰 정산 확인</h2>

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
            :class="{ selected: selectedWorker === worker.id }"
          >{{ worker.name }}</v-btn>
        </div>

        <v-alert v-if="!selectedWorker" type="info">작업자를 선택해주세요.</v-alert>

        <template v-else>
          <h3 class="text-subtitle-1 font-weight-bold mb-2">💼 정산 안됨</h3>
          <v-alert v-if="unpaid.length === 0" type="success">정산 안된 항목이 없습니다.</v-alert>

          <transition-group name="fade-stagger" tag="div">
            <v-card
              v-for="(item, index) in unpaid"
              :key="`${item.id}-${item.dday}`"
              class="mb-3 pa-3"
              outlined
              :color="selectedUnpaid.includes(item.id) ? 'blue lighten-4' : ''"
              @click="toggleUnpaid(item.id)"
              style="cursor: pointer"
            >
              <div class="text-subtitle-2 font-weight-bold">[D+{{ item.dday }}] {{ item.date }}</div>
              <div>시작 시간: {{ item.startTime || '-' }}</div>
              <div>작업 인원: {{ item.workerNames.join(', ') }}</div>
              <div v-if="item.notice" class="text-grey">📌 {{ item.notice }}</div>
              <div class="text-grey">정산 상태: 정산 안됨</div>
            </v-card>
          </transition-group>

          <v-btn
            v-if="selectedUnpaid.length > 0"
            :loading="updating"
            color="primary"
            block
            class="mb-6"
            @click="markAsPaid"
          >정산 처리</v-btn>

          <h3 class="text-subtitle-1 font-weight-bold mt-6 mb-2">📜 정산 완료</h3>
          <v-alert v-if="paid.length === 0" type="info">정산 완료된 항목이 없습니다.</v-alert>

          <transition-group name="fade-stagger" tag="div">
            <v-card
              v-for="(item, index) in paid"
              :key="`${item.id}-${item.dday}`"
              class="mb-3 pa-3"
              outlined
              :color="selectedPaid.includes(item.id) ? 'red lighten-4' : ''"
              @click="togglePaid(item.id)"
              style="cursor: pointer"
            >
              <div class="text-subtitle-2 font-weight-bold">[D+{{ item.dday }}] {{ item.date }}</div>
              <div>시작 시간: {{ item.startTime || '-' }}</div>
              <div>작업 인원: {{ item.workerNames.join(', ') }}</div>
              <div v-if="item.notice" class="text-grey">📌 {{ item.notice }}</div>
              <div class="text-grey">정산 상태: 정산 완료</div>
            </v-card>
          </transition-group>

          <v-btn
            v-if="selectedPaid.length > 0"
            :loading="updating"
            color="error"
            block
            @click="cancelPaid"
          >정산 취소</v-btn>
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
import { ref, computed, onMounted, watch } from 'vue'
import { db } from '@/firebase/config'
import { collection, getDocs, query, orderBy, updateDoc, doc, getDoc } from 'firebase/firestore'

const meta = ref([])
const selectedWorker = ref(null)
const workers = ref([])
const selectedUnpaid = ref([])
const selectedPaid = ref([])
const userMap = ref({})

const loadingMeta = ref(false)
const updating = ref(false)
const error = ref('')

function getTodayKST() {
  const now = new Date()
  const offset = 9 * 60 * 60 * 1000
  const kst = new Date(now.getTime() + offset)
  return kst.toISOString().split('T')[0]
}
const todayKST = getTodayKST()

function toKSTDate(dateStr) {
  return new Date(dateStr + 'T00:00:00+09:00')
}
function calcDday(dateStr) {
  return Math.floor((toKSTDate(todayKST) - toKSTDate(dateStr)) / (1000 * 60 * 60 * 24))
}

function selectWorker(id) {
  selectedWorker.value = selectedWorker.value === id ? null : id
  selectedUnpaid.value = []
  selectedPaid.value = []
}

async function fetchUsers() {
  const userSnap = await getDocs(collection(db, 'users'))
  workers.value = userSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name || doc.id }))
  userMap.value = Object.fromEntries(workers.value.map(u => [u.id, u.name]))
  if (!selectedWorker.value && workers.value.length > 0) {
    selectedWorker.value = workers.value[0].id
  }
}

async function fetchMeta() {
  loadingMeta.value = true
  const snap = await getDocs(query(collection(db, 'schedulesMeta'), orderBy('date', 'desc')))
  meta.value = snap.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      paidMap: data.paidMap || {},
      workerNames: (data.workers || []).map(uid => userMap.value[uid] || '알 수 없음'),
      dday: calcDday(data.date)
    }
  })
  loadingMeta.value = false
}

const unpaid = computed(() => {
  return meta.value.filter(
    m =>
      m.workers.includes(selectedWorker.value) &&
      (!m.paidMap[selectedWorker.value]) &&
      m.date <= todayKST
  )
})

const paid = computed(() => {
  return meta.value.filter(
    m =>
      m.workers.includes(selectedWorker.value) &&
      m.paidMap[selectedWorker.value] === true
  )
})

function toggleUnpaid(id) {
  selectedUnpaid.value.includes(id)
    ? selectedUnpaid.value = selectedUnpaid.value.filter(i => i !== id)
    : selectedUnpaid.value.push(id)
}

function togglePaid(id) {
  selectedPaid.value.includes(id)
    ? selectedPaid.value = selectedPaid.value.filter(i => i !== id)
    : selectedPaid.value.push(id)
}

async function markAsPaid() {
  if (updating.value) return
  updating.value = true
  error.value = ''
  try {
    for (const id of selectedUnpaid.value) {
      const docRef = doc(db, 'schedulesMeta', id)
      const snap = await getDoc(docRef)
      const data = snap.data()
      const paidMap = data.paidMap || {}
      paidMap[selectedWorker.value] = true
      await updateDoc(docRef, { paidMap })
      const metaItem = meta.value.find(m => m.id === id)
      if (metaItem) metaItem.paidMap[selectedWorker.value] = true
    }
    selectedUnpaid.value = []
    alert('정산 처리되었습니다.')
  } catch (err) {
    console.error('정산 처리 중 오류:', err)
    error.value = '정산 처리 중 오류가 발생했습니다.'
  } finally {
    updating.value = false
  }
}

async function cancelPaid() {
  if (updating.value) return
  updating.value = true
  error.value = ''
  try {
    for (const id of selectedPaid.value) {
      const docRef = doc(db, 'schedulesMeta', id)
      const snap = await getDoc(docRef)
      const data = snap.data()
      const paidMap = data.paidMap || {}
      paidMap[selectedWorker.value] = false
      await updateDoc(docRef, { paidMap })
      const metaItem = meta.value.find(m => m.id === id)
      if (metaItem) metaItem.paidMap[selectedWorker.value] = false
    }
    selectedPaid.value = []
    alert('정산이 취소되었습니다.')
  } catch (err) {
    console.error('정산 취소 중 오류:', err)
    error.value = '정산 취소 중 오류가 발생했습니다.'
  } finally {
    updating.value = false
  }
}

onMounted(async () => {
  await fetchUsers()
  await fetchMeta()
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
.worker-scroll .v-btn.selected {
  border: 2px solid #1976d2;
  font-weight: bold;
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