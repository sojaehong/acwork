<template>
  <v-app>
    <!-- 🎨 일관된 헤더 디자인 -->
    <v-app-bar :elevation="0" class="custom-header" height="80">
      <div class="d-flex align-center justify-space-between w-100 px-4">
        <div class="d-flex align-center">
          <v-btn icon size="large" class="back-btn mr-3" @click="goHome">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div class="header-icon-wrapper">
            <v-icon size="32" color="white">mdi-calendar-edit</v-icon>
          </div>
          <div class="ml-3">
            <h2 class="header-title">일정 관리</h2>
            <div class="header-subtitle">작업자 배정 및 일정 설정</div>
          </div>
        </div>

        <div class="d-flex align-center">
          <!-- 편집/신규 상태 표시 -->
          <v-chip
            :color="isEdit ? 'warning' : 'success'"
            size="small"
            class="mr-2"
          >
            <v-icon start size="14">{{
              isEdit ? 'mdi-pencil' : 'mdi-plus'
            }}</v-icon>
            {{ isEdit ? '편집 모드' : '신규 등록' }}
          </v-chip>
        </div>
      </div>
    </v-app-bar>

    <v-main class="main-content">
      <!-- 🌀 로딩 오버레이 -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-container">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            width="6"
          />
          <div class="loading-text mt-4">일정 정보 로딩 중...</div>
        </div>
      </div>

      <v-container
        class="pa-6"
        style="padding-bottom: 140px !important; max-width: 1200px"
      >
        <!-- 🚨 에러 알림 -->
        <v-alert v-if="error" type="error" class="mb-6" prominent>
          <v-icon start>mdi-alert-circle</v-icon>
          {{ error }}
        </v-alert>

        <!-- 📅 기존 일정 목록 -->
        <v-card
          v-if="existingDatesDisplay.length"
          class="schedule-list-card mb-8"
          elevation="0"
        >
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-calendar-multiple</v-icon>
            </div>
            <h3 class="card-title">기존 일정 목록</h3>
            <v-chip color="info" size="small" class="ml-2">
              {{ existingDatesDisplay.length }}개
            </v-chip>
          </div>

          <div class="card-content">
            <div class="schedule-scroll">
              <div
                v-for="item in existingDatesDisplay"
                :key="`${item.date}-${metaMap[item.date]?.startTime || ''}`"
                class="schedule-item"
                :class="{ selected: selectedDate === item.date }"
                @click="handleDateSelect(item.date)"
              >
                <div class="schedule-date">{{ item.display }}</div>
                <div class="schedule-details">
                  <div class="detail-row">
                    <v-icon size="14" color="grey-darken-1"
                      >mdi-clock-outline</v-icon
                    >
                    <span>{{
                      metaMap[item.date]?.startTime || '시간 미정'
                    }}</span>
                  </div>
                  <div class="detail-row">
                    <v-icon size="14" color="grey-darken-1"
                      >mdi-account-group</v-icon
                    >
                    <span>{{
                      metaMap[item.date]?.workerNames?.join(', ') || '인원 미정'
                    }}</span>
                  </div>
                </div>
                <div
                  v-if="selectedDate === item.date"
                  class="selected-indicator"
                >
                  <v-icon color="primary">mdi-check-circle</v-icon>
                </div>
              </div>
            </div>
          </div>
        </v-card>

        <!-- 📅 날짜 선택 카드 -->
        <v-card class="form-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-calendar</v-icon>
            </div>
            <h3 class="card-title">작업 날짜</h3>
            <v-chip color="error" size="small" class="ml-2">필수</v-chip>
          </div>

          <div class="card-content">
            <v-text-field
              v-model="form.date"
              label="작업 날짜를 선택하세요"
              type="date"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-calendar"
              @change="handleDateChange"
            />
          </div>
        </v-card>

        <!-- 🕐 시작 시간 카드 -->
        <v-card class="form-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-clock</v-icon>
            </div>
            <h3 class="card-title">시작 시간</h3>
            <v-chip color="warning" size="small" class="ml-2">선택사항</v-chip>
          </div>

          <div class="card-content">
            <v-text-field
              v-model="form.startTime"
              label="시작 시간 (예: 09:00)"
              type="time"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-clock-outline"
            />
          </div>
        </v-card>

        <!-- 👥 작업자 선택 카드 -->
        <v-card class="form-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-account-group</v-icon>
            </div>
            <h3 class="card-title">작업 인원</h3>
            <v-chip
              :color="form.workers.length > 0 ? 'success' : 'warning'"
              size="small"
              class="ml-2"
            >
              {{ form.workers.length }}명 선택됨
            </v-chip>
          </div>

          <div class="card-content">
            <v-select
              v-model="form.workers"
              :items="userOptions"
              item-title="name"
              item-value="id"
              multiple
              chips
              variant="outlined"
              label="작업자를 선택하세요"
              prepend-inner-icon="mdi-account-multiple"
              clearable
            >
              <template #chip="{ props, item }">
                <v-chip
                  v-bind="props"
                  color="primary"
                  variant="flat"
                  size="small"
                  class="ma-1"
                >
                  <v-icon start size="14">mdi-account</v-icon>
                  {{ item.title }}
                </v-chip>
              </template>
            </v-select>

            <!-- 선택된 작업자 미리보기 -->
            <div v-if="form.workers.length > 0" class="selected-workers">
              <label class="workers-label">선택된 작업자</label>
              <div class="workers-grid">
                <div
                  v-for="workerId in form.workers"
                  :key="workerId"
                  class="worker-item"
                >
                  <v-avatar size="32" color="primary">
                    <v-icon color="white">mdi-account</v-icon>
                  </v-avatar>
                  <span class="worker-name">{{ getUserName(workerId) }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card>

        <!-- 📢 공지사항 카드 -->
        <v-card class="form-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-bullhorn</v-icon>
            </div>
            <h3 class="card-title">공지사항</h3>
            <v-chip color="grey" size="small" class="ml-2">선택사항</v-chip>
          </div>

          <div class="card-content">
            <v-textarea
              v-model="form.notice"
              label="공지사항이나 특이사항을 입력하세요"
              variant="outlined"
              rows="4"
              auto-grow
              prepend-inner-icon="mdi-note-text"
            />
          </div>
        </v-card>
      </v-container>

      <!-- 🎯 하단 액션 버튼 -->
      <div class="floating-actions">
        <v-row dense v-if="isEdit">
          <v-col cols="4">
            <v-btn
              variant="outlined"
              size="large"
              block
              class="action-btn home-btn"
              @click="goHome"
            >
              <v-icon start>mdi-home</v-icon>
              홈으로
            </v-btn>
          </v-col>
          <v-col cols="4">
            <v-btn
              color="error"
              size="large"
              block
              class="action-btn cancel-btn"
              :loading="isSaving"
              @click="cancelSchedule"
            >
              <v-icon start>mdi-delete</v-icon>
              일정 삭제
            </v-btn>
          </v-col>
          <v-col cols="4">
            <v-btn
              color="primary"
              size="large"
              block
              class="action-btn save-btn"
              :loading="isSaving"
              @click="submit"
            >
              <v-icon start>mdi-content-save</v-icon>
              수정 완료
            </v-btn>
          </v-col>
        </v-row>

        <v-row dense v-else>
          <v-col cols="6">
            <v-btn
              variant="outlined"
              size="large"
              block
              class="action-btn home-btn"
              @click="goHome"
            >
              <v-icon start>mdi-home</v-icon>
              홈으로
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              color="primary"
              size="large"
              block
              class="action-btn save-btn"
              :loading="isSaving"
              @click="submit"
            >
              <v-icon start>mdi-plus</v-icon>
              일정 등록
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { getTodayDateKST } from '@/utils/date'

const router = useRouter()
const today = getTodayDateKST()

const form = ref({
  date: today,
  startTime: '',
  workers: [],
  notice: '',
  paidMap: {},
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

const getUserName = (userId) => {
  return userMap.value[userId] || '알 수 없음'
}

async function fetchUsers() {
  const snap = await getDocs(collection(db, 'users'))
  userOptions.value = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
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
        workerNames: (data.workers || []).map(
          (id) => userMap.value[id] || '알 수 없음'
        ),
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
  existingDatesDisplay.value = sortedDates.map((dateStr) => ({
    date: dateStr,
    display: formatDateWithDay(dateStr),
  }))

  metaMap.value = meta

  const firstFutureOrToday = sortedDates.find(
    (d) => new Date(d) >= new Date(todayDateStr)
  )
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

  // 기본 검증
  if (!form.value.date) {
    showErrorMessage('날짜를 선택해주세요.')
    return
  }

  isSaving.value = true
  error.value = ''

  try {
    if (isEdit.value && editDocId) {
      await updateDoc(doc(db, 'schedulesMeta', editDocId), {
        ...form.value,
        updatedAt: serverTimestamp(),
      })
      showSuccessMessage('일정이 성공적으로 수정되었습니다.')
    } else {
      await addDoc(collection(db, 'schedulesMeta'), {
        ...form.value,
        createdAt: serverTimestamp(),
        paidMap: {},
      })
      showSuccessMessage('일정이 성공적으로 등록되었습니다.')
    }
    await fetchExistingDates()
  } catch (err) {
    console.error('저장 중 오류:', err)
    showErrorMessage('저장 중 오류가 발생했습니다.')
  } finally {
    isSaving.value = false
  }
}

async function cancelSchedule() {
  if (isSaving.value) return
  if (editDocId && confirm('정말 이 일정을 삭제하시겠습니까?')) {
    isSaving.value = true
    error.value = ''
    try {
      await deleteDoc(doc(db, 'schedulesMeta', editDocId))
      showSuccessMessage('일정이 삭제되었습니다.')
      await fetchExistingDates()
    } catch (err) {
      console.error('삭제 중 오류:', err)
      showErrorMessage('삭제 중 오류가 발생했습니다.')
    } finally {
      isSaving.value = false
    }
  }
}

function goHome() {
  router.push('/')
}

function showSuccessMessage(message) {
  const snackbar = document.createElement('div')
  snackbar.className = 'success-snackbar'
  snackbar.textContent = message
  document.body.appendChild(snackbar)
  setTimeout(() => {
    if (document.body.contains(snackbar)) {
      document.body.removeChild(snackbar)
    }
  }, 3000)
}

function showErrorMessage(message) {
  const snackbar = document.createElement('div')
  snackbar.className = 'error-snackbar'
  snackbar.textContent = message
  document.body.appendChild(snackbar)
  setTimeout(() => {
    if (document.body.contains(snackbar)) {
      document.body.removeChild(snackbar)
    }
  }, 3000)
}

onMounted(async () => {
  await fetchUsers()
  await fetchExistingDates()
})
</script>

<style scoped>
/* 🎨 헤더 스타일 - 일관성 유지 */
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 12px;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.header-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.header-title {
  color: white;
  font-weight: 700;
  font-size: 24px;
  margin: 0;
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 500;
}

/* 🌀 로딩 및 메인 컨텐츠 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-container {
  text-align: center;
}

.loading-text {
  font-weight: 600;
  color: #666;
  font-size: 16px;
}

.main-content {
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

/* 📅 일정 목록 카드 */
.schedule-list-card,
.form-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.schedule-list-card:hover,
.form-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.card-content {
  padding: 24px;
}

/* 📅 일정 스크롤 */
.schedule-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 12px;
}

.schedule-item {
  flex-shrink: 0;
  width: 280px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.schedule-item:hover {
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.schedule-item.selected {
  border-color: #4f46e5;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

.schedule-date {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
}

.schedule-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
}

.selected-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
}

/* 👥 작업자 선택 */
.selected-workers {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.workers-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 12px;
}

.workers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.worker-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f1f5f9;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.worker-item:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.worker-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

/* 🎯 플로팅 액션 버튼 */
.floating-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 20px;
}

.action-btn {
  height: 56px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.home-btn {
  border: 2px solid #e2e8f0;
  color: #1e293b !important;
}

.home-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b !important;
}

.home-btn .v-btn__content {
  color: #1e293b !important;
}

.cancel-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

.cancel-btn:hover {
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.save-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.save-btn:hover {
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

/* 📱 성공/에러 스낵바 */
.success-snackbar,
.error-snackbar {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  font-weight: 600;
  z-index: 10000;
  animation: slideInDown 0.3s ease;
}

.success-snackbar {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
}

.error-snackbar {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 🎯 반응형 디자인 */
@media (max-width: 768px) {
  .schedule-scroll {
    gap: 12px;
  }

  .schedule-item {
    width: 240px;
    padding: 16px;
  }

  .workers-grid {
    grid-template-columns: 1fr;
  }

  .floating-actions {
    padding: 16px;
  }

  .action-btn {
    height: 52px;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 20px;
  }

  .card-header {
    padding: 16px 20px;
  }

  .card-content {
    padding: 20px;
  }

  .card-title {
    font-size: 16px;
  }

  .schedule-item {
    width: 200px;
    padding: 14px;
  }

  .schedule-date {
    font-size: 14px;
  }
}
</style>
