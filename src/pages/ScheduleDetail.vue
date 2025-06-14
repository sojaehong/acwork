<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16">
        <h2 class="text-h5 mb-4 responsive-title">📄 작업 상세 보기</h2>

        <v-progress-circular
          v-if="isLoading"
          indeterminate
          color="primary"
          size="48"
          width="5"
          style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 999;"
        />

        <transition name="fade-stagger">
          <v-card v-if="!isLoading" class="pa-4 mb-4" elevation="2">
            <!-- 날짜 & 위치 -->
            <v-row class="mb-3">
              <v-col cols="12" sm="6">
                <v-sheet class="pa-3 rounded bg-grey-lighten-4">
                  <div class="font-weight-bold text-subtitle-1 mb-1">📅 날짜</div>
                  <div>{{ schedule?.date }}</div>
                </v-sheet>
              </v-col>
              <v-col cols="12" sm="6">
                <v-sheet class="pa-3 rounded bg-grey-lighten-4">
                  <div class="font-weight-bold text-subtitle-1 mb-1">🏢 건물 정보</div>
                  <div>{{ schedule?.building }} {{ schedule?.unit }}동 {{ schedule?.room }}호</div>
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
                      v-for="(task, i) in schedule?.tasks || []"
                      :key="`${task.name}-${i}`"
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

            <!-- 세금계산서 & 상태 -->
            <v-row class="mb-3">
              <v-col cols="12" md="6">
                <v-sheet class="pa-3 rounded bg-grey-lighten-4">
                  <div class="font-weight-bold text-subtitle-1 mb-1">📄 세금계산서</div>
                  <div>{{ schedule?.invoice ? 'O' : 'X' }}</div>
                </v-sheet>
              </v-col>
              <v-col cols="12" md="6">
                <v-sheet class="pa-3 rounded bg-grey-lighten-4">
                  <div class="font-weight-bold text-subtitle-1 mb-1">🔁 작업 상태</div>
                  <v-btn-toggle
                    v-model="status"
                    @update:modelValue="updateStatus"
                    mandatory
                    color="primary"
                    variant="tonal"
                    class="mt-2 flex-wrap"
                  >
                    <v-btn v-for="s in statusOptions" :key="s" :value="s" class="ma-1">{{ s }}</v-btn>
                  </v-btn-toggle>
                </v-sheet>
              </v-col>
            </v-row>

            <!-- 보류일 경우 날짜 변경 -->
            <v-row v-if="status === '보류'">
              <v-col cols="12">
                <v-sheet class="pa-3 rounded bg-grey-lighten-4">
                  <div class="font-weight-bold text-subtitle-1 mb-2">📆 변경할 날짜</div>
                  <v-dialog v-model="pickerOpen" scrollable persistent max-width="95vw">
                    <template #activator="{ props }">
                      <v-text-field
                        v-bind="props"
                        v-model="displayDate"
                        label="변경 날짜 선택"
                        readonly
                        prepend-icon="mdi-calendar"
                      />
                    </template>
                    <v-card style="max-height: 90vh; overflow-y: auto;">
                      <v-date-picker v-model="newDate" :min="today" scrollable color="primary" />
                      <v-card-actions class="justify-end">
                        <v-btn text @click="pickerOpen = false">닫기</v-btn>
                        <v-btn color="primary" :loading="isSaving" @click="applyNewDate">적용</v-btn>
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
                  <div class="text-grey-darken-1 text-body-2">{{ schedule?.memo || '-' }}</div>
                </v-sheet>
              </v-col>
            </v-row>
          </v-card>
        </transition>
      </v-container>

      <!-- 하단 버튼 -->
      <v-container class="pa-2" style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);">
        <v-row dense>
          <v-col cols="4">
            <v-btn color="primary" block class="responsive-btn" @click="goBack">뒤로가기</v-btn>
          </v-col>
          <v-col cols="4">
            <v-btn
              v-if="schedule?.status === '취소됨'"
              color="error"
              block
              class="responsive-btn"
              :loading="isSaving"
              @click="deleteSchedule"
            >삭제하기</v-btn>
            <v-btn
              v-else
              color="error"
              block
              class="responsive-btn"
              :loading="isSaving"
              @click="cancelSchedule"
            >작업취소</v-btn>
          </v-col>
          <v-col cols="4">
            <v-btn color="secondary" block class="responsive-btn" :loading="isSaving" @click="goToEdit">수정</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { useScheduleStore } from '@/stores/schedule'

const route = useRoute()
const router = useRouter()
const scheduleStore = useScheduleStore()

const schedule = ref({})
const status = ref('')
const newDate = ref('')
const displayDate = ref('')
const pickerOpen = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const statusOptions = ['진행', '보류', '완료']
const today = new Date().toISOString().split('T')[0]

onMounted(async () => {
  const id = route.params.id
  try {
    isLoading.value = true
    if (!scheduleStore.schedules.length) {
      const snapshot = await getDocs(query(collection(db, 'schedules'), orderBy('date', 'desc')))
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      scheduleStore.setSchedules(fetched)
    }
    let target = scheduleStore.schedules.find(s => s.id === id)
    if (!target) {
      const snap = await getDoc(doc(db, 'schedules', id))
      if (snap.exists()) {
        target = { id: snap.id, ...snap.data() }
        scheduleStore.setSchedules([...scheduleStore.schedules, target])
      } else {
        alert('해당 일정을 찾을 수 없습니다.')
        return router.push('/schedules')
      }
    }
    schedule.value = target
    status.value = target.status || '진행'
    displayDate.value = target.date
  } catch (err) {
    alert('일정 데이터를 불러오는 중 오류가 발생했습니다.')
    router.push('/schedules')
  } finally {
    isLoading.value = false
  }
})

function formatDateToYYYYMMDD(date) {
  if (typeof date === 'string') return date
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().split('T')[0]
}

async function updateStatus(newStatus) {
  if (isSaving.value || !schedule.value.id) return
  isSaving.value = true
  try {
    const docRef = doc(db, 'schedules', schedule.value.id)
    await updateDoc(docRef, { status: newStatus })
    schedule.value.status = newStatus
    status.value = newStatus
    const index = scheduleStore.schedules.findIndex(s => s.id === schedule.value.id)
    if (index !== -1) scheduleStore.schedules[index].status = newStatus
  } finally {
    isSaving.value = false
  }
}

async function applyNewDate() {
  if (!newDate.value) return
  const formatted = formatDateToYYYYMMDD(newDate.value)
  if (formatted < today) {
    alert('오늘 이전 날짜는 선택할 수 없습니다.')
    return
  }
  isSaving.value = true
  try {
    const docRef = doc(db, 'schedules', schedule.value.id)
    await updateDoc(docRef, { date: formatted, status: '진행' })
    schedule.value.date = formatted
    schedule.value.status = '진행'
    status.value = '진행'
    displayDate.value = formatted
    const index = scheduleStore.schedules.findIndex(s => s.id === schedule.value.id)
    if (index !== -1) {
      scheduleStore.schedules[index].date = formatted
      scheduleStore.schedules[index].status = '진행'
    }
    alert('일정이 변경됐습니다.')
  } finally {
    isSaving.value = false
    pickerOpen.value = false
  }
}

async function cancelSchedule() {
  if (isSaving.value) return
  const ok = confirm('정말 이 작업을 취소하시겠습니까?')
  if (!ok) return
  isSaving.value = true
  try {
    const docRef = doc(db, 'schedules', schedule.value.id)
    await updateDoc(docRef, { status: '취소됨' })
    const index = scheduleStore.schedules.findIndex(s => s.id === schedule.value.id)
    if (index !== -1) scheduleStore.schedules[index].status = '취소됨'
    alert('작업이 취소되었습니다.')
    router.back()
  } finally {
    isSaving.value = false
  }
}

async function deleteSchedule() {
  if (isSaving.value || !schedule.value.id) return
  const ok = confirm('정말 이 취소된 작업을 완전히 삭제하시겠습니까? 복구할 수 없습니다.')
  if (!ok) return
  isSaving.value = true
  try {
    await deleteDoc(doc(db, 'schedules', schedule.value.id))
    scheduleStore.setSchedules(scheduleStore.schedules.filter(s => s.id !== schedule.value.id))
    alert('작업이 완전히 삭제되었습니다.')
    router.push('/schedules')
  } catch (err) {
    alert('삭제 중 오류 발생')
  } finally {
    isSaving.value = false
  }
}

function goToEdit() {
  router.push(`/schedule/${schedule.value.id}/edit`)
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.font-weight-bold { font-weight: bold; }
.fade-stagger-enter-active { transition: all 0.3s ease; }
.fade-stagger-enter-from { opacity: 0; transform: translateY(8px); }
.fade-stagger-enter-to { opacity: 1; transform: translateY(0); }
.fade-stagger-leave-active { transition: all 0.2s ease; opacity: 0; transform: translateY(8px); }
</style>
