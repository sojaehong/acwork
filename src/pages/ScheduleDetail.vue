<template>
  <v-container class="pa-4 pb-16">
    <h2 class="text-h5 mb-4">📄 작업 상세 보기</h2>

    <v-card class="pa-4 mb-4" elevation="2">
      <v-row class="mb-3">
        <v-col cols="12" sm="6">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-1">날짜</div>
            <div>{{ schedule.date }}</div>
          </v-sheet>
        </v-col>
        <v-col cols="12" sm="6">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-1">건물 정보</div>
            <div>{{ schedule.building }} {{ schedule.unit }}동 {{ schedule.room }}호</div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-divider class="my-3" />

      <v-row class="mb-3">
        <v-col cols="12">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-2">🛠 작업 내용</div>
            <v-list dense>
              <v-list-item v-for="(task, i) in schedule.tasks" :key="i">
                <v-list-item-content>
                  {{ task.name }} ({{ task.count }})
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="mb-3">
        <v-col cols="6">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-1">세금계산서</div>
            <div>{{ schedule.invoice ? 'O' : 'X' }}</div>
          </v-sheet>
        </v-col>
        <v-col cols="6">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-1">작업 상태</div>
            <div>
              <v-btn
                v-for="s in statusOptions"
                :key="s"
                :color="schedule.status === s ? 'primary' : 'grey-lighten-2'"
                class="mr-2 mb-2"
                size="small"
                @click="updateStatus(s)"
              >
                {{ s }}
              </v-btn>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row v-if="schedule.status === '연기'">
        <v-col cols="12">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-2">📆 변경할 날짜</div>
            <v-dialog v-model="pickerOpen" width="290">
              <template #activator="{ props }">
                <v-text-field
                  v-bind="props"
                  v-model="displayDate"
                  label="변경 날짜 선택"
                  readonly
                  prepend-icon="mdi-calendar"
                />
              </template>

              <v-date-picker
                v-model="newDate"
                :min="today"
                @update:modelValue="onDateSelected"
                scrollable
                color="primary"
              />
            </v-dialog>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-sheet class="pa-3 rounded bg-grey-lighten-4">
            <div class="font-weight-bold text-subtitle-1 mb-1">🗒 메모</div>
            <div>{{ schedule.memo || '-' }}</div>
          </v-sheet>
        </v-col>
      </v-row>
    </v-card>
  </v-container>

  <!-- 하단 고정 버튼 영역 -->
  <v-container
    class="pa-2"
    style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
  >
    <v-row dense>
      <v-col cols="4">
        <v-btn color="primary" block @click="goToEdit">수정</v-btn>
      </v-col>
      <v-col cols="4">
        <v-btn color="error" block @click="cancelSchedule">작업취소</v-btn>
      </v-col>
      <v-col cols="4">
        <v-btn color="secondary" block @click="goBack">뒤로가기</v-btn>
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

async function onDateSelected(val) {
  displayDate.value = formatDateToYYYYMMDD(val)
  pickerOpen.value = false
  await applyNewDate()
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
