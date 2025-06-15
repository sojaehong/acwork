<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16">
        <h2 class="text-h5 mb-4 responsive-title">일정 관리</h2>

        <!-- 에러 표시 -->
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

        <!-- 중앙 로딩 -->
        <v-progress-circular
          v-if="isLoading"
          indeterminate
          color="primary"
          size="48"
          width="5"
          style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 999;"
        ></v-progress-circular>

        <!-- 기존 날짜 목록 -->
        <div v-if="existingDatesDisplay.length" class="mb-4">
          <v-slide-group
            v-model="selectedDate"
            class="pa-2"
            show-arrows
            center-active
            @update:modelValue="handleDateSelect"
          >
            <v-slide-group-item
              v-for="item in existingDatesDisplay"
              :key="`${item.date}-${metaMap[item.date]?.startTime || ''}`"
              :value="item.date"
            >
              <v-card
                class="ma-2 pa-2"
                :color="selectedDate === item.date ? 'primary' : 'grey lighten-2'"
                :dark="selectedDate === item.date"
                style="width: 180px; cursor: pointer"
                @click="handleDateSelect(item.date)"
              >
                <div class="text-subtitle-2">{{ item.display }}</div>
                <div class="text-caption mt-1">
                  시작: {{ metaMap[item.date]?.startTime || '-' }}<br />
                  인원: {{ metaMap[item.date]?.workerNames?.join(', ') || '-' }}
                </div>
              </v-card>
            </v-slide-group-item>
          </v-slide-group>
        </div>

        <!-- 날짜 선택 -->
        <v-text-field v-model="form.date" label="작업 날짜" type="date" outlined class="mb-4" @change="handleDateChange" />

        <!-- 시작 시간 -->
        <v-text-field v-model="form.startTime" label="시작 시간 (예: 09:00)" type="time" outlined class="mb-4" />

        <!-- 작업자 선택 -->
        <div class="mb-4">
          <div class="mb-2">작업 인원</div>
          <v-select
            v-model="form.workers"
            :items="userOptions"
            item-title="name"
            item-value="id"
            multiple
            chips
            outlined
            label="작업자를 선택하세요"
          />
        </div>

        <!-- 공지사항 -->
        <v-textarea
          v-model="form.notice"
          label="공지사항 (선택사항)"
          outlined
          rows="3"
          class="mb-4"
        />
      </v-container>

      <!-- 하단 고정 버튼 -->
      <v-container
        class="pa-2"
        style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
      >
        <v-row dense>
          <template v-if="isEdit">
            <v-col cols="4">
              <v-btn color="secondary" block class="responsive-btn" @click="goHome">홈으로</v-btn>
            </v-col>
            <v-col cols="4">
              <v-btn color="error" block :loading="isSaving" class="responsive-btn" @click="cancelSchedule">일정 취소</v-btn>
            </v-col>
            <v-col cols="4">
              <v-btn color="primary" block :loading="isSaving" class="responsive-btn" @click="submit">저장</v-btn>
            </v-col>
          </template>

          <template v-else>
            <v-col cols="6">
              <v-btn color="secondary" block class="responsive-btn" @click="goHome">홈으로</v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn color="primary" block :loading="isSaving" class="responsive-btn" @click="submit">저장</v-btn>
            </v-col>
          </template>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import {
  collection, addDoc, getDocs, query, where, doc, getDoc,
  updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore'
import { getTodayDateKST } from '@/utils/date'

const router = useRouter()
const today = getTodayDateKST()

const form = ref({
  date: today,
  startTime: '',
  workers: [],
  notice: '',
  paidMap: {}
})

const userOptions = ref([])
const userMap = ref({})

const existingDates = ref([])
const existingDatesDisplay = ref([])
const selectedDate = ref(today)
const metaMap = ref({})

const isEdit = ref(false)
let editDocId = null

const isLoading = ref(false)
const isSaving = ref(false)
const error = ref('')

async function fetchUsers() {
  const snap = await getDocs(collection(db, 'users'))
  userOptions.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  userMap.value = {}
  for (const user of userOptions.value) {
    userMap.value[user.id] = user.name
  }
}

async function fetchExistingDates() {
  isLoading.value = true
  const snap = await getDocs(collection(db, 'schedulesMeta'))
  const dates = new Set()
  const meta = {}

  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    if (data.date) {
      dates.add(data.date)
      meta[data.date] = {
        startTime: data.startTime,
        workerNames: (data.workers || []).map(id => userMap.value[id] || '알 수 없음')
      }
    }
  }

  const todayDateStr = getTodayDateKST()
  const sortedDates = Array.from(dates).sort((a, b) => {
    const isAFuture = new Date(a) >= new Date(todayDateStr)
    const isBFuture = new Date(b) >= new Date(todayDateStr)
    if (isAFuture && isBFuture) return new Date(a) - new Date(b)
    if (!isAFuture && !isBFuture) return new Date(b) - new Date(a)
    return isAFuture ? -1 : 1
  })

  existingDates.value = sortedDates
  existingDatesDisplay.value = sortedDates.map(dateStr => ({
    date: dateStr,
    display: formatDateWithDay(dateStr)
  }))

  metaMap.value = meta

  const firstFutureOrToday = sortedDates.find(d => new Date(d) >= new Date(todayDateStr))
  if (firstFutureOrToday) {
    selectedDate.value = firstFutureOrToday
    await handleDateSelect(firstFutureOrToday)
  } else {
    form.value.date = todayDateStr
    selectedDate.value = todayDateStr
    clearForm()
  }
  isLoading.value = false
}

function formatDateWithDay(dateStr) {
  const date = new Date(dateStr)
  const day = date.toLocaleDateString('ko-KR', { weekday: 'short' })
  return `${dateStr} (${day})`
}

function clearForm() {
  form.value.startTime = ''
  form.value.workers = []
  form.value.notice = ''
  form.value.paidMap = {}
  editDocId = null
  isEdit.value = false
}

async function handleDateChange() {
  await handleDateSelect(form.value.date)
}

async function handleDateSelect(date) {
  form.value.date = date
  selectedDate.value = date
  const q = query(collection(db, 'schedulesMeta'), where('date', '==', date))
  const snap = await getDocs(q)
  if (!snap.empty) {
    const docSnap = snap.docs[0]
    const existing = docSnap.data()
    form.value.startTime = existing.startTime
    form.value.workers = existing.workers
    form.value.notice = existing.notice
    form.value.paidMap = existing.paidMap || {}
    editDocId = docSnap.id
    isEdit.value = true
  } else {
    clearForm()
  }
}

async function submit() {
  if (isSaving.value) return
  isSaving.value = true
  error.value = ''
  try {
    if (isEdit.value && editDocId) {
      await updateDoc(doc(db, 'schedulesMeta', editDocId), {
        ...form.value,
        updatedAt: serverTimestamp()
      })
      alert('일정이 수정되었습니다.')
    } else {
      await addDoc(collection(db, 'schedulesMeta'), {
        ...form.value,
        createdAt: serverTimestamp(),
        paidMap: {}
      })
      alert('일정이 등록되었습니다.')
    }
    await fetchExistingDates()
  } catch (err) {
    console.error('저장 중 오류:', err)
    error.value = '저장 중 오류가 발생했습니다.'
  } finally {
    isSaving.value = false
  }
}

async function cancelSchedule() {
  if (isSaving.value) return
  if (editDocId && confirm('정말 이 일정을 취소하시겠습니까?')) {
    isSaving.value = true
    error.value = ''
    try {
      await deleteDoc(doc(db, 'schedulesMeta', editDocId))
      alert('일정이 취소되었습니다.')
      await fetchExistingDates()
    } catch (err) {
      console.error('삭제 중 오류:', err)
      error.value = '삭제 중 오류가 발생했습니다.'
    } finally {
      isSaving.value = false
    }
  }
}

function goHome() {
  router.push('/')
}

onMounted(async () => {
  await fetchUsers()
  await fetchExistingDates()
})
</script>

<style scoped>
.v-bottom-navigation {
  display: none;
}
</style>
