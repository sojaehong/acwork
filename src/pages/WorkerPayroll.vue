<template>
  <v-container class="pa-4 pb-16">
    <h2 class="text-h5 mb-4">💰 정산 확인</h2>

    <!-- 작업자 선택 -->
    <v-select
      v-model="selectedWorker"
      :items="workers"
      item-title="name"
      item-value="id"
      label="작업자 선택"
      outlined
      dense
      class="mb-4"
    />

    <v-alert v-if="!selectedWorker" type="info">작업자를 선택해주세요.</v-alert>

    <template v-else>
      <!-- 정산 안됨 -->
      <h3 class="text-subtitle-1 font-weight-bold mb-2">💼 정산 안됨</h3>
      <v-alert v-if="unpaid.length === 0" type="success">정산 안된 항목이 없습니다.</v-alert>
      <v-card
        v-for="(item, index) in unpaid"
        :key="item.id"
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

      <v-btn
        v-if="selectedUnpaid.length > 0"
        color="primary"
        block
        class="mb-6"
        @click="markAsPaid"
      >정산 처리</v-btn>

      <!-- 정산 완료 -->
      <h3 class="text-subtitle-1 font-weight-bold mt-6 mb-2">📜 정산 완료</h3>
      <v-alert v-if="paid.length === 0" type="info">정산 완료된 항목이 없습니다.</v-alert>
      <v-card
        v-for="(item, index) in paid"
        :key="item.id"
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

      <v-btn
        v-if="selectedPaid.length > 0"
        color="error"
        block
        @click="cancelPaid"
      >정산 취소</v-btn>
    </template>
  </v-container>

   <!-- 하단 고정 버튼 -->
  <v-container
    class="pa-2"
    style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
  >
    <v-row dense>
      <v-col >
        <v-btn color="primary" block @click="$router.push('/')">홈으로</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '@/firebase/config'
import { collection, getDocs, query, orderBy, updateDoc, doc, getDoc } from 'firebase/firestore'

const meta = ref([])
const selectedWorker = ref(null)
const workers = ref([])
const selectedUnpaid = ref([])
const selectedPaid = ref([])
const today = new Date().toISOString().split('T')[0]

onMounted(async () => {
  const snap = await getDocs(query(collection(db, 'schedulesMeta'), orderBy('date')))
  meta.value = await Promise.all(
    snap.docs.map(async d => {
      const data = d.data()
      const userDocs = await Promise.all(
        (data.workers || []).map(uid => getDoc(doc(db, 'users', uid)))
      )
      return {
        id: d.id,
        ...data,
        workerNames: userDocs.map(u => u.exists() ? u.data().name || u.id : '알 수 없음'),
        dday: calcDday(data.date)
      }
    })
  )

  const userSnap = await getDocs(collection(db, 'users'))
  workers.value = userSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name || doc.id }))
})

const unpaid = computed(() => {
  return meta.value.filter(
    m => m.workers.includes(selectedWorker.value) && !m.paid && m.date < today
  )
})

const paid = computed(() => {
  return meta.value.filter(
    m => m.workers.includes(selectedWorker.value) && m.paid
  )
})

function calcDday(dateStr) {
  const todayObj = new Date()
  const target = new Date(dateStr)
  const diff = Math.floor((todayObj - target) / (1000 * 60 * 60 * 24))
  return diff
}

function toggleUnpaid(id) {
  if (selectedUnpaid.value.includes(id)) {
    selectedUnpaid.value = selectedUnpaid.value.filter(i => i !== id)
  } else {
    selectedUnpaid.value.push(id)
  }
}

function togglePaid(id) {
  if (selectedPaid.value.includes(id)) {
    selectedPaid.value = selectedPaid.value.filter(i => i !== id)
  } else {
    selectedPaid.value.push(id)
  }
}

async function markAsPaid() {
  for (const id of selectedUnpaid.value) {
    await updateDoc(doc(db, 'schedulesMeta', id), { paid: true })
  }
  selectedUnpaid.value = []
  alert('정산 처리되었습니다.')
  location.reload()
}

async function cancelPaid() {
  for (const id of selectedPaid.value) {
    await updateDoc(doc(db, 'schedulesMeta', id), { paid: false })
  }
  selectedPaid.value = []
  alert('정산이 취소되었습니다.')
  location.reload()
}
</script>

<style scoped>
.font-weight-bold {
  font-weight: bold;
}
</style>
