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
      <v-container
        class="pa-6"
        style="padding-bottom: 140px !important; max-width: 1200px"
      >
        <!-- 🚨 에러 및 성공 메시지 -->
        <v-alert
          v-if="error"
          type="error"
          class="mb-4"
          prominent
          closable
          @click:close="clearError"
        >
          <v-icon start>mdi-alert-circle</v-icon>
          {{ error }}
        </v-alert>

        <v-alert
          v-if="successMessage"
          type="success"
          class="mb-4"
          prominent
          closable
          @click:close="successMessage = ''"
        >
          <v-icon start>mdi-check-circle</v-icon>
          {{ successMessage }}
        </v-alert>

        <!-- 📅 기존 일정 달력 -->
        <template v-if="!isInitialLoading">
          <v-card
            v-if="existingDatesDisplay.length"
            class="calendar-card mb-8"
            elevation="0"
          >
            <div class="calendar-header">
              <div class="calendar-header-content">
                <div class="calendar-icon">
                  <v-icon color="white">mdi-calendar</v-icon>
                </div>
                <div>
                  <h3 class="calendar-title">기존 일정 달력</h3>
                  <div class="calendar-subtitle">총 {{ existingDatesDisplay.length }}개 일정</div>
                </div>
              </div>
              
              <div class="calendar-controls">
                <v-btn
                  variant="outlined"
                  size="small"
                  @click="goToPreviousMonth"
                  :disabled="isInitialLoading"
                >
                  <v-icon>mdi-chevron-left</v-icon>
                </v-btn>
                <div class="current-month">
                  {{ currentDate.getFullYear() }}년 {{ currentDate.getMonth() + 1 }}월
                </div>
                <v-btn
                  variant="outlined"
                  size="small"
                  @click="goToNextMonth"
                  :disabled="isInitialLoading"
                >
                  <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
                <v-btn
                  variant="outlined"
                  size="small"
                  @click="goToToday"
                  :disabled="isInitialLoading"
                >
                  <v-icon start size="14">mdi-home</v-icon>
                  오늘
                </v-btn>
              </div>
            </div>

            <div class="calendar-content">
              <!-- 요일 헤더 -->
              <div class="calendar-weekdays">
                <div
                  v-for="(day, index) in weekdays"
                  :key="day"
                  class="weekday-header"
                  :class="{ weekend: index === 0 || index === 6 }"
                >
                  {{ day }}
                </div>
              </div>

              <!-- 달력 그리드 -->
              <div class="calendar-grid">
                <div
                  v-for="date in calendarDates"
                  :key="date.date"
                  class="calendar-date"
                  :class="{
                    'other-month': !date.isCurrentMonth,
                    'today': date.isToday,
                    'weekend': date.isWeekend,
                    'has-schedule': date.hasSchedule,
                    'selected': selectedDate === date.date
                  }"
                  @click="handleCalendarDateClick(date)"
                >
                  <div class="date-number">{{ date.day }}</div>
                  
                  <!-- 일정 표시 -->
                  <div v-if="date.hasSchedule" class="schedule-indicators">
                    <div
                      class="schedule-dot"
                      :class="{
                        upcoming: !isPastDate(date.date),
                        past: isPastDate(date.date)
                      }"
                    ></div>
                    <span class="schedule-time">
                      {{ metaMap[date.date]?.startTime || '미정' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </v-card>
        </template>

        <!-- 🌀 기존 일정 로딩 중 스켈레톤 -->
        <template v-else>
          <div class="schedule-skeleton-card mb-8">
            <div class="skeleton-header">
              <div class="skeleton-icon"></div>
              <div class="skeleton-title"></div>
              <div class="skeleton-count"></div>
            </div>
            <div class="skeleton-content">
              <div class="skeleton-scroll">
                <div v-for="i in 3" :key="i" class="skeleton-schedule-item">
                  <div class="skeleton-date"></div>
                  <div class="skeleton-details">
                    <div class="skeleton-detail-row"></div>
                    <div class="skeleton-detail-row"></div>
                    <div class="skeleton-chip"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

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
            <!-- 🌀 사용자 로딩 중 스켈레톤 -->
            <template v-if="isLoadingUsers">
              <div class="user-skeleton">
                <div class="skeleton-select"></div>
                <div class="skeleton-buttons">
                  <div class="skeleton-button"></div>
                  <div class="skeleton-button"></div>
                </div>
              </div>
            </template>

            <!-- 실제 사용자 선택 -->
            <template v-else>
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
            </template>
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
            선택한 일정을 삭제하시겠습니까?<br />
            <strong>{{ form.date }}</strong> 일정이 완전히 삭제됩니다.
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showDeleteDialog = false">
              취소
            </v-btn>
            <v-btn color="error" @click="deleteSchedule"> 삭제 </v-btn>
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

// Store 인스턴스
const scheduleStore = useScheduleStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const workerStore = useWorkerStore()

// 🚀 최적화: 오늘 날짜 캐싱
const TODAY_KST = getTodayDateKST()

// 폼 데이터
const form = ref({
  date: TODAY_KST,
  startTime: '',
  workers: [],
  notice: '',
  paidMap: {},
})

// 사용자 관련
const userOptions = ref([])
const userMap = ref({})
const isLoadingUsers = ref(false)

// 일정 관련
const existingDates = ref([])
const existingDatesDisplay = ref([])
const selectedDate = ref(TODAY_KST)
const metaMap = ref({})

// 상태 관리 - 세분화
const isInitialLoading = ref(true)
const isSaving = ref(false)
const isEdit = ref(false)
let editDocId = null

// 에러 및 성공 메시지
const error = ref('')
const successMessage = ref('')

// 기타
const showDeleteDialog = ref(false)
const sortOption = ref('future')
const timePresets = ['09:00', '10:00', '13:00', '14:00', '16:00', '18:00']
const selectedTimePreset = ref(null)

// 달력 관련
const currentDate = ref(new Date())
const weekdays = ['일', '월', '화', '수', '목', '금', '토']

// 유효성 검사 규칙
const dateRules = [(v) => !!v || '날짜를 선택해주세요']

const noticeRules = [
  (v) => !v || v.length <= 500 || '공지사항은 500자 이내로 입력해주세요',
]

// 🚀 최적화: 계산된 속성 간소화
const isFormValid = computed(() => {
  return (
    !!form.value.date && (!form.value.notice || form.value.notice.length <= 500)
  )
})

const sortedExistingDates = computed(() => {
  if (sortOption.value === 'date') {
    return [...existingDatesDisplay.value].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    )
  } else {
    return [...existingDatesDisplay.value].sort((a, b) => {
      const isAFuture = new Date(a.date) >= new Date(TODAY_KST)
      const isBFuture = new Date(b.date) >= new Date(TODAY_KST)

      if (isAFuture && isBFuture) return new Date(a.date) - new Date(b.date)
      if (!isAFuture && !isBFuture) return new Date(b.date) - new Date(a.date)
      return isAFuture ? -1 : 1
    })
  }
})

// 달력 데이터 computed 속성
const calendarDates = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  // 현재 월의 첫 번째 날과 마지막 날
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // 달력 시작일 (이전 월의 마지막 주 포함)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  // 달력 종료일 (다음 월의 첫 주 포함)
  const endDate = new Date(lastDay)
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))
  
  const dates = []
  const currentDateObj = new Date(startDate)
  
  while (currentDateObj <= endDate) {
    const dateStr = currentDateObj.getFullYear() + '-' + 
      String(currentDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
      String(currentDateObj.getDate()).padStart(2, '0')
    const isCurrentMonth = currentDateObj.getMonth() === month
    const isToday = dateStr === TODAY_KST
    const isWeekend = currentDateObj.getDay() === 0 || currentDateObj.getDay() === 6
    const hasSchedule = !!metaMap.value[dateStr]
    
    dates.push({
      date: dateStr,
      day: currentDateObj.getDate(),
      isCurrentMonth,
      isToday,
      isWeekend,
      hasSchedule
    })
    
    currentDateObj.setDate(currentDateObj.getDate() + 1)
  }
  
  return dates
})

// 🚀 최적화: 메서드 간소화
const getUserName = (userId) => userMap.value[userId] || '알 수 없음'
const isPastDate = (dateStr) => new Date(dateStr) < new Date(TODAY_KST)

const setToday = () => {
  form.value.date = TODAY_KST
  handleDateChange()
}

const setTomorrow = () => {
  const todayKST = getTodayDateKST()
  const [year, month, day] = todayKST.split('-').map(Number)
  const tomorrow = new Date(year, month - 1, day + 1)
  const tomorrowStr =
    tomorrow.getFullYear() +
    '-' +
    String(tomorrow.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(tomorrow.getDate()).padStart(2, '0')
  form.value.date = tomorrowStr
  handleDateChange()
}

const selectAllWorkers = () => {
  form.value.workers = userOptions.value.map((user) => user.id)
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

const clearError = () => {
  error.value = ''
}

// 🚀 최적화: 사용자 데이터 로딩 - 캐싱 적용
async function fetchUsers() {
  if (userOptions.value.length > 0) {
    // 이미 로딩된 경우 캐시 사용
    return
  }

  isLoadingUsers.value = true
  try {
    const authResult = await userStore.executeWithAuth(async () => {
      return await getDocs(collection(db, 'users'))
    }, router)

    if (!authResult.success) {
      if (authResult.shouldRedirect) return
      throw new Error(authResult.error || '인증에 실패했습니다.')
    }

    const snap = authResult.data
    const users = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    userOptions.value = users
    userMap.value = {}

    for (const user of users) {
      userMap.value[user.id] = user.name
    }

    workerStore.setWorkers(users)
  } catch (err) {
    console.error('사용자 정보 로딩 오류:', err)

    if (err.code === 'permission-denied') {
      error.value = '사용자 정보에 접근할 권한이 없습니다.'
    } else if (err.message?.includes('Missing or insufficient permissions')) {
      error.value = 'Firebase 권한이 부족합니다. 로그인을 다시 시도해주세요.'
      setTimeout(() => router.push('/login'), 3000)
    } else {
      error.value = '사용자 정보를 불러오는데 실패했습니다.'
    }
  } finally {
    isLoadingUsers.value = false
  }
}

// 🚀 최적화: 기존 일정 로딩 - 순차 처리
async function fetchExistingDates() {
  try {
    const authResult = await userStore.executeWithAuth(async () => {
      return await getDocs(collection(db, 'schedulesMeta'))
    }, router)

    if (!authResult.success) {
      if (authResult.shouldRedirect) return
      throw new Error(authResult.error)
    }

    const snap = authResult.data
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
          ...data,
        }
      }
    }

    const sortedDates = Array.from(dates).sort((a, b) => {
      const isAFuture = new Date(a) >= new Date(TODAY_KST)
      const isBFuture = new Date(b) >= new Date(TODAY_KST)
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

    // 첫 번째 미래 일정 선택
    const firstFutureOrToday = sortedDates.find(
      (d) => new Date(d) >= new Date(TODAY_KST)
    )

    if (firstFutureOrToday) {
      selectedDate.value = firstFutureOrToday
      await handleDateSelect(firstFutureOrToday)
    } else {
      form.value.date = TODAY_KST
      selectedDate.value = TODAY_KST
      clearForm()
    }
  } catch (err) {
    console.error('일정 정보 로딩 오류:', err)
    error.value = '일정 정보를 불러오는데 실패했습니다.'
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

    const existingMeta = metaMap.value[date]
    if (existingMeta) {
      form.value.startTime = existingMeta.startTime || ''
      form.value.workers = existingMeta.workers || []
      form.value.notice = existingMeta.notice || ''
      form.value.paidMap = existingMeta.paidMap || {}
      editDocId = existingMeta.id
      isEdit.value = true

      selectedTimePreset.value = timePresets.includes(existingMeta.startTime)
        ? existingMeta.startTime
        : null
    } else {
      clearForm()
    }
  } catch (err) {
    console.error('일정 선택 오류:', err)
    error.value = '일정 정보를 불러오는데 실패했습니다.'
  }
}

// 🚀 최적화: 저장 로직 간소화
async function submit() {
  if (isSaving.value || !isFormValid.value) return

  isSaving.value = true
  error.value = ''

  try {
    if (isEdit.value && editDocId) {
      await scheduleStore.updateScheduleMeta(editDocId, form.value)
      successMessage.value = '일정이 성공적으로 수정되었습니다.'
    } else {
      await scheduleStore.addScheduleMeta(form.value)
      successMessage.value = '일정이 성공적으로 등록되었습니다.'
    }

    // 성공 후 데이터 새로고침
    await fetchExistingDates()

    // 3초 후 성공 메시지 자동 제거
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('저장 중 오류:', err)
    error.value = scheduleStore.error || '저장 중 오류가 발생했습니다.'
  } finally {
    isSaving.value = false
  }
}

async function cancelSchedule() {
  if (isSaving.value || !editDocId) return

  isSaving.value = true
  error.value = ''

  try {
    await scheduleStore.deleteScheduleMeta(editDocId, form.value.date)
    successMessage.value = '일정이 삭제되었습니다.'
    await fetchExistingDates()

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('삭제 중 오류:', err)
    error.value = scheduleStore.error || '삭제 중 오류가 발생했습니다.'
  } finally {
    isSaving.value = false
  }
}

function goHome() {
  router.push('/')
}

// 달력 네비게이션 메서드들
const goToPreviousMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
}

const goToNextMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
}

const goToToday = () => {
  currentDate.value = new Date()
}

const handleCalendarDateClick = (date) => {
  handleDateSelect(date.date)
}

// 🚀 최적화: 초기화 로직 - 순차 로딩
onMounted(async () => {
  // 1. 인증 상태 확인
  const authResult = await userStore.initializeAuth(router)

  if (!authResult.success) {
    if (authResult.shouldRedirect) return
    error.value = authResult.error || '인증에 실패했습니다.'
    return
  }

  try {
    // 2. 사용자 데이터 먼저 로딩 (필수)
    await userStore.withRetry(
      async () => {
        await fetchUsers()
      },
      2,
      1000
    )

    // 3. 기존 일정 데이터 로딩 (사용자 데이터 로딩 후)
    await userStore.withRetry(
      async () => {
        await fetchExistingDates()
      },
      2,
      1000
    )
  } catch (err) {
    console.error('초기 데이터 로딩 실패:', err)
    error.value = '초기 데이터 로딩에 실패했습니다. 페이지를 새로고침 해주세요.'
  } finally {
    isInitialLoading.value = false
  }
})

// Watch Store 에러 상태
watch(
  () => scheduleStore.error,
  (newError) => {
    if (newError) {
      error.value = newError
    }
  }
)
</script>

<style scoped>
/* 🚀 성능 최적화: 스켈레톤 스타일 */
.schedule-skeleton-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.skeleton-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
  gap: 12px;
}

.skeleton-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-title {
  width: 120px;
  height: 18px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-count {
  width: 40px;
  height: 20px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-left: auto;
}

.skeleton-content {
  padding: 24px;
}

.skeleton-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 12px;
}

.skeleton-schedule-item {
  flex-shrink: 0;
  width: 280px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
}

.skeleton-date {
  width: 160px;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 12px;
}

.skeleton-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-detail-row {
  width: 120px;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-chip {
  width: 60px;
  height: 18px;
  border-radius: 9px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* 사용자 선택 스켈레톤 */
.user-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-select {
  width: 100%;
  height: 56px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-buttons {
  display: flex;
  gap: 8px;
}

.skeleton-button {
  width: 120px;
  height: 36px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 🎨 헤더 스타일 */
.custom-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2) !important;
}

.v-app-bar.custom-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
}

.v-app-bar.custom-header .v-toolbar__content {
  background: transparent !important;
}

.back-btn {
  background: rgba(100, 116, 139, 0.1) !important;
  color: #64748b !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
}

.back-btn:hover,
.back-btn:focus {
  background: rgba(100, 116, 139, 0.2) !important;
  transform: translateY(-1px);
}

.header-icon-wrapper {
  width: 48px !important;
  height: 48px !important;
  border-radius: 12px !important;
  background: rgba(100, 116, 139, 0.15) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  backdrop-filter: blur(10px) !important;
}

.header-icon-wrapper .v-icon {
  color: #64748b !important;
}

.header-title {
  color: #475569 !important;
  font-weight: 700 !important;
  font-size: 24px !important;
  margin: 0 !important;
}

.header-subtitle {
  color: rgba(71, 85, 105, 0.7) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
}

/* 🌀 메인 컨텐츠 */
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

/* 과거 일정 스타일 */
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

/* 📱 반응형 디자인 */
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

  .header-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .skeleton-schedule-item {
    width: 240px;
    padding: 16px;
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

  .v-chip-group {
    flex-direction: column;
    align-items: stretch;
  }

  .v-chip-group .v-chip {
    justify-content: center;
    margin: 4px 0;
  }

  .skeleton-schedule-item {
    width: 200px;
    padding: 14px;
  }
}

/* 📅 달력 스타일 */
.calendar-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.calendar-header {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.calendar-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.calendar-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.calendar-subtitle {
  font-size: 14px;
  opacity: 0.8;
  color: white;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-month {
  font-size: 16px;
  font-weight: 600;
  color: white;
  min-width: 120px;
  text-align: center;
}

.calendar-controls .v-btn {
  color: rgba(255, 255, 255, 0.9) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

.calendar-content {
  padding: 0;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.weekday-header {
  padding: 12px 6px;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  color: #64748b;
}

.weekday-header.weekend {
  color: #ef4444;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-date {
  min-height: 60px;
  padding: 6px;
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: white;
}

.calendar-date:hover {
  background: #f8fafc;
}

.calendar-date.other-month {
  background: #f9fafb;
  color: #9ca3af;
}

.calendar-date.today {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #3b82f6;
}

.calendar-date.weekend {
  background: #fefcfb;
}

.calendar-date.weekend.other-month {
  background: #f7f6f5;
}

.calendar-date.has-schedule {
  background: linear-gradient(135deg, #fef3cd 0%, #fde68a 100%) !important;
  border-left: 4px solid #f59e0b !important;
}

.calendar-date.selected {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%) !important;
  border-color: #4f46e5 !important;
  border-width: 2px !important;
}

.date-number {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 3px;
  color: #1e293b;
}

.calendar-date.other-month .date-number {
  color: #9ca3af;
}

.calendar-date.today .date-number {
  color: #1d4ed8;
  font-weight: 700;
}

.calendar-date.weekend .date-number {
  color: #ef4444;
}

.schedule-indicators {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.schedule-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.schedule-dot.upcoming {
  background: #f59e0b;
}

.schedule-dot.past {
  background: #10b981;
}

.schedule-time {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

/* 작업자 이름 스타일 */
.worker-names {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 3px;
}

.worker-name {
  font-size: 8px;
  font-weight: 500;
  color: #333;
  background: transparent;
  border: 1px solid #333;
  padding: 1px 6px;
  border-radius: 10px;
  white-space: nowrap;
  text-align: center;
}


/* 달력 날짜 셀에서 작업자 이름이 잘 보이도록 최소 높이 조정 */
.calendar-date.has-schedule {
  min-height: 85px !important;
}

/* 성능 최적화 */
@media (prefers-reduced-motion: reduce) {
  .schedule-item,
  .worker-item,
  .action-btn,
  .v-chip,
  .calendar-date {
    transition: none;
  }

  .shimmer {
    animation: none !important;
  }
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .schedule-item:hover,
  .worker-item:hover,
  .action-btn:hover,
  .calendar-date:hover {
    transform: none;
  }
}

/* 📱 헤더 반응형 디자인 */
@media (max-width: 768px) {
  .header-title {
    font-size: 18px !important;
  }

  .header-subtitle {
    font-size: 11px !important;
  }

  .header-icon-wrapper {
    width: 36px !important;
    height: 36px !important;
  }

  .header-icon-wrapper .v-icon {
    font-size: 20px !important;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 16px !important;
  }

  .header-subtitle {
    font-size: 10px !important;
  }

  .header-icon-wrapper {
    width: 32px !important;
    height: 32px !important;
  }

  .header-icon-wrapper .v-icon {
    font-size: 18px !important;
  }
}

/* 📱 달력 반응형 */
@media (max-width: 768px) {
  .calendar-header {
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .calendar-controls {
    align-self: stretch;
    justify-content: center;
  }
  
  .calendar-date {
    min-height: 60px;
    padding: 4px;
  }
  
  .calendar-date.has-schedule {
    min-height: 70px !important;
  }
  
  .date-number {
    font-size: 12px;
  }
  
  .schedule-dot {
    width: 6px;
    height: 6px;
  }
  
  .schedule-time {
    font-size: 8px;
  }
  
  .worker-name {
    font-size: 7px;
    padding: 1px 4px;
    border-radius: 8px;
  }
  
  .weekday-header {
    padding: 12px 4px;
    font-size: 12px;
  }
  
  .current-month {
    min-width: 100px;
    font-size: 14px;
  }
}
</style>
