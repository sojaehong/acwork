<template>
  <v-container class="pa-4">
    <h2 class="text-h5 mb-4">📄 작업 상세 보기</h2>

    <v-card class="pa-4 mb-4" elevation="2">
      <v-row class="mb-2">
        <v-col cols="4" class="font-weight-bold">날짜</v-col>
        <v-col cols="8">{{ schedule.date }}</v-col>
      </v-row>
      <v-row class="mb-2">
        <v-col cols="4" class="font-weight-bold">건물</v-col>
        <v-col cols="8">
          {{ schedule.building }} {{ schedule.unit }}동 {{ schedule.room }}호
        </v-col>
      </v-row>
      <v-row class="mb-2">
        <v-col cols="4" class="font-weight-bold">작업 내용</v-col>
        <v-col cols="8">
          <ul class="pl-2">
            <li v-for="(task, i) in schedule.tasks" :key="i">
              {{ task.name }} ({{ task.count }})
            </li>
          </ul>
        </v-col>
      </v-row>
      <v-row class="mb-2">
        <v-col cols="4" class="font-weight-bold">세금계산서</v-col>
        <v-col cols="8">{{ schedule.invoice ? 'O' : 'X' }}</v-col>
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

      <!-- 연기 상태일 때 날짜 선택 -->
      <v-row v-if="schedule.status === '연기'">
        <v-col cols="4" class="font-weight-bold">변경할 날짜</v-col>
        <v-col cols="8">
          <v-date-picker
            v-model="newDate"
            :min="today"
            @update:modelValue="applyNewDate"
            show-adjacent-months
            color="primary"
            elevation="2"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="4" class="font-weight-bold">메모</v-col>
        <v-col cols="8">{{ schedule.memo || '-' }}</v-col>
      </v-row>
    </v-card>

    <v-btn color="primary" class="mr-2" @click="goToEdit">수정</v-btn>
    <v-btn color="error" class="mr-2" @click="cancelSchedule">작업취소</v-btn>
    <v-btn color="secondary" class="mr-2" @click="goBack">뒤로가기</v-btn>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const schedule = ref({})
const newDate = ref('')
const statusOptions = ['진행', '연기', '보류', '완료']
const today = new Date().toISOString().split('T')[0]

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

function formatDateToYYYYMMDD(date) {
  if (typeof date === 'string') return date
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().split('T')[0]
}

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

  const formatted = formatDateToYYYYMMDD(newDate.value)
  if (formatted < today) {
    alert('오늘 이전 날짜는 선택할 수 없습니다.')
    return
  }

  const docRef = doc(db, 'schedules', schedule.value.id)
  await updateDoc(docRef, {
    date: formatted,
    status: '진행'
  })

  schedule.value.date = formatted
  schedule.value.status = '진행'
  alert('일정이 변경됐습니다.')
  router.back()
}

async function cancelSchedule() {
  const ok = confirm('정말 이 작업을 취소하시겠습니까?')
  if (!ok) return
  const docRef = doc(db, 'schedules', schedule.value.id)
  await updateDoc(docRef, { status: '취소됨' })
  alert('작업이 취소되었습니다.')
  router.back()
}

function goToEdit() {
  router.push(`/schedule/${schedule.value.id}/edit`)
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.font-weight-bold {
  font-weight: bold;
}
</style>