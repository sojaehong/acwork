<template>
  <v-container class="pa-4">
    <h2 class="text-h5 mb-4">📄 일정 상세 보기</h2>

    <v-card class="pa-4 mb-4" elevation="2">
      <v-row class="mb-2">
        <v-col cols="4" class="font-weight-bold">날짜</v-col>
        <v-col cols="8">{{ schedule.date }}</v-col>
      </v-row>
      <v-row class="mb-2">
        <v-col cols="4" class="font-weight-bold">건물</v-col>
        <v-col cols="8">{{ schedule.building }} {{ schedule.unit }}동 {{ schedule.room }}호</v-col>
      </v-row>
      <v-row class="mb-2">
        <v-col cols="4" class="font-weight-bold">작업 종류</v-col>
        <v-col cols="8">{{ schedule.type }}</v-col>
      </v-row>
      <v-row class="mb-2">
        <v-col cols="4" class="font-weight-bold">작업 상태</v-col>
        <v-col cols="8">
          <v-btn
            v-for="s in statusOptions"
            :key="s"
            :color="schedule.status === s ? 'primary' : 'grey-lighten-1'"
            class="mr-2 mb-2"
            @click="updateStatus(s)"
          >
            {{ s }}
          </v-btn>
        </v-col>
      </v-row>
      <v-row v-if="schedule.status === '연기'">
        <v-col cols="4" class="font-weight-bold">변경할 날짜</v-col>
        <v-col cols="8">
          <v-text-field v-model="newDate" label="새 날짜 선택" type="date" @change="applyNewDate" />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="4" class="font-weight-bold">메모</v-col>
        <v-col cols="8">{{ schedule.memo || '-' }}</v-col>
      </v-row>
    </v-card>

    <v-btn color="primary" class="mr-2" @click="goToEdit">수정</v-btn>
    <v-btn color="error" class="mr-2" @click="deleteSchedule">삭제</v-btn>
    <v-btn color="secondary" class="mr-2" @click="goHome">홈으로</v-btn>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const schedule = ref({})
const statusOptions = ['예정','진행중','연기', '보류', '완료']
const newDate = ref('')

onMounted(async () => {
  const id = route.params.id
  const docRef = doc(db, 'schedules', id)
  const snap = await getDoc(docRef)
  if (snap.exists()) {
    schedule.value = { id: snap.id, ...snap.data() }
  } else {
    alert('일정을 찾을 수 없습니다.')
    router.push('/schedules')
  }
})

async function updateStatus(newStatus) {
  if (!schedule.value.id) return
  const docRef = doc(db, 'schedules', schedule.value.id)
  await updateDoc(docRef, { status: newStatus })
  schedule.value.status = newStatus

  if (newStatus !== '연기') {
    router.back()
  }
}

async function applyNewDate() {
  if (!newDate.value) return

  const today = new Date().toISOString().split('T')[0]
  if (newDate.value < today) {
    alert('오늘보다 이전 날짜로는 연기할 수 없습니다.')
    return
  }

  const docRef = doc(db, 'schedules', schedule.value.id)
  await updateDoc(docRef, { date: newDate.value, status: '예정' })
  schedule.value.date = newDate.value
  schedule.value.status = '예정'
  alert('날짜가 변경되었고 상태는 [예정]으로 자동 설정되었습니다.')
  router.back()
}

async function deleteSchedule() {
  const ok = confirm('정말 삭제하시겠습니까?')
  if (!ok) return
  await deleteDoc(doc(db, 'schedules', schedule.value.id))
  router.push('/schedules')
}

function goHome() {
  router.push('/')
}

function goToEdit() {
  router.push(`/schedule/${schedule.value.id}/edit`)
}
</script>

<style scoped>
.font-weight-bold {
  font-weight: bold;
}
</style>