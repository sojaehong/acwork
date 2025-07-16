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
        <!-- 🚨 에러 알림 - Snackbar로 변경 -->
        <v-snackbar
          v-model="showError"
          color="error"
          location="top"
          timeout="4000"
          multi-line
        >
          <v-icon start>mdi-alert-circle</v-icon>
          {{ error }}
          <template #actions>
            <v-btn variant="text" @click="showError = false">
              닫기
            </v-btn>
          </template>
        </v-snackbar>

        <!-- 성공 메시지 -->
        <v-snackbar
          v-model="showSuccess"
          color="success"
          location="top"
          timeout="3000"
        >
          <v-icon start>mdi-check-circle</v-icon>
          {{ successMessage }}
        </v-snackbar>

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
            <!-- 정렬 옵션 추가 -->
            <v-spacer />
            <v-btn-toggle v-model="sortOption" dense size="small" class="ml-2">
              <v-btn value="date" size="small">
                <v-icon size="14">mdi-calendar</v-icon>
                날짜순
              </v-btn>
              <v-btn value="future" size="small">
                <v-icon size="14">mdi-trending-up</v-icon>
                예정순
              </v-btn>
            </v-btn-toggle>
          </div>

          <div class="card-content">
            <div class="schedule-scroll">
              <div
                v-for="item in sortedExistingDates"
                :key="`${item.date}-${metaMap[item.date]?.startTime || ''}`"
                class="schedule-item"
                :class="{ 
                  selected: selectedDate === item.date,
                  'past-schedule': isPastDate(item.date)
                }"
                @click="handleDateSelect(item.date)"
              >
                <div class="schedule-date">{{ item.display }}</div>
                <div class="schedule-details">
                  <div class="detail-row">
                    <v-icon size="14" color="grey-darken-1">mdi-clock-outline</v-icon>
                    <span>{{ metaMap[item.date]?.startTime || '시간 미정' }}</span>
                  </div>
                  <div class="detail-row">
                    <v-icon size="14" color="grey-darken-1">mdi-account-group</v-icon>
                    <span>{{ metaMap[item.date]?.workerNames?.join(', ') || '인원 미정' }}</span>
                  </div>
                  <!-- 일정 상태 표시 -->
                  <div class="detail-row">
                    <v-chip 
                      :color="isPastDate(item.date) ? 'grey' : 'success'" 
                      size="x-small"
                      variant="flat"
                    >
                      {{ isPastDate(item.date) ? '완료' : '예정' }}
                    </v-chip>
                  </div>
                </div>
                <div v-if="selectedDate === item.date" class="selected-indicator">
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
              :rules="dateRules"
              @change="handleDateChange"
            />
            <!-- 과거 일정 수정 경고 -->
            <v-alert
              v-if="form.date && isPastDate(form.date)"
              type="warning"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              <v-icon start>mdi-alert</v-icon>
              과거 일정을 수정하고 있습니다. 신중하게 변경해주세요.
            </v-alert>
            <!-- 오늘 날짜 빠른 선택 -->
            <div class="mt-3">
              <v-btn
                size="small"
                variant="outlined"
                prepend-icon="mdi-today"
                @click="setToday"
                class="mr-2"
              >
                오늘
              </v-btn>
              <v-btn
                size="small"
                variant="outlined"
                prepend-icon="mdi-calendar-plus"
                @click="setTomorrow"
              >
                내일
              </v-btn>
            </div>
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
            <!-- 자주 사용하는 시간 빠른 선택 -->
            <div class="mt-3">
              <div class="time-preset-label">자주 사용하는 시간</div>
              <v-chip-group v-model="selectedTimePreset" class="mt-2">
                <v-chip
                  v-for="time in timePresets"
                  :key="time"
                  :value="time"
                  size="small"
                  @click="form.startTime = time"
                >
                  {{ time }}
                </v-chip>
              </v-chip-group>
            </div>
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
              :loading="!userOptions.length"
              no-data-text="작업자가 없습니다"
            >
              <template #chip="{ props, item }">
                <v-chip
                  v-bind="props"
                  color="primary"
                  variant="flat"
                  size="small"
                  class="ma-1"
                  closable
                >
                  <v-icon start size="14">mdi-account</v-icon>
                  {{ item.title }}
                </v-chip>
              </template>
            </v-select>

            <!-- 전체 선택/해제 버튼 -->
            <div class="mt-3">
              <v-btn
                size="small"
                variant="outlined"
                prepend-icon="mdi-account-multiple-plus"
                @click="selectAllWorkers"
                class="mr-2"
                :disabled="form.workers.length === userOptions.length"
              >
                전체 선택
              </v-btn>
              <v-btn
                size="small"
                variant="outlined"
                prepend-icon="mdi-account-multiple-minus"
                @click="clearAllWorkers"
                :disabled="form.workers.length === 0"
              >
                전체 해제
              </v-btn>
            </div>

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
              counter="500"
              :rules="noticeRules"
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
              @click="confirmDelete"
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
              :disabled="!isFormValid"
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
              :disabled="!isFormValid"
              @click="submit"
            >
              <v-icon start>mdi-plus</v-icon>
              일정 등록
            </v-btn>
          </v-col>
        </v-row>
      </div>

      <!-- 삭제 확인 다이얼로그 -->
      <v-dialog v-model="showDeleteDialog" max-width="400">
        <v-card>
          <v-card-title class="text-h6">
            <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
            일정 삭제 확인
          </v-card-title>
          <v-card-text>
            선택한 일정을 삭제하시겠습니까?<br>
            <strong>{{ form.date }}</strong> 일정이 완전히 삭제됩니다.
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showDeleteDialog = false">
              취소
            </v-btn>
            <v-btn color="error" @click="deleteSchedule">
              삭제
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getTodayDateKST } from '@/utils/date'

// Pinia Stores
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'
import { useUiStore } from '@/stores/ui'
import { useWorkerStore } from '@/stores/worker'

// Firebase
import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'

const router = useRouter()
const today = getTodayDateKST()

// Store 인스턴스
const scheduleStore = useScheduleStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const workerStore = useWorkerStore()

// 폼 데이터
const form = ref({
  date: today,
  startTime: '',
  workers: [],
  notice: '',
  paidMap: {},
})

// 사용자 관련
const userOptions = ref([])
const userMap = ref({})

// 일정 관련
const existingDates = ref([])
const existingDatesDisplay = ref([])
const selectedDate = ref(today)
const metaMap = ref({})

// 상태 관리
const isEdit = ref(false)
let editDocId = null

const isLoading = ref(false)
const isSaving = ref(false)

// 에러 및 성공 메시지 (Vuetify의 Snackbar 사용)
const error = ref('')
const showError = ref(false)
const successMessage = ref('')
const showSuccess = ref(false)

// 삭제 확인 다이얼로그
const showDeleteDialog = ref(false)

// 정렬 옵션
const sortOption = ref('future')

// 시간 프리셋
const timePresets = ['09:00', '10:00', '13:00', '14:00', '16:00', '18:00']
const selectedTimePreset = ref(null)

// 유효성 검사 규칙 (과거 날짜 제한 완화)
const dateRules = [
  (v) => !!v || '날짜를 선택해주세요'
  // 과거 날짜도 허용 (수정 필요할 수 있음)
]

const noticeRules = [
  (v) => !v || v.length <= 500 || '공지사항은 500자 이내로 입력해주세요'
]

// 계산된 속성들 (과거 날짜 제한 완화)
const isFormValid = computed(() => {
  return form.value.date && 
         (!form.value.notice || form.value.notice.length <= 500)
})

const sortedExistingDates = computed(() => {
  if (sortOption.value === 'date') {
    return [...existingDatesDisplay.value].sort((a, b) => new Date(a.date) - new Date(b.date))
  } else {
    // future 정렬: 오늘 이후 일정을 앞에, 과거 일정을 뒤에
    const todayDateStr = getTodayDateKST()
    return [...existingDatesDisplay.value].sort((a, b) => {
      const isAFuture = new Date(a.date) >= new Date(todayDateStr)
      const isBFuture = new Date(b.date) >= new Date(todayDateStr)
      
      if (isAFuture && isBFuture) return new Date(a.date) - new Date(b.date)
      if (!isAFuture && !isBFuture) return new Date(b.date) - new Date(a.date)
      return isAFuture ? -1 : 1
    })
  }
})

// 메서드들
const getUserName = (userId) => {
  return userMap.value[userId] || '알 수 없음'
}

const isPastDate = (dateStr) => {
  return new Date(dateStr) < new Date(getTodayDateKST())
}

const setToday = () => {
  form.value.date = getTodayDateKST()
  handleDateChange()
}

const setTomorrow = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  form.value.date = tomorrow.toISOString().split('T')[0]
  handleDateChange()
}

const selectAllWorkers = () => {
  form.value.workers = userOptions.value.map(user => user.id)
}

const clearAllWorkers = () => {
  form.value.workers = []
}

const confirmDelete = () => {
  showDeleteDialog.value = true
}

const deleteSchedule = async () => {
  showDeleteDialog.value = false
  await cancelSchedule()
}

// 🔥 개선된 사용자 데이터 로딩 (인증 포함)
async function fetchUsers() {
  try {
    // 인증 상태 확인 및 초기화
    const authResult = await userStore.executeWithAuth(async () => {
      return await getDocs(collection(db, 'users'))
    }, router)

    if (!authResult.success) {
      if (authResult.shouldRedirect) {
        // 인증 실패 시 리다이렉트 처리됨
        return
      }
      throw new Error(authResult.error || '인증에 실패했습니다.')
    }

    const snap = authResult.data
    userOptions.value = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    userMap.value = {}
    
    for (const user of userOptions.value) {
      userMap.value[user.id] = user.name
    }

    // Worker Store에도 업데이트
    workerStore.setWorkers(userOptions.value)
    
    console.log('사용자 정보 로딩 완료:', userOptions.value.length + '명')
    
  } catch (err) {
    console.error('사용자 정보 로딩 오류:', err)
    
    // 권한 오류인 경우 특별 처리
    if (err.code === 'permission-denied') {
      showErrorMessage('사용자 정보에 접근할 권한이 없습니다. 관리자에게 문의하세요.')
    } else if (err.message?.includes('Missing or insufficient permissions')) {
      showErrorMessage('Firebase 권한이 부족합니다. 로그인을 다시 시도해주세요.')
      // 3초 후 로그인 페이지로 리다이렉트
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } else {
      showErrorMessage('사용자 정보를 불러오는데 실패했습니다: ' + (err.message || '알 수 없는 오류'))
    }
  }
}

// 🔥 개선된 기존 일정 데이터 로딩 (Store 활용)
async function fetchExistingDates() {
  isLoading.value = true
  scheduleStore.clearError()
  
  try {
    // Store의 에러 핸들링을 활용한 안전한 데이터 로딩
    await userStore.executeWithAuth(async () => {
      const snap = await getDocs(collection(db, 'schedulesMeta'))
      const dates = new Set()
      const meta = {}

      for (const docSnap of snap.docs) {
        const data = docSnap.data()
        if (data.date) {
          dates.add(data.date)
          meta[data.date] = {
            id: docSnap.id,
            startTime: data.startTime,
            workerNames: (data.workers || []).map(
              (id) => userMap.value[id] || '알 수 없음'
            ),
            ...data
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
    }, router)
    
  } catch (err) {
    console.error('일정 정보 로딩 오류:', err)
    showErrorMessage('일정 정보를 불러오는데 실패했습니다: ' + (err.message || '알 수 없는 오류'))
  } finally {
    isLoading.value = false
  }
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
  selectedTimePreset.value = null
}

async function handleDateChange() {
  await handleDateSelect(form.value.date)
}

async function handleDateSelect(date) {
  try {
    form.value.date = date
    selectedDate.value = date
    
    // 기존 메타 데이터가 있는지 확인
    const existingMeta = metaMap.value[date]
    if (existingMeta) {
      form.value.startTime = existingMeta.startTime || ''
      form.value.workers = existingMeta.workers || []
      form.value.notice = existingMeta.notice || ''
      form.value.paidMap = existingMeta.paidMap || {}
      editDocId = existingMeta.id
      isEdit.value = true
      
      // 시간 프리셋 업데이트
      selectedTimePreset.value = timePresets.includes(existingMeta.startTime) ? existingMeta.startTime : null
    } else {
      clearForm()
    }
  } catch (err) {
    console.error('일정 선택 오류:', err)
    showErrorMessage('일정 정보를 불러오는데 실패했습니다.')
  }
}

// 🔥 개선된 저장 로직 (Store 활용)
async function submit() {
  if (isSaving.value || !isFormValid.value) return

  isSaving.value = true

  try {
    if (isEdit.value && editDocId) {
      await scheduleStore.updateScheduleMeta(editDocId, form.value)
      uiStore.showSnackbar('일정이 성공적으로 수정되었습니다.', 'success')
      showSuccessMessage('일정이 성공적으로 수정되었습니다.')
    } else {
      await scheduleStore.addScheduleMeta(form.value)
      uiStore.showSnackbar('일정이 성공적으로 등록되었습니다.', 'success')
      showSuccessMessage('일정이 성공적으로 등록되었습니다.')
    }
    await fetchExistingDates()
  } catch (err) {
    console.error('저장 중 오류:', err)
    const errorMsg = scheduleStore.error || '저장 중 오류가 발생했습니다.'
    uiStore.showSnackbar(errorMsg, 'error')
    showErrorMessage(errorMsg)
  } finally {
    isSaving.value = false
  }
}

// 🔥 개선된 삭제 로직 (Store 활용)
async function cancelSchedule() {
  if (isSaving.value) return
  if (!editDocId) return

  isSaving.value = true
  try {
    await scheduleStore.deleteScheduleMeta(editDocId, form.value.date)
    uiStore.showSnackbar('일정이 삭제되었습니다.', 'success')
    showSuccessMessage('일정이 삭제되었습니다.')
    await fetchExistingDates()
  } catch (err) {
    console.error('삭제 중 오류:', err)
    const errorMsg = scheduleStore.error || '삭제 중 오류가 발생했습니다.'
    uiStore.showSnackbar(errorMsg, 'error')
    showErrorMessage(errorMsg)
  } finally {
    isSaving.value = false
  }
}

function goHome() {
  router.push('/')
}

function showSuccessMessage(message) {
  successMessage.value = message
  showSuccess.value = true
}

function showErrorMessage(message) {
  error.value = message
  showError.value = true
}

// Watch로 에러 상태 모니터링
watch(showError, (newVal) => {
  if (!newVal) {
    error.value = ''
  }
})

// Watch Store 에러 상태
watch(() => scheduleStore.error, (newError) => {
  if (newError) {
    showErrorMessage(newError)
  }
})

// 🚀 개선된 초기화 로직
onMounted(async () => {
  // 1. 인증 상태 먼저 확인
  const authResult = await userStore.initializeAuth(router)
  
  if (!authResult.success) {
    if (authResult.shouldRedirect) {
      // 인증 실패시 리다이렉트가 처리됨
      return
    }
    showErrorMessage(authResult.error || '인증에 실패했습니다.')
    return
  }

  // 2. 재시도 로직으로 안전한 데이터 로딩
  try {
    await userStore.withRetry(async () => {
      await fetchUsers()
    }, 2, 1000)
    
    await userStore.withRetry(async () => {
      await fetchExistingDates()
    }, 2, 1000)
    
  } catch (err) {
    console.error('초기 데이터 로딩 실패:', err)
    showErrorMessage('초기 데이터 로딩에 실패했습니다. 페이지를 새로고침 해주세요.')
  }
})
</script>

<style scoped>
/* 🎨 헤더 스타일 - !important로 강제 적용 */
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.custom-header .v-toolbar__content {
  padding: 0 !important;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border-radius: 12px !important;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.back-btn .v-icon {
  color: white !important;
}

.header-icon-wrapper {
  width: 48px !important;
  height: 48px !important;
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.2) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  backdrop-filter: blur(10px) !important;
}

.header-title {
  color: white !important;
  font-weight: 700 !important;
  font-size: 24px !important;
  margin: 0 !important;
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
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

/* 📅 카드 스타일 */
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

.schedule-scroll::-webkit-scrollbar {
  height: 6px;
}

.schedule-scroll::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.schedule-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.schedule-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
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
  animation: fadeInUp 0.3s ease-out;
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

/* 과거 일정 스타일 - 완전히 숨기지 않고 구분만 */
.past-schedule {
  opacity: 0.8;
  position: relative;
  border-left: 4px solid #f59e0b !important;
}

.past-schedule::before {
  content: '완료';
  position: absolute;
  top: 8px;
  right: 8px;
  background: #f59e0b;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  z-index: 1;
}

.past-schedule .schedule-date {
  color: #92400e;
  font-weight: 600;
}

.past-schedule:hover {
  opacity: 0.9;
  border-color: #d97706 !important;
  transform: translateY(-1px);
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

/* 시간 프리셋 스타일 */
.time-preset-label {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
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

.action-btn:disabled {
  opacity: 0.6;
  transform: none;
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

/* 폼 검증 관련 스타일 */
.v-input--error .v-field {
  border-color: #ef4444 !important;
}

.v-input--error .v-field__outline {
  border-color: #ef4444 !important;
}

/* 정렬 버튼 스타일 */
.v-btn-toggle .v-btn {
  border-radius: 8px !important;
  font-size: 12px;
}

.v-btn-toggle .v-btn--active {
  background: #4f46e5 !important;
  color: white !important;
}

/* 삭제 다이얼로그 스타일 */
.v-dialog .v-card {
  border-radius: 16px;
}

.v-dialog .v-card-title {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-bottom: 1px solid #fecaca;
}

/* 스낵바 커스터마이징 */
.v-snackbar {
  border-radius: 12px !important;
}

.v-snackbar .v-snackbar__wrapper {
  backdrop-filter: blur(10px);
}

/* 로딩 상태 개선 */
.v-select .v-field--loading .v-progress-linear {
  border-radius: 0 0 4px 4px;
}

/* 칩 스타일 개선 */
.v-chip--closable .v-chip__close {
  margin-left: 8px;
}

.v-chip-group .v-chip {
  margin: 2px;
  transition: all 0.2s ease;
}

.v-chip-group .v-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 애니메이션 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 포커스 상태 개선 */
.v-field--focused .v-field__outline {
  border-width: 2px;
  border-color: #4f46e5 !important;
}

.v-btn:focus {
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.3);
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
    font-size: 14px;
  }

  .v-btn-toggle .v-btn {
    font-size: 11px;
    padding: 0 8px;
  }

  .header-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .header-icon-wrapper .v-icon {
    font-size: 24px !important;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 20px;
  }

  .header-subtitle {
    font-size: 11px;
  }

  .card-header {
    padding: 16px 20px;
    flex-wrap: wrap;
    gap: 8px;
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

  .floating-actions .v-row {
    margin: 0;
  }

  .floating-actions .v-col {
    padding: 0 4px;
  }

  .action-btn {
    height: 48px;
    font-size: 13px;
  }

  .action-btn .v-icon {
    font-size: 16px !important;
  }

  /* 모바일에서 시간 프리셋을 세로로 배치 */
  .v-chip-group {
    flex-direction: column;
    align-items: stretch;
  }

  .v-chip-group .v-chip {
    justify-content: center;
    margin: 4px 0;
  }
}

/* Vuetify 오버라이드 - 헤더 스타일 강제 적용 */
.v-app-bar.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

.v-app-bar.custom-header .v-btn {
  color: white !important;
}

.v-app-bar.custom-header .v-chip {
  backdrop-filter: blur(5px);
}

/* 다크모드 대응 */
.v-theme--dark .schedule-item {
  background: #1e293b;
  border-color: #334155;
}

.v-theme--dark .schedule-item.selected {
  background: linear-gradient(135deg, #312e81 0%, #3730a3 100%);
}

.v-theme--dark .worker-item {
  background: #334155;
}

.v-theme--dark .past-schedule::after {
  background: rgba(51, 65, 85, 0.3);
}

/* 고대비 모드 지원 */
@media (prefers-contrast: high) {
  .schedule-item {
    border-width: 3px;
  }
  
  .schedule-item.selected {
    border-width: 4px;
  }
  
  .action-btn {
    border: 2px solid;
  }
}

/* 동작 줄임 설정 존중 */
@media (prefers-reduced-motion: reduce) {
  .schedule-item,
  .worker-item,
  .action-btn,
  .v-chip {
    transition: none;
  }
  
  .schedule-item {
    animation: none;
  }
}

/* 인쇄 스타일 */
@media print {
  .floating-actions,
  .custom-header,
  .v-snackbar {
    display: none !important;
  }
  
  .main-content {
    background: white !important;
  }
  
  .schedule-list-card,
  .form-card {
    box-shadow: none !important;
    border: 1px solid #000 !important;
  }
}

</style>