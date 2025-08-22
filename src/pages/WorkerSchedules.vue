<template>
  <v-app>
    <!-- 🎨 일관된 헤더 디자인 -->
    <v-app-bar :elevation="0" class="custom-header" height="80">
      <div class="d-flex align-center justify-space-between w-100 px-4">
        <div class="d-flex align-center">
          <v-btn
            icon
            size="large"
            class="back-btn mr-3"
            @click="goHome"
            @keydown.enter="goHome"
            @keydown.space="goHome"
            aria-label="홈으로 돌아가기"
            :loading="navigating"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div class="header-icon-wrapper">
            <v-icon size="32" color="white">mdi-account-hard-hat</v-icon>
          </div>
          <div class="ml-3">
            <h2 class="header-title">작업자별 일정</h2>
            <div class="header-subtitle">개인별 스케줄 관리</div>
          </div>
        </div>

        <div class="d-flex align-center">
          <!-- 선택된 작업자 표시 -->
          <v-chip
            v-if="selectedWorkers.length > 0"
            color="warning"
            size="small"
            class="mr-2"
            :prepend-icon="selectedWorkers.length > 0 ? 'mdi-account-check' : 'mdi-account'"
          >
            {{ selectedWorkers.length }}명 선택됨
          </v-chip>

          <!-- 새로고침 버튼 -->
          <v-btn
            icon
            size="small"
            variant="text"
            class="refresh-btn"
            @click="refreshData"
            :loading="refreshing"
            :disabled="loading"
          >
            <v-icon>mdi-refresh</v-icon>
            <v-tooltip activator="parent" location="bottom">
              새로고침
            </v-tooltip>
          </v-btn>
        </div>
      </div>
    </v-app-bar>

    <v-main class="main-content">
      <v-container
        class="pa-6"
        style="padding-bottom: 120px !important; max-width: 1200px"
      >
        <!-- 🚨 에러 알림 -->
        <v-alert
          v-if="error"
          type="error"
          class="mb-6"
          prominent
          closable
          @click:close="clearError"
        >
          <v-icon start>mdi-alert-circle</v-icon>
          {{ error }}
          <template v-slot:append>
            <v-btn
              variant="text"
              size="small"
              @click="retryOperation"
              :loading="retrying"
            >
              재시도
            </v-btn>
          </template>
        </v-alert>

        <!-- 📱 오프라인 알림 -->
        <v-alert v-if="!isOnline" type="warning" class="mb-6" prominent>
          <v-icon start>mdi-wifi-off</v-icon>
          네트워크 연결을 확인해주세요. 오프라인 상태입니다.
        </v-alert>

        <!-- 👥 작업자 필터 카드 -->
        <WorkerFilter
          :workers="workers"
          :selected-workers="selectedWorkers"
          :loading="loadingWorkers"
          :get-worker-color="getWorkerColor"
          :get-worker-schedule-count="getWorkerScheduleCount"
          @select-all="selectAllWorkers"
          @deselect-all="deselectAllWorkers"
          @toggle-worker="toggleWorker"
        />

        <!-- 📋 작업자 미선택 상태 -->
        <div
          v-if="selectedWorkers.length === 0 && !loading && !loadingWorkers"
          class="empty-state"
        >
          <div class="empty-icon">
            <v-icon size="80" color="grey-lighten-2"
              >mdi-account-question</v-icon
            >
          </div>
          <h3 class="empty-title">작업자를 선택해주세요</h3>
          <p class="empty-description">
            일정을 확인할 작업자를 체크하시면 스케줄을 볼 수 있습니다.
          </p>
        </div>

        <!-- 📊 일정 현황 -->
        <div v-if="selectedWorkers.length > 0">
          <!-- 🔄 뷰 전환 버튼 -->
          <v-card class="view-toggle-card mb-6" elevation="0">
            <div class="view-toggle-header">
              <div class="toggle-icon">
                <v-icon color="primary">mdi-view-dashboard</v-icon>
              </div>
              <h3 class="toggle-title">화면 보기</h3>
              <v-spacer />
              <v-btn-toggle
                v-model="viewMode"
                mandatory
                class="view-toggle-buttons"
                color="primary"
                variant="outlined"
              >
                <v-btn value="calendar" size="small">
                  <v-icon start>mdi-calendar</v-icon>
                  달력
                </v-btn>
                <v-btn value="list" size="small">
                  <v-icon start>mdi-view-list</v-icon>
                  리스트
                </v-btn>
              </v-btn-toggle>
            </div>
          </v-card>


          <!-- 📅 달력 뷰 -->
          <div v-if="viewMode === 'calendar'" class="calendar-view">
            <ScheduleCalendar
              :current-date="currentDate"
              :calendar-dates="calendarDates"
              :get-worker-color="getWorkerColor"
              :get-schedule-worker-names="getScheduleWorkerNames"
              :get-worker-name="getWorkerName"
              @previous-month="goToPreviousMonth"
              @next-month="goToNextMonth"
              @go-to-today="goToToday"
              @date-click="showDateDetail"
              @schedule-click="showScheduleDetail"
            />
          </div>

          <!-- 📋 리스트 뷰 -->
          <div v-else class="list-view">
            <!-- 📅 예정된 일정 -->
          <div ref="upcomingSection" class="schedule-section">
            <div class="section-header">
              <div class="section-icon upcoming">
                <v-icon color="white">mdi-calendar-clock</v-icon>
              </div>
              <h3 class="section-title">예정된 일정</h3>
              <v-chip
                :color="allUpcomingMeta.length > 0 ? 'warning' : 'grey'"
                size="small"
                class="ml-2"
              >
                {{ allUpcomingMeta.length }}건
              </v-chip>
              <v-spacer />
              <v-btn
                v-if="allUpcomingMeta.length > 0"
                size="small"
                variant="text"
                @click="sortUpcoming = !sortUpcoming"
              >
                <v-icon>{{
                  sortUpcoming
                    ? 'mdi-sort-calendar-ascending'
                    : 'mdi-sort-calendar-descending'
                }}</v-icon>
                정렬
              </v-btn>
            </div>

            <!-- 🦴 예정된 일정 스켈레톤 -->
            <div v-if="loadingMeta" class="schedule-skeleton-container">
              <v-skeleton-loader
                v-for="i in 3"
                :key="`upcoming-skeleton-${i}`"
                type="card"
                class="schedule-skeleton mb-3"
              />
            </div>

            <!-- 예정된 일정 없음 -->
            <v-alert
              v-else-if="allUpcomingMeta.length === 0"
              type="info"
              class="info-alert"
              prominent
            >
              <v-icon start>mdi-calendar-remove</v-icon>
              예정된 일정이 없습니다.
            </v-alert>

            <!-- 예정된 일정 카드들 -->
            <div v-else>
              <v-card
                v-for="(item, index) in sortedAllUpcomingMeta"
                :key="`upcoming-${item.id}`"
                class="schedule-card upcoming-card schedule-fade-item"
                :class="{ urgent: item.dday <= 1 }"
                :style="{ borderLeftColor: getWorkerColor(item.mainWorker) }"
                @click="showScheduleDetail(item)"
              >
                <div class="card-content">
                  <div class="card-main-info">
                    <div class="date-badge upcoming-badge">
                      <v-icon v-if="item.dday === 0" size="14"
                        >mdi-alert</v-icon
                      >
                      D-{{ item.dday }}
                    </div>
                    <div class="date-info">
                      <h4 class="work-date">{{ formatDate(item.date) }}</h4>
                      <div class="work-details">
                        <div class="detail-item">
                          <v-icon size="16" color="grey-darken-1"
                            >mdi-clock-outline</v-icon
                          >
                          <span>{{ item.startTime || '시간 미정' }}</span>
                        </div>
                        <div class="detail-item">
                          <v-icon size="16" color="grey-darken-1"
                            >mdi-account-group</v-icon
                          >
                          <span>{{ item.workerNames.join(', ') }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="item.notice" class="notice-section">
                    <v-icon size="16" color="info">mdi-information</v-icon>
                    <span class="notice-text">{{ item.notice }}</span>
                  </div>

                  <div class="status-section">
                    <v-chip
                      :color="item.dday <= 1 ? 'error' : 'warning'"
                      size="small"
                      variant="flat"
                      :class="{ pulse: item.dday === 0 }"
                    >
                      <v-icon start size="14">
                        {{
                          item.dday === 0 ? 'mdi-alert' : 'mdi-calendar-clock'
                        }}
                      </v-icon>
                      {{ getDdayText(item.dday) }}
                    </v-chip>
                  </div>
                </div>
              </v-card>
            </div>
          </div>

          <!-- 📜 지난 일정 -->
          <div ref="completedSection" class="schedule-section">
            <div class="section-header">
              <div class="section-icon completed">
                <v-icon color="white">mdi-calendar-check</v-icon>
              </div>
              <h3 class="section-title">지난 일정</h3>
              <v-chip color="success" size="small" class="ml-2">
                {{ allPastMeta.length }}건
              </v-chip>
              <v-spacer />
              <v-btn
                v-if="allPastMeta.length > 0"
                size="small"
                variant="text"
                @click="showAllPast = !showAllPast"
              >
                <v-icon>{{
                  showAllPast ? 'mdi-chevron-up' : 'mdi-chevron-down'
                }}</v-icon>
                {{ showAllPast ? '접기' : '더보기' }}
              </v-btn>
            </div>

            <!-- 🦴 지난 일정 스켈레톤 -->
            <div v-if="loadingMeta" class="schedule-skeleton-container">
              <v-skeleton-loader
                v-for="i in 2"
                :key="`past-skeleton-${i}`"
                type="card"
                class="schedule-skeleton mb-3"
              />
            </div>

            <!-- 지난 일정 없음 -->
            <v-alert
              v-else-if="allPastMeta.length === 0"
              type="info"
              class="info-alert"
              prominent
            >
              <v-icon start>mdi-calendar-remove</v-icon>
              지난 일정이 없습니다.
            </v-alert>

            <!-- 지난 일정 카드들 -->
            <div v-else>
              <v-card
                v-for="(item, index) in displayedAllPastMeta"
                :key="`past-${item.id}`"
                class="schedule-card past-card schedule-fade-item"
                :style="{ borderLeftColor: getWorkerColor(item.mainWorker) }"
                @click="showScheduleDetail(item)"
              >
                <div class="card-content">
                  <div class="card-main-info">
                    <div class="date-badge past-badge">D+{{ item.dday }}</div>
                    <div class="date-info">
                      <h4 class="work-date">{{ formatDate(item.date) }}</h4>
                      <div class="work-details">
                        <div class="detail-item">
                          <v-icon size="16" color="grey-darken-1"
                            >mdi-clock-outline</v-icon
                          >
                          <span>{{ item.startTime || '시간 미정' }}</span>
                        </div>
                        <div class="detail-item">
                          <v-icon size="16" color="grey-darken-1"
                            >mdi-account-group</v-icon
                          >
                          <span>{{ item.workerNames.join(', ') }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="item.notice" class="notice-section">
                    <v-icon size="16" color="info">mdi-information</v-icon>
                    <span class="notice-text">{{ item.notice }}</span>
                  </div>

                  <div class="status-section">
                    <v-chip color="success" size="small" variant="flat">
                      <v-icon start size="14">mdi-check</v-icon>
                      {{ item.dday }}일 전 완료
                    </v-chip>
                  </div>
                </div>
              </v-card>
            </div>
          </div>
          </div>

          <!-- 📈 통계 요약 (하단) -->
          <v-card class="stats-card mt-8" elevation="0">
            <div class="stats-header">
              <div class="stats-icon">
                <v-icon color="primary">mdi-chart-timeline</v-icon>
              </div>
              <h3 class="stats-title">선택된 작업자 일정 현황</h3>
              <v-spacer />
              <div class="stats-meta">
                <v-chip size="x-small" color="grey-lighten-3">
                  마지막 업데이트: {{ lastUpdateTime }}
                </v-chip>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-item upcoming" @click="scrollToUpcoming">
                <div class="stat-number">{{ allUpcomingMeta.length }}</div>
                <div class="stat-label">예정된 작업</div>
                <div class="stat-icon">
                  <v-icon>mdi-calendar-clock</v-icon>
                </div>
                <div class="stat-progress">
                  <v-progress-linear
                    :model-value="allUpcomingMeta.length > 0 ? 100 : 0"
                    color="warning"
                    height="4"
                    rounded
                  />
                </div>
              </div>

              <div class="stat-item completed" @click="scrollToCompleted">
                <div class="stat-number">{{ allPastMeta.length }}</div>
                <div class="stat-label">완료된 작업</div>
                <div class="stat-icon">
                  <v-icon>mdi-calendar-check</v-icon>
                </div>
                <div class="stat-progress">
                  <v-progress-linear
                    :model-value="allPastMeta.length > 0 ? 100 : 0"
                    color="success"
                    height="4"
                    rounded
                  />
                </div>
              </div>

              <div class="stat-item total">
                <div class="stat-number">
                  {{ allUpcomingMeta.length + allPastMeta.length }}
                </div>
                <div class="stat-label">총 작업 수</div>
                <div class="stat-icon">
                  <v-icon>mdi-calendar-multiple</v-icon>
                </div>
                <div class="stat-progress">
                  <v-progress-linear
                    :model-value="
                      allUpcomingMeta.length + allPastMeta.length > 0 ? 100 : 0
                    "
                    color="primary"
                    height="4"
                    rounded
                  />
                </div>
              </div>
            </div>
          </v-card>
        </div>
      </v-container>

      <!-- 🏠 하단 홈 버튼 -->
      <div class="floating-actions">
        <v-btn
          block
          size="large"
          variant="outlined"
          class="home-btn"
          @click="goHome"
          @keydown.enter="goHome"
          @keydown.space="goHome"
          :loading="navigating"
        >
          <v-icon start>mdi-home</v-icon>
          홈으로 돌아가기
        </v-btn>
      </div>
    </v-main>

    <!-- 📱 일정 상세 다이얼로그 -->
    <v-dialog v-model="scheduleDialog" max-width="500" :persistent="false">
      <v-card v-if="selectedSchedule" class="schedule-detail-dialog">
        <v-card-title class="dialog-header">
          <div class="dialog-icon">
            <v-icon color="primary">mdi-calendar-text</v-icon>
          </div>
          <div>
            <h4>일정 상세</h4>
            <div class="dialog-subtitle">
              {{ formatDate(selectedSchedule.date) }}
            </div>
          </div>
        </v-card-title>

        <v-card-text class="dialog-content">
          <div class="detail-row">
            <v-icon color="grey-darken-1">mdi-clock-outline</v-icon>
            <div class="detail-info">
              <div class="detail-label">시작 시간</div>
              <div class="detail-value">
                {{ selectedSchedule.startTime || '미정' }}
              </div>
            </div>
          </div>

          <div class="detail-row">
            <v-icon color="grey-darken-1">mdi-account-group</v-icon>
            <div class="detail-info">
              <div class="detail-label">참여 작업자</div>
              <div class="detail-value">
                {{ getScheduleWorkerNames(selectedSchedule).join(', ') }}
              </div>
            </div>
          </div>

          <div v-if="selectedSchedule.notice" class="detail-row">
            <v-icon color="info">mdi-information</v-icon>
            <div class="detail-info">
              <div class="detail-label">메모</div>
              <div class="detail-value">{{ selectedSchedule.notice }}</div>
            </div>
          </div>

          <div class="detail-row">
            <v-icon color="grey-darken-1">mdi-calendar</v-icon>
            <div class="detail-info">
              <div class="detail-label">상태</div>
              <div class="detail-value">
                <v-chip
                  :color="
                    selectedSchedule.date >= today ? 'warning' : 'success'
                  "
                  size="small"
                >
                  {{ selectedSchedule.date >= today ? '예정' : '완료' }}
                </v-chip>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="scheduleDialog = false"> 닫기 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🔔 스낵바 알림 -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="bottom"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false"> 닫기 </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { useUserStore } from '@/stores/user'
import { getTodayDateKST } from '@/utils/date.js'
import WorkerFilter from '@/components/WorkerFilter.vue'
import ScheduleCalendar from '@/components/ScheduleCalendar.vue'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

// 반응형 상태 관리
const selectedWorkers = ref([])
const workers = ref([])
const metaList = ref([])
const userMap = ref({})
const error = ref('')
const today = getTodayDateKST()

// 뷰 모드 상태
const viewMode = ref('calendar')
const currentDate = ref(new Date())
const weekdays = ['일', '월', '화', '수', '목', '금', '토']

// 작업자별 색상 팔레트
const workerColors = [
  '#3B82F6', // Blue
  '#EF4444', // Red  
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
]

// 로딩 상태들
const loading = ref(false)
const loadingWorkers = ref(false)
const loadingMeta = ref(false)
const navigating = ref(false)
const refreshing = ref(false)
const retrying = ref(false)
const workerSwitching = ref(null)

// UX 개선 상태들
const isOnline = ref(navigator.onLine)
const lastUpdateTime = ref('')
const sortUpcoming = ref(false)
const showAllPast = ref(false)
const scheduleDialog = ref(false)
const selectedSchedule = ref(null)

// 스낵바 알림
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
  timeout: 3000,
})

// 섹션 참조
const upcomingSection = ref(null)
const completedSection = ref(null)

// 유틸리티 함수들

function dateDiff(from, to) {
  const fromDate = new Date(from + 'T00:00:00+09:00')
  const toDate = new Date(to + 'T00:00:00+09:00')
  const diff = Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24))
  return diff
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const day = date.toLocaleDateString('ko-KR', { weekday: 'short' })
  return `${dateStr} (${day})`
}

function getDdayText(dday) {
  if (dday === 0) return '오늘'
  if (dday === 1) return '내일'
  if (dday === 2) return '모레'
  return `${dday}일 후`
}

function updateLastUpdateTime() {
  const todayKST = getTodayDateKST()
  const now = new Date(
    todayKST + 'T' + new Date().toTimeString().split(' ')[0] + '+09:00'
  )
  lastUpdateTime.value = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

function showNotification(message, color = 'success', timeout = 3000) {
  snackbar.value = {
    show: true,
    message,
    color,
    timeout,
  }
}

// 컴퓨티드 속성들
const allUpcomingMeta = computed(() => {
  if (!selectedWorkers.value.length || !metaList.value.length) return []
  return metaList.value
    .filter((m) => {
      if (!m.workers || m.date < today) return false
      return m.workers.some(workerId => selectedWorkers.value.includes(workerId))
    })
    .map((m) => ({ 
      ...m, 
      dday: dateDiff(today, m.date),
      mainWorker: m.workers.find(workerId => selectedWorkers.value.includes(workerId)) || m.workers[0],
      workerNames: m.workers.map(id => userMap.value[id] || '알 수 없음')
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
})

const allPastMeta = computed(() => {
  if (!selectedWorkers.value.length || !metaList.value.length) return []
  return metaList.value
    .filter((m) => {
      if (!m.workers || m.date >= today) return false
      return m.workers.some(workerId => selectedWorkers.value.includes(workerId))
    })
    .map((m) => ({ 
      ...m, 
      dday: dateDiff(m.date, today),
      mainWorker: m.workers.find(workerId => selectedWorkers.value.includes(workerId)) || m.workers[0],
      workerNames: m.workers.map(id => userMap.value[id] || '알 수 없음')
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})

const sortedAllUpcomingMeta = computed(() => {
  const upcoming = allUpcomingMeta.value
  if (!upcoming?.length) return []

  if (!sortUpcoming.value) {
    return upcoming
  }
  return [...upcoming].sort((a, b) => new Date(b.date) - new Date(a.date))
})

const displayedAllPastMeta = computed(() => {
  const past = allPastMeta.value
  if (!past?.length) return []

  if (showAllPast.value) {
    return past
  }
  return past.slice(0, 3)
})


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
  
  // 먼저 모든 날짜의 기본 데이터 생성
  while (currentDateObj <= endDate) {
    const dateStr = currentDateObj.toISOString().split('T')[0]
    const isCurrentMonth = currentDateObj.getMonth() === month
    const isToday = dateStr === today
    const isWeekend = currentDateObj.getDay() === 0 || currentDateObj.getDay() === 6
    
    // 해당 날짜의 스케줄 찾기 (선택된 작업자들의 스케줄)
    const schedules = metaList.value.filter(m => {
      if (!m.workers || m.date !== dateStr) return false
      return m.workers.some(workerId => selectedWorkers.value.includes(workerId))
    }).map(m => ({
      ...m,
      mainWorker: m.workers.find(workerId => selectedWorkers.value.includes(workerId)) || m.workers[0],
      workerNames: m.workers.map(id => userMap.value[id] || '알 수 없음')
    }))
    
    dates.push({
      date: dateStr,
      day: currentDateObj.getDate(),
      isCurrentMonth,
      isToday,
      isWeekend,
      schedules,
      workerLines: [] // 작업자별 라인 데이터 (나중에 계산)
    })
    
    currentDateObj.setDate(currentDateObj.getDate() + 1)
  }
  
  // 작업자별 라인 시스템 구현 - 일관된 위치 보장
  const selectedWorkerIds = selectedWorkers.value
  const workerLineMap = new Map()
  
  // 선택된 작업자들에게 순서대로 라인 인덱스 할당
  selectedWorkerIds.forEach((workerId, index) => {
    workerLineMap.set(workerId, index)
  })
  
  // 각 날짜에 대해 작업자별 라인 할당
  dates.forEach((date, dateIndex) => {
    const dateWorkerLines = []
    
    // 해당 날짜에 스케줄이 있는 작업자들을 찾음
    const workersWithSchedules = new Set()
    date.schedules.forEach(schedule => {
      schedule.workers
        .filter(workerId => selectedWorkers.value.includes(workerId))
        .forEach(workerId => workersWithSchedules.add(workerId))
    })
    
    // 스케줄이 있는 작업자들만 라인 생성
    workersWithSchedules.forEach(workerId => {
      const lineIndex = workerLineMap.get(workerId)
      
      // 해당 작업자의 스케줄 찾기
      const workerSchedule = date.schedules.find(s => s.workers.includes(workerId))
      
      if (workerSchedule) {
        // 연속된 일정인지 확인
        const isStart = !dates[dateIndex - 1]?.schedules.some(s => 
          s.workers.includes(workerId)
        )
        const isEnd = !dates[dateIndex + 1]?.schedules.some(s => 
          s.workers.includes(workerId)
        )
        const isContinue = !isStart && !isEnd
        
        // 이벤트 바의 너비와 위치 계산
        let width = 96
        let left = 2
        
        // 연속된 일정의 경우 완전히 연결되도록 조정
        if (!isStart) {
          left = 0
          width = 98
        }
        if (!isEnd) {
          width = 98
        }
        if (!isStart && !isEnd) {
          left = 0
          width = 100
        }
        
        dateWorkerLines.push({
          workerId,
          lineIndex,
          event: {
            schedule: workerSchedule,
            isStart,
            isEnd,
            isContinue,
            width,
            left
          }
        })
      }
    })
    
    // 라인 인덱스 순으로 정렬
    dateWorkerLines.sort((a, b) => a.lineIndex - b.lineIndex)
    
    date.workerLines = dateWorkerLines
    date.overflowCount = 0
  })
  
  return dates
})

// 이벤트 핸들러들
const clearError = () => {
  error.value = ''
}

const goHome = async () => {
  navigating.value = true
  try {
    await router.push('/')
  } catch (err) {
    console.error('홈 이동 중 오류:', err)
    error.value = '홈으로 이동 중 오류가 발생했습니다.'
    showNotification('홈으로 이동 중 오류가 발생했습니다.', 'error')
  } finally {
    navigating.value = false
  }
}

const selectAllWorkers = () => {
  selectedWorkers.value = workers.value.map(w => w.id)
  showNotification('모든 작업자를 선택했습니다.')
}

const deselectAllWorkers = () => {
  selectedWorkers.value = []
  showNotification('모든 작업자 선택을 해제했습니다.')
}

const toggleWorker = (workerId, checked) => {
  if (checked) {
    if (!selectedWorkers.value.includes(workerId)) {
      selectedWorkers.value.push(workerId)
    }
  } else {
    selectedWorkers.value = selectedWorkers.value.filter(id => id !== workerId)
  }
}

const getWorkerColor = (workerId) => {
  const index = workers.value.findIndex(w => w.id === workerId)
  return workerColors[index % workerColors.length]
}

const getWorkerScheduleCount = (workerId) => {
  return metaList.value.filter(m => m.workers?.includes(workerId)).length
}

const getWorkerName = (workerId) => {
  return userMap.value[workerId] || '알 수 없음'
}

const getScheduleWorkerNames = (schedule) => {
  return schedule.workers
    .filter(workerId => selectedWorkers.value.includes(workerId))
    .map(id => userMap.value[id] || '알 수 없음')
}

const getDarkerColor = (color) => {
  // 색상을 어둡게 만드는 함수
  const colorMap = {
    '#3B82F6': '#1E40AF', // Blue -> Blue-700
    '#EF4444': '#B91C1C', // Red -> Red-700
    '#10B981': '#047857', // Green -> Green-700
    '#F59E0B': '#B45309', // Amber -> Amber-700
    '#8B5CF6': '#6D28D9', // Violet -> Violet-700
    '#EC4899': '#BE185D', // Pink -> Pink-700
    '#06B6D4': '#0E7490', // Cyan -> Cyan-700
    '#84CC16': '#4D7C0F', // Lime -> Lime-700
    '#F97316': '#C2410C', // Orange -> Orange-700
    '#6366F1': '#4338CA', // Indigo -> Indigo-700
  }
  return colorMap[color] || color
}

const scrollToUpcoming = () => {
  upcomingSection.value?.scrollIntoView({ behavior: 'smooth' })
}

const scrollToCompleted = () => {
  completedSection.value?.scrollIntoView({ behavior: 'smooth' })
}

const showScheduleDetail = (schedule) => {
  selectedSchedule.value = schedule
  scheduleDialog.value = true
}

const showDateDetail = (date) => {
  if (date.schedules.length === 0) return
  
  // 스케줄이 하나면 바로 상세 보기
  if (date.schedules.length === 1) {
    showScheduleDetail(date.schedules[0])
  } else {
    // 여러 스케줄이 있으면 첫 번째 스케줄 표시 (추후 개선 가능)
    showScheduleDetail(date.schedules[0])
  }
}

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

const refreshData = async () => {
  if (refreshing.value) return

  refreshing.value = true
  try {
    await Promise.all([fetchUsers(), fetchMeta()])
    updateLastUpdateTime()
    showNotification('데이터가 새로고침되었습니다.')
  } catch (err) {
    console.error('데이터 새로고침 실패:', err)
    showNotification('데이터 새로고침에 실패했습니다.', 'error')
  } finally {
    refreshing.value = false
  }
}

const retryOperation = async () => {
  if (retrying.value) return

  retrying.value = true
  clearError()

  try {
    await initializeData()
    showNotification('데이터를 성공적으로 불러왔습니다.')
  } catch (err) {
    console.error('재시도 실패:', err)
    showNotification('재시도에 실패했습니다.', 'error')
  } finally {
    retrying.value = false
  }
}

// 데이터 fetching 함수들
async function fetchUsers() {
  loadingWorkers.value = true
  try {
    const snap = await getDocs(collection(db, 'users'))
    workers.value = snap.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name || doc.id,
    }))
    userMap.value = Object.fromEntries(workers.value.map((u) => [u.id, u.name]))
  } catch (err) {
    console.error('사용자 목록 조회 실패:', err)
    throw new Error('사용자 목록을 불러오는 중 오류가 발생했습니다.')
  } finally {
    loadingWorkers.value = false
  }
}

async function fetchMeta() {
  loadingMeta.value = true
  try {
    const snap = await getDocs(collection(db, 'schedulesMeta'))
    const result = []
    for (const doc of snap.docs) {
      const data = doc.data()
      if (!data.date || !Array.isArray(data.workers)) continue
      result.push({
        id: doc.id,
        date: data.date,
        startTime: typeof data.startTime === 'string' ? data.startTime : '',
        workers: data.workers,
        notice: typeof data.notice === 'string' ? data.notice : '',
        workerNames: data.workers.map(
          (id) => userMap.value[id] || '알 수 없음'
        ),
      })
    }
    metaList.value = result
    updateLastUpdateTime()
  } catch (err) {
    console.error('일정 메타데이터 조회 실패:', err)
    throw new Error('작업자별 일정을 불러오는 중 오류가 발생했습니다.')
  } finally {
    loadingMeta.value = false
  }
}

async function initializeData() {
  // 전체 로딩은 최초 한 번만 사용
  if (!workers.value.length) {
    loading.value = true
  }

  try {
    // 🔐 Firebase 인증 확인
    const auth = getAuth()
    if (!auth.currentUser) {
      console.log('Firebase 재인증 중...')
      await signInAnonymously(auth)
    }

    // 👤 사용자 정보 복원
    if (!userStore.userId) {
      const userData = {
        id: localStorage.getItem('user_id'),
        name: localStorage.getItem('user_name'),
        role: localStorage.getItem('user_role'),
      }

      if (userData.id && userData.name && userData.role) {
        userStore.setUser(userData)
      } else {
        console.error('사용자 정보를 찾을 수 없습니다.')
        await router.push('/login')
        return
      }
    }

    // 🔄 데이터 로딩 - 각각 독립적인 로딩 상태
    let retryCount = 0
    const maxRetries = 3

    while (retryCount <= maxRetries) {
      try {
        // 작업자 목록 로딩
        if (!workers.value.length) {
          await fetchUsers()
        }

        // 기본적으로 모든 작업자 선택
        if (selectedWorkers.value.length === 0) {
          selectedWorkers.value = workers.value.map(w => w.id)
        }

        // 메타데이터 로딩
        await fetchMeta()
        break // 성공하면 루프 종료
      } catch (err) {
        retryCount++
        console.error(`데이터 로딩 실패 (${retryCount}/${maxRetries}):`, err)

        if (retryCount > maxRetries) {
          throw new Error(
            '데이터를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.'
          )
        }

        // 재시도 전 대기
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
      }
    }
  } catch (err) {
    console.error('초기화 실패:', err)
    error.value =
      err.message ||
      '데이터를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.'

    // 5초 후 로그인 페이지로 리다이렉트
    setTimeout(() => {
      router.push('/login')
    }, 5000)
  } finally {
    loading.value = false
  }
}

// 네트워크 상태 감지
function handleOnline() {
  isOnline.value = true
  showNotification('네트워크가 다시 연결되었습니다.', 'success')
}

function handleOffline() {
  isOnline.value = false
  showNotification('네트워크 연결이 끊어졌습니다.', 'warning', 5000)
}

// 라이프사이클 훅들
onMounted(async () => {
  // 네트워크 상태 리스너 등록
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // 데이터 초기화 - 비동기로 실행하여 블로킹 방지
  try {
    await initializeData()
  } catch (err) {
    console.error('초기화 중 오류:', err)
    // 에러는 initializeData 내부에서 처리됨
  }
})

onUnmounted(() => {
  // 네트워크 상태 리스너 해제
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style scoped>
/* 🎨 기본 헤더 스타일 */
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.v-app-bar.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

.v-app-bar.custom-header .v-toolbar__content {
  background: transparent !important;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
}

.back-btn:hover,
.back-btn:focus {
  background: rgba(255, 255, 255, 0.2) !important;
  transform: translateY(-1px);
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border-radius: 8px !important;
  transition: all 0.3s ease !important;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
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
.main-content {
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

/* 🦴 스켈레톤 로딩 스타일 */
.worker-skeleton-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 24px;
}

.worker-skeleton {
  height: 60px;
  border-radius: 16px;
}

.stats-skeleton-container {
  padding: 0;
}

.stats-skeleton {
  border-radius: 20px;
  overflow: hidden;
  height: 200px;
}

.schedule-skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schedule-skeleton {
  border-radius: 16px;
  overflow: hidden;
  height: 150px;
}


/* 📋 빈 상태 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease-in-out;
}

.empty-icon {
  margin-bottom: 24px;
}

.empty-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.empty-description {
  color: #64748b;
  font-size: 16px;
  margin-bottom: 0;
}

/* 📊 통계 카드 */
.stats-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stats-header {
  display: flex;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.stats-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.stats-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.stats-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 24px;
  gap: 16px;
}

.stat-item {
  position: relative;
  text-align: center;
  padding: 20px;
  border-radius: 16px;
  transition: all 0.3s ease;
  overflow: hidden;
  cursor: pointer;
}

.stat-item.upcoming {
  background: linear-gradient(135deg, #fef3cd 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
}

.stat-item.completed {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border: 2px solid #10b981;
}

.stat-item.total {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 2px solid #3b82f6;
}

.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 12px;
}

.stat-progress {
  margin-top: 8px;
}

.stat-item .stat-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0.3;
  font-size: 24px;
}

/* 📊 일정 섹션 */
.schedule-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.section-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.section-icon.upcoming {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.section-icon.completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

/* 📋 일정 카드 */
.schedule-card {
  background: white;
  border-radius: 16px;
  margin-bottom: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.schedule-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.upcoming-card {
  background: linear-gradient(135deg, #fef3cd 0%, #fde68a 5%, #ffffff 15%);
  border-left: 6px solid #f59e0b;
}

.upcoming-card.urgent {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 5%, #ffffff 15%);
  border-left: 6px solid #ef4444;
  animation: pulseGlow 2s infinite;
}

.past-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 5%, #ffffff 15%);
  border-left: 6px solid #10b981;
}

.card-content {
  position: relative;
}

.card-main-info {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.date-badge {
  padding: 8px 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.upcoming-badge {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.past-badge {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.date-info {
  flex: 1;
}

.work-date {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.work-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
}

.notice-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f1f5f9;
  border-radius: 12px;
  margin-bottom: 16px;
}

.notice-text {
  font-size: 14px;
  color: #475569;
  font-style: italic;
}

.status-section {
  display: flex;
  justify-content: flex-end;
}

.pulse {
  animation: pulse 2s infinite;
}

/* 📱 일정 상세 다이얼로그 */
.schedule-detail-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialog-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-subtitle {
  font-size: 14px;
  opacity: 0.8;
}

.dialog-content {
  padding: 24px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-info {
  flex: 1;
}

.detail-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 16px;
  color: #1e293b;
  font-weight: 500;
}

/* 🚨 알림 스타일 */
.info-alert {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1px solid #3b82f6;
}

/* 🔄 뷰 토글 카드 */
.view-toggle-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.view-toggle-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.toggle-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.toggle-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

.view-toggle-buttons {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.view-toggle-buttons .v-btn {
  color: rgba(255, 255, 255, 0.9) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.view-toggle-buttons .v-btn--active {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

/* 📅 달력 뷰 스타일 */
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
  padding: 16px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
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
  min-height: 100px;
  padding: 8px;
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

.calendar-date.has-schedule {
  background: linear-gradient(135deg, #fef3cd 0%, #fde68a 100%);
  border-left: 4px solid #f59e0b;
}

.calendar-date.weekend {
  background: #fefcfb;
}

.calendar-date.weekend.other-month {
  background: #f7f6f5;
}

.date-number {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
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
  flex-wrap: wrap;
  gap: 2px;
  align-items: center;
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

.schedule-more {
  font-size: 10px;
  color: #64748b;
  font-weight: 600;
  margin-left: 2px;
}

/* 🏠 플로팅 홈 버튼 */
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
  backdrop-filter: blur(10px);
}

.home-btn {
  height: 56px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.home-btn:hover,
.home-btn:focus {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes pulseGlow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
}

/* 스케줄 카드 애니메이션 */
.schedule-fade-item {
  animation: fadeIn 0.4s ease-in-out;
}

.schedule-fade-item:nth-child(1) {
  animation-delay: 0.1s;
}

.schedule-fade-item:nth-child(2) {
  animation-delay: 0.2s;
}

.schedule-fade-item:nth-child(3) {
  animation-delay: 0.3s;
}

.schedule-fade-item:nth-child(4) {
  animation-delay: 0.4s;
}

.schedule-fade-item:nth-child(5) {
  animation-delay: 0.5s;
}

/* 🎯 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .schedule-card:hover,
  .worker-btn:hover,
  .stat-item:hover,
  .home-btn:hover {
    transform: none;
  }
}

/* 📅 달력 반응형 */
@media (max-width: 1024px) {
  .calendar-date {
    min-height: 80px;
  }
  
  .calendar-controls {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .current-month {
    min-width: 100px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .calendar-header {
    padding: 20px;
  }
  
  .calendar-header-content {
    flex-direction: column;
    gap: 16px;
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
  
  .date-number {
    font-size: 12px;
  }
  
  .schedule-dot {
    width: 6px;
    height: 6px;
  }
  
  .schedule-more {
    font-size: 9px;
  }
  
  .weekday-header {
    padding: 12px 4px;
    font-size: 12px;
  }
  
  .view-toggle-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .view-toggle-buttons {
    align-self: stretch;
  }
}

/* 🎯 반응형 디자인 */
@media (max-width: 768px) {
  .worker-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px;
    padding: 20px;
  }

  .worker-skeleton-container {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px;
    padding: 20px;
  }

  .worker-btn {
    height: 52px;
    font-size: 14px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 20px;
  }

  .stat-number {
    font-size: 28px;
  }

  .card-main-info {
    flex-direction: column;
    gap: 12px;
  }

  .date-badge {
    align-self: flex-start;
  }

  .section-title {
    font-size: 20px;
  }

  .work-date {
    font-size: 16px;
  }

  .floating-actions {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 20px;
  }

  .worker-grid {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .worker-skeleton-container {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-item {
    padding: 16px;
  }

  .stat-number {
    font-size: 24px;
  }

  .schedule-card {
    padding: 16px;
  }

  .card-header {
    padding: 20px;
  }

  .floating-actions {
    padding: 16px;
  }

  .home-btn {
    height: 52px;
  }
}

/* 포커스 가능한 요소들의 아웃라인 */
*:focus {
  outline: 2px solid rgba(79, 70, 229, 0.5);
  outline-offset: 2px;
}

.v-btn:focus {
  outline: 2px solid rgba(79, 70, 229, 0.5);
  outline-offset: 2px;
}

/* 추가 스타일링 */
.custom-header * {
  color: white !important;
}

.custom-header .v-btn--icon {
  background: rgba(255, 255, 255, 0.1) !important;
}

.custom-header .v-chip {
  background: rgba(255, 200, 0, 0.9) !important;
  color: #1a1a1a !important;
}

</style>
