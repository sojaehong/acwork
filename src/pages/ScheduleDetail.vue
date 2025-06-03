<template>
  <v-container class="pa-4 pb-16">
    <h2 class="text-h5 mb-4">📄 작업 상세 보기</h2>

    <v-card class="pa-4 mb-4" elevation="2">
      <!-- 날짜 & 위치 -->
      <v-row class="mb-3">
        <v-col cols="12" sm="6">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-1">📅 날짜</div>
            <div>{{ schedule.date }}</div>
          </v-sheet>
        </v-col>
        <v-col cols="12" sm="6">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-1">🏢 건물 정보</div>
            <div>{{ schedule.building }} {{ schedule.unit }}동 {{ schedule.room }}호</div>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- 작업 내용 -->
      <v-row class="mb-3">
        <v-col cols="12">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-2">🛠 작업 내용</div>
            <div>
              <v-chip
                v-for="(task, i) in schedule.tasks"
                :key="i"
                class="ma-1"
                color="secondary"
                variant="tonal"
                size="small"
              >
                {{ task.name }} ({{ task.count }})
              </v-chip>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- 세금계산서 & 작업 상태 -->
      <v-row class="mb-3">
        <v-col cols="6">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-1">📄 세금계산서</div>
            <div>{{ schedule.invoice ? 'O' : 'X' }}</div>
          </v-sheet>
        </v-col>
        <v-col cols="6">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-1">🔁 작업 상태</div>
            <v-btn-toggle
              v-model="status"
              @update:modelValue="updateStatus"
              mandatory
              color="primary"
              variant="tonal"
              class="mt-2 d-flex flex-wrap"
            >
              <v-btn v-for="s in statusOptions" :key="s" :value="s" class="ma-1">{{ s }}</v-btn>
            </v-btn-toggle>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- 연기 날짜 선택 -->
      <v-row v-if="status === '연기'">
        <v-col cols="12">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-2">📆 변경할 날짜</div>
            <v-dialog v-model="pickerOpen" fullscreen scrollable>
              <template #activator="{ props }">
                <v-text-field
                  v-bind="props"
                  v-model="displayDate"
                  label="변경 날짜 선택"
                  readonly
                  prepend-icon="mdi-calendar"
                />
              </template>
              <v-card>
                <v-date-picker
                  v-model="newDate"
                  :min="today"
                  scrollable
                  color="primary"
                />
                <v-card-actions class="justify-end">
                  <v-btn text @click="pickerOpen = false">닫기</v-btn>
                  <v-btn color="primary" @click="applyNewDate">적용</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- 메모 -->
      <v-row>
        <v-col cols="12">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-1">🗒 메모</div>
            <div class="text-grey-darken-1 text-body-2">{{ schedule.memo || '-' }}</div>
          </v-sheet>
        </v-col>
      </v-row>
    </v-card>
  </v-container>

  <!-- 하단 고정 버튼 -->
  <v-container
    class="pa-2"
    style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
  >
    <v-row dense>
      <v-col cols="4">
        <v-btn color="grey-darken-1" block @click="goBack">뒤로가기</v-btn>
      </v-col>
      <v-col cols="4">
        <v-btn color="error" block @click="cancelSchedule">작업취소</v-btn>
      </v-col>
      <v-col cols="4">
        <v-btn color="primary" block @click="goToEdit">수정</v-btn>
      </v-col>
    </v-row>
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
const status = ref('')
const newDate = ref('')
const displayDate = ref('')
const pickerOpen = ref(false)

const statusOptions = ['진행', '연기', '보류', '완료']
const today = new Date().toISOString().split('T')[0]

onMounted(async () => {
  const id = route.params.id
  const docRef = doc(db, 'schedules', id)
  const snap = await getDoc(docRef)
  if (snap.exists()) {
    const data = snap.data()
    schedule.value = { id: snap.id, ...data }
    status.value = data.status || '진행'
    displayDate.value = data.date
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
  if (newStatus !== '연기') router.back()
}

async function applyNewDate() {
  if (!newDate.value) return
  const formatted = formatDateToYYYYMMDD(newDate.value)
  if (formatted < today) {
    alert('오늘 이전 날짜는 선택할 수 없습니다.')
    return
  }
  const docRef = doc(db, 'schedules', schedule.value.id)
  await updateDoc(docRef, { date: formatted, status: '진행' })
  schedule.value.date = formatted
  schedule.value.status = '진행'
  status.value = '진행'
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
