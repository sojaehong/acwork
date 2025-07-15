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
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div class="header-icon-wrapper">
            <v-icon size="32" color="white">mdi-calendar-month</v-icon>
          </div>
          <div class="ml-3">
            <h2 class="header-title">전체 작업 일정</h2>
            <div class="header-subtitle">모든 작업을 한눈에</div>
          </div>
        </div>

        <div class="d-flex align-center">
          <!-- 필터 상태 표시 -->
          <v-chip
            v-if="hasActiveFilters"
            color="warning"
            size="small"
            class="mr-2"
          >
            <v-icon start size="14">mdi-filter</v-icon>
            필터 적용됨
          </v-chip>

          <!-- 필터 토글 버튼 -->
          <v-btn
            icon
            size="large"
            class="filter-toggle-btn"
            @click="toggleFilters"
            @keydown.enter="toggleFilters"
            @keydown.space="toggleFilters"
            :aria-label="showFilters ? '필터 닫기' : '필터 열기'"
          >
            <v-icon>{{ showFilters ? 'mdi-filter-off' : 'mdi-filter' }}</v-icon>
          </v-btn>
        </div>
      </div>
    </v-app-bar>

    <v-main class="main-content">
      <!-- 🌀 로딩 오버레이 -->
      <div v-if="loading || store.isLoading" class="loading-overlay">
        <div class="loading-container">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            width="6"
          />
          <div class="loading-text mt-4">작업 목록 로딩 중...</div>
        </div>
      </div>

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
        </v-alert>

        <!-- 📊 통계 요약 카드 -->
        <v-card class="stats-card mb-8" elevation="0" v-if="!loading && !store.isLoading">
          <div class="stats-header">
            <div class="stats-icon">
              <v-icon color="primary">mdi-chart-line</v-icon>
            </div>
            <h3 class="stats-title">작업 현황</h3>
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">{{ safeFilteredSchedules.length }}</div>
              <div class="stat-label">총 작업</div>
            </div>
            <div class="stat-item">
              <div class="stat-number text-warning">
                {{ getStatusCount('진행') }}
              </div>
              <div class="stat-label">진행중</div>
            </div>
            <div class="stat-item">
              <div class="stat-number text-success">
                {{ getStatusCount('완료') }}
              </div>
              <div class="stat-label">완료</div>
            </div>
            <div class="stat-item">
              <div class="stat-number text-error">
                {{ getStatusCount('보류') }}
              </div>
              <div class="stat-label">보류</div>
            </div>
          </div>
        </v-card>

        <!-- 📅 작업 목록 -->
        <div v-if="paginatedGroupedSchedules.length">
          <v-slide-y-transition group>
            <div
              v-for="[date, items] in paginatedGroupedSchedules"
              :key="date"
              class="date-section mb-10"
            >
              <!-- 강화된 날짜 헤더 -->
              <div class="enhanced-date-header">
                <div class="date-header-main">
                  <div class="date-icon">
                    <v-icon color="white" size="24">mdi-calendar</v-icon>
                  </div>
                  <div class="date-info">
                    <h3 class="date-title">{{ formatDateWithDay(date) }}</h3>
                    <div class="date-meta">
                      <span class="date-count">{{ items.length }}건의 작업</span>
                      <span class="date-separator">•</span>
                      <span class="date-badge">{{ getDdayText(date) }}</span>
                    </div>
                  </div>
                </div>
                <div class="date-line"></div>
              </div>

              <!-- 작업 카드들 컨테이너 -->
              <div class="schedule-cards-container">
                <div class="schedule-grid">
                  <v-card
                    v-for="item in items"
                    :key="item.id"
                    class="schedule-card"
                    elevation="0"
                    @click="goToDetail(item.id)"
                    @keydown.enter="goToDetail(item.id)"
                    @keydown.space.prevent="goToDetail(item.id)"
                    tabindex="0"
                    role="button"
                    :aria-label="`${item.building} ${item.room}호 작업 상세보기`"
                  >
                    <div class="card-content-wrapper">
                      <!-- 카드 헤더: 건물 정보 + 상태 -->
                      <div class="card-header">
                        <div class="building-info">
                          <v-icon class="building-icon" color="primary"
                            >mdi-office-building-outline</v-icon
                          >
                          <div class="building-text">
                            <h4 class="building-name">{{ item.building }}</h4>
                            <div class="unit-info">
                              <span v-if="item.unit">{{ item.unit }}동</span>
                              <span v-if="item.room" class="room-number"
                                >{{ item.room }}호</span
                              >
                            </div>
                          </div>
                        </div>
                        
                        <!-- 상태 뱃지들 - 항상 가로로 나란히 오른쪽 끝에 -->
                        <div class="status-badges">
                          <v-chip
                            :color="displayStatusColor(item)"
                            :size="badgeSize"
                            variant="flat"
                            class="status-chip"
                          >
                            <v-icon :start="!isMobile" :size="iconSize">{{
                              getStatusIcon(item)
                            }}</v-icon>
                            <span v-if="!isMobile">{{ displayStatusText(item) }}</span>
                            <span v-else class="mobile-status-text">{{ getShortStatus(displayStatusText(item)) }}</span>
                          </v-chip>
                          <v-chip
                            :color="item.invoice ? 'blue' : 'grey-lighten-2'"
                            :size="badgeSize"
                            variant="flat"
                            class="invoice-chip"
                          >
                            <v-icon :start="!isMobile" :size="iconSize">{{
                              item.invoice ? 'mdi-receipt' : 'mdi-receipt-outline'
                            }}</v-icon>
                            <span v-if="!isMobile">{{ item.invoice ? '계산서' : '미발행' }}</span>
                            <span v-else class="mobile-invoice-text">{{ item.invoice ? '계산서' : '미발행' }}</span>
                          </v-chip>
                        </div>
                      </div>

                      <v-divider class="my-3"></v-divider>

                      <!-- 카드 본문: 작업 내용 + 메모 -->
                      <div class="card-body">
                        <!-- 작업 내용 -->
                        <div class="info-row" v-if="item.tasks?.length">
                          <v-icon class="info-icon" size="18"
                            >mdi-format-list-checks</v-icon
                          >
                          <div class="task-chips">
                            <v-chip
                              v-for="(task, i) in item.tasks"
                              :key="`${task.name}-${i}`"
                              size="small"
                              variant="tonal"
                              color="secondary"
                              class="task-chip"
                            >
                              {{ task.name }} ({{ task.count }})
                            </v-chip>
                          </div>
                        </div>

                        <!-- 메모 -->
                        <div class="info-row" v-if="item.memo">
                          <v-icon class="info-icon" size="18"
                            >mdi-note-text-outline</v-icon
                          >
                          <p class="memo-text">{{ item.memo }}</p>
                        </div>
                      </div>
                    </div>

                    <!-- 카드 호버 인디케이터 -->
                    <div class="card-hover-indicator">
                      <v-icon>mdi-chevron-right</v-icon>
                    </div>
                  </v-card>
                </div>
              </div>
            </div>
          </v-slide-y-transition>

          <!-- 더 보기 버튼 -->
          <div v-if="hasMoreItems" class="text-center mt-6">
            <v-btn
              color="primary"
              variant="outlined"
              size="large"
              @click="loadMore"
              :loading="isLoadingMore"
              class="load-more-btn"
            >
              <v-icon start>mdi-plus</v-icon>
              더 보기 ({{ remainingItemsCount }}개 남음)
            </v-btn>
          </div>
        </div>

        <!-- 빈 상태 -->
        <div v-else-if="!loading && !store.isLoading" class="empty-state">
          <div class="empty-icon">
            <v-icon size="80" color="grey-lighten-2"
              >mdi-calendar-remove</v-icon
            >
          </div>
          <h3 class="empty-title">
            {{
              hasActiveFilters
                ? '필터 조건에 맞는 작업이 없습니다'
                : '등록된 작업이 없습니다'
            }}
          </h3>
          <p class="empty-description">
            {{
              hasActiveFilters
                ? '필터를 조정하거나 초기화해보세요.'
                : '새 작업을 등록하여 시작해보세요!'
            }}
          </p>
          <v-btn
            v-if="hasActiveFilters"
            color="primary"
            @click="resetFilters"
            class="mt-4"
          >
            <v-icon start>mdi-filter-off</v-icon>
            필터 초기화
          </v-btn>
        </div>
      </v-container>

      <!-- 🏠 하단 홈 버튼 -->
      <div class="floating-actions" v-if="!showFilters">
        <v-btn
          block
          size="large"
          variant="outlined"
          class="home-btn"
          @click="goHome"
          @keydown.enter="goHome"
          @keydown.space="goHome"
        >
          <v-icon start>mdi-home</v-icon>
          홈으로 돌아가기
        </v-btn>
      </div>

      <!-- 🔍 필터 드로어 -->
      <v-slide-y-transition>
        <div v-show="showFilters" class="filter-drawer">
          <div class="filter-header">
            <h3 class="filter-title">
              <v-icon start>mdi-filter</v-icon>
              필터 설정
            </h3>
            <v-btn
              icon
              variant="text"
              size="small"
              @click="toggleFilters"
              aria-label="필터 닫기"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>

          <div class="filter-content">
            <!-- 날짜 범위 -->
            <div class="filter-section">
              <h4 class="filter-section-title">
                <v-icon start size="20">mdi-calendar-range</v-icon>
                날짜 범위
              </h4>
              <v-row dense>
                <v-col cols="6">
                  <flat-pickr
                    v-model="store.filters.startDate"
                    :config="dateConfig"
                    placeholder="시작일"
                    class="date-input"
                    @change="applyFiltersDebounced"
                  />
                </v-col>
                <v-col cols="6">
                  <flat-pickr
                    v-model="store.filters.endDate"
                    :config="dateConfig"
                    placeholder="종료일"
                    class="date-input"
                    @change="applyFiltersDebounced"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- 검색 -->
            <div class="filter-section">
              <h4 class="filter-section-title">
                <v-icon start size="20">mdi-magnify</v-icon>
                검색
              </h4>
              <v-text-field
                v-model="store.filters.searchText"
                label="호수 또는 메모로 검색"
                variant="outlined"
                density="compact"
                clearable
                @input="applyFiltersDebounced"
              >
                <template #prepend-inner>
                  <v-icon>mdi-magnify</v-icon>
                </template>
              </v-text-field>
            </div>

            <!-- 필터 그룹들 -->
            <div
              v-for="(group, key) in filterGroups"
              :key="key"
              class="filter-section"
            >
              <h4 class="filter-section-title">
                <v-icon start size="20">{{ group.icon }}</v-icon>
                {{ group.label }}
              </h4>
              <div class="filter-chips">
                <v-chip
                  v-for="opt in group.options"
                  :key="opt"
                  :color="group.active(opt) ? 'primary' : 'grey-lighten-2'"
                  :variant="group.active(opt) ? 'flat' : 'outlined'"
                  size="small"
                  class="filter-chip"
                  @click="() => toggleFilter(group.type, opt)"
                  @keydown.enter="() => toggleFilter(group.type, opt)"
                  @keydown.space.prevent="() => toggleFilter(group.type, opt)"
                  tabindex="0"
                  role="button"
                  :aria-label="`${group.label} ${opt} ${group.active(opt) ? '선택됨' : '선택 안됨'}`"
                >
                  <v-icon v-if="group.active(opt)" start size="14">
                    mdi-check
                  </v-icon>
                  {{ opt }}
                </v-chip>
              </div>
            </div>

            <!-- 필터 액션 버튼 -->
            <div class="filter-actions">
              <v-btn
                variant="outlined"
                color="grey"
                block
                @click="resetFilters"
                class="mb-3"
              >
                <v-icon start>mdi-refresh</v-icon>
                필터 초기화
              </v-btn>
              <v-btn color="primary" block @click="toggleFilters">
                <v-icon start>mdi-check</v-icon>
                필터 적용 완료
              </v-btn>
            </div>
          </div>
        </div>
      </v-slide-y-transition>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useScheduleStore } from '@/stores/schedule'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Korean } from 'flatpickr/dist/l10n/ko.js'
import debounce from 'lodash/debounce'

const router = useRouter()
const userStore = useUserStore()
const store = useScheduleStore()

// 반응형 상태
const loading = ref(false)
const showFilters = ref(false)
const statuses = ref([])
const buildings = ref([])
const taskTypes = ref([])
const currentPage = ref(1)
const isLoadingMore = ref(false)
const error = ref(null)

// 상수
const invoiceOptions = ['O', 'X']
const ITEMS_PER_PAGE = 20
const dateConfig = { 
  locale: Korean, 
  dateFormat: 'Y-m-d', 
  disableMobile: true,
  allowInput: true
}

// 모바일 감지
const isMobile = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth <= 768
  }
  return false
})

// 뱃지 크기 반응형
const badgeSize = computed(() => {
  if (typeof window !== 'undefined') {
    if (window.innerWidth <= 480) return 'x-small'
    if (window.innerWidth <= 768) return 'small'
  }
  return 'small'
})

// 아이콘 크기 반응형
const iconSize = computed(() => {
  if (typeof window !== 'undefined') {
    if (window.innerWidth <= 480) return '12'
    if (window.innerWidth <= 768) return '14'
  }
  return '14'
})

// 짧은 상태 텍스트
const getShortStatus = (status) => {
  switch (status) {
    case '진행':
      return '진행'
    case '완료':
      return '완료'
    case '보류':
      return '보류'
    case '예정':
      return '예정'
    case '취소됨':
      return '취소'
    default:
      return status
  }
}

// 타입 가드 함수
const isValidScheduleItem = (item) => {
  return item && 
         typeof item.id !== 'undefined' && 
         typeof item.building === 'string' && 
         typeof item.status === 'string' &&
         typeof item.date === 'string'
}

// 필터 관련 함수
const toggleFilter = (type, value) => {
  try {
    if (type === 'invoice') {
      store.setFilters({
        invoice: store.filters.invoice === value ? null : value,
      })
    } else {
      const target = [...store.filters[type]]
      const updated = target.includes(value)
        ? target.filter((v) => v !== value)
        : [...target, value]
      store.setFilters({ [type]: updated })
    }
  } catch (err) {
    console.error('필터 토글 중 오류:', err)
    error.value = '필터 설정 중 오류가 발생했습니다.'
  }
}

const resetFilters = () => {
  try {
    store.resetFilters()
    currentPage.value = 1
  } catch (err) {
    console.error('필터 리셋 중 오류:', err)
    error.value = '필터 초기화 중 오류가 발생했습니다.'
  }
}

const applyFiltersDebounced = debounce(() => {
  try {
    currentPage.value = 1
    // URL 쿼리 파라미터에 필터 상태 저장
    const query = {}
    const filters = store.filters
    
    if (filters.searchText) query.search = filters.searchText
    if (filters.status.length) query.status = filters.status.join(',')
    if (filters.building.length) query.building = filters.building.join(',')
    if (filters.task.length) query.task = filters.task.join(',')
    if (filters.invoice) query.invoice = filters.invoice
    if (filters.startDate) query.startDate = filters.startDate
    if (filters.endDate) query.endDate = filters.endDate
    
    router.replace({ query }).catch(() => {
      // 라우터 에러 무시 (동일한 라우트로의 이동)
    })
  } catch (err) {
    console.error('필터 적용 중 오류:', err)
  }
}, 300)

// 네비게이션 함수
const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const goToDetail = (id) => {
  try {
    router.push(`/schedule/${id}?from=schedules`)
  } catch (err) {
    console.error('상세 페이지 이동 중 오류:', err)
    error.value = '페이지 이동 중 오류가 발생했습니다.'
  }
}

const goHome = () => {
  try {
    router.push('/')
  } catch (err) {
    console.error('홈 이동 중 오류:', err)
    error.value = '홈으로 이동 중 오류가 발생했습니다.'
  }
}

const clearError = () => {
  error.value = null
}

// 페이지네이션 함수
const loadMore = () => {
  isLoadingMore.value = true
  setTimeout(() => {
    currentPage.value += 1
    isLoadingMore.value = false
  }, 300)
}

// 날짜 관련 함수
const formatDateWithDay = (dateStr) => {
  try {
    const date = new Date(dateStr)
    const day = date.toLocaleDateString('ko-KR', { weekday: 'short' })
    return `${dateStr} (${day})`
  } catch (err) {
    console.error('날짜 포맷 오류:', err)
    return dateStr
  }
}

const getDdayText = (dateStr) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const targetDate = new Date(dateStr)
    const todayDate = new Date(today)
    const diffTime = targetDate - todayDate
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '내일'
    if (diffDays === -1) return '어제'
    if (diffDays > 0) return `D-${diffDays}`
    return `D+${Math.abs(diffDays)}`
  } catch (err) {
    console.error('D-day 계산 오류:', err)
    return ''
  }
}

// 상태 관련 함수
const displayStatusColor = (item) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    if (item.status === '진행') {
      if (item.date === today) return 'orange'
      if (item.date > today) return 'purple'
    }
    switch (item.status) {
      case '완료':
        return 'green'
      case '보류':
        return 'red'
      default:
        return 'grey'
    }
  } catch (err) {
    console.error('상태 색상 계산 오류:', err)
    return 'grey'
  }
}

const displayStatusText = (item) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    if (item.status === '진행') {
      if (item.date === today) return '진행'
      if (item.date > today) return '예정'
    }
    return item.status
  } catch (err) {
    console.error('상태 텍스트 계산 오류:', err)
    return item.status || '알 수 없음'
  }
}

const getStatusIcon = (item) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    if (item.status === '진행') {
      if (item.date === today) return 'mdi-play-circle'
      if (item.date > today) return 'mdi-clock-outline'
    }
    switch (item.status) {
      case '완료':
        return 'mdi-check-circle'
      case '보류':
        return 'mdi-pause-circle'
      default:
        return 'mdi-help-circle'
    }
  } catch (err) {
    console.error('상태 아이콘 계산 오류:', err)
    return 'mdi-help-circle'
  }
}

const getStatusCount = (status) => {
  try {
    return safeFilteredSchedules.value.filter((item) => item.status === status).length
  } catch (err) {
    console.error('상태 카운트 계산 오류:', err)
    return 0
  }
}

// 계산된 속성들
const hasActiveFilters = computed(() => {
  const { status, building, task, invoice, searchText, startDate, endDate } = store.filters
  return (
    status.length ||
    building.length ||
    task.length ||
    invoice ||
    searchText ||
    startDate ||
    endDate
  )
})

const filteredSchedules = computed(() => {
  try {
    return store.schedules.filter((item) => {
      const { status, building, task, invoice, searchText, startDate, endDate } = store.filters
      
      const matchStatus = status.length
        ? status.includes(item.status)
        : item.status !== '취소됨'
      const matchBuilding = !building.length || building.includes(item.building)
      const matchTask = !task.length || item.tasks?.some((t) => task.includes(t.name))
      const matchInvoice = !invoice || (invoice === 'O' ? item.invoice : !item.invoice)
      const matchSearch = !searchText ||
        item.room?.includes(searchText) ||
        item.memo?.toLowerCase().includes(searchText.toLowerCase())
      const matchDate = (!startDate || new Date(item.date) >= new Date(startDate)) &&
        (!endDate || new Date(item.date) <= new Date(endDate))
      
      return matchStatus && matchBuilding && matchInvoice && matchTask && matchSearch && matchDate
    })
  } catch (err) {
    console.error('필터링 중 오류:', err)
    error.value = '데이터 필터링 중 오류가 발생했습니다.'
    return []
  }
})

const safeFilteredSchedules = computed(() => {
  return filteredSchedules.value.filter(isValidScheduleItem)
})

const groupedSchedules = computed(() => {
  try {
    const groups = {}
    for (const item of safeFilteredSchedules.value) {
      const date = item.date
      if (!groups[date]) groups[date] = []
      groups[date].push(item)
    }
    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  } catch (err) {
    console.error('그룹화 중 오류:', err)
    return []
  }
})

const paginatedGroupedSchedules = computed(() => {
  try {
    const totalItems = currentPage.value * ITEMS_PER_PAGE
    let itemCount = 0
    const result = []
    
    for (const [date, items] of groupedSchedules.value) {
      if (itemCount >= totalItems) break
      
      const remainingItems = totalItems - itemCount
      const itemsToShow = items.slice(0, remainingItems)
      
      if (itemsToShow.length > 0) {
        result.push([date, itemsToShow])
        itemCount += itemsToShow.length
      }
    }
    
    return result
  } catch (err) {
    console.error('페이지네이션 중 오류:', err)
    return []
  }
})

const hasMoreItems = computed(() => {
  const totalItems = safeFilteredSchedules.value.length
  const currentItems = currentPage.value * ITEMS_PER_PAGE
  return currentItems < totalItems
})

const remainingItemsCount = computed(() => {
  const totalItems = safeFilteredSchedules.value.length
  const currentItems = currentPage.value * ITEMS_PER_PAGE
  return Math.max(0, totalItems - currentItems)
})

const filterGroups = computed(() => ({
  status: {
    label: '상태',
    icon: 'mdi-flag',
    type: 'status',
    options: statuses.value,
    active: (val) => store.filters.status.includes(val),
  },
  building: {
    label: '건물',
    icon: 'mdi-office-building',
    type: 'building',
    options: buildings.value,
    active: (val) => store.filters.building.includes(val),
  },
  invoice: {
    label: '세금계산서',
    icon: 'mdi-receipt',
    type: 'invoice',
    options: invoiceOptions,
    active: (val) => store.filters.invoice === val,
  },
  task: {
    label: '작업 종류',
    icon: 'mdi-wrench',
    type: 'task',
    options: taskTypes.value,
    active: (val) => store.filters.task.includes(val),
  },
}))

// URL 쿼리에서 필터 복원
const restoreFiltersFromQuery = () => {
  try {
    const query = router.currentRoute.value.query
    if (Object.keys(query).length === 0) return

    const filters = {}
    if (query.search) filters.searchText = query.search
    if (query.status) filters.status = query.status.split(',')
    if (query.building) filters.building = query.building.split(',')
    if (query.task) filters.task = query.task.split(',')
    if (query.invoice) filters.invoice = query.invoice
    if (query.startDate) filters.startDate = query.startDate
    if (query.endDate) filters.endDate = query.endDate

    if (Object.keys(filters).length > 0) {
      store.setFilters(filters)
    }
  } catch (err) {
    console.error('URL에서 필터 복원 중 오류:', err)
  }
}

// 라이프사이클 훅
onMounted(async () => {
  loading.value = true
  
  try {
    // 🚀 향상된 인증 초기화
    const authResult = await userStore.initializeAuth(router)
    
    if (!authResult.success) {
      error.value = authResult.error
      return // 로그인 페이지로 이미 리다이렉트됨
    }

    // 🔄 재시도 로직이 포함된 데이터 로딩
    await userStore.withRetry(async () => {
      await store.fetchAllSchedules()
    })
    
    // 필터 옵션 설정
    statuses.value = [...new Set(store.schedules.map((s) => s.status).filter(Boolean))]
    buildings.value = [...new Set(store.schedules.map((s) => s.building).filter(Boolean))]
    taskTypes.value = [
      ...new Set(
        store.schedules.flatMap((s) => s.tasks?.map((t) => t.name) || []).filter(Boolean)
      ),
    ]
    
    // URL 쿼리에서 필터 복원
    restoreFiltersFromQuery()
    
  } catch (err) {
    console.error('초기화 실패:', err)
    error.value = err.message || '데이터를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  // debounced 함수 취소
  if (applyFiltersDebounced.cancel) {
    applyFiltersDebounced.cancel()
  }
})

// 필터 변경 감지 및 URL 동기화
watch(
  () => store.filters,
  () => {
    applyFiltersDebounced()
  },
  { deep: true }
)

// 에러 상태 감지
watch(
  () => store.error,
  (newError) => {
    if (newError) {
      error.value = newError
    }
  }
)
</script>

<style scoped>
/* 🎨 헤더 스타일 - 강화된 안정성 */
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* v-app-bar 기본 스타일 오버라이드 */
.v-app-bar.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

.v-app-bar.custom-header .v-toolbar__content {
  background: transparent !important;
}

.back-btn,
.filter-toggle-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
}

.back-btn:hover,
.filter-toggle-btn:hover,
.back-btn:focus,
.filter-toggle-btn:focus {
  background: rgba(255, 255, 255, 0.2) !important;
  transform: translateY(-1px);
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

/* Vuetify 기본 스타일 오버라이드 */
.v-app-bar .v-btn {
  color: inherit !important;
}

.v-app-bar .v-icon {
  color: inherit !important;
}

/* 추가 안정성을 위한 스타일 */
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 24px;
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
}

/* 📅 강화된 날짜 섹션 */
.date-section {
  margin-bottom: 40px;
}

.enhanced-date-header {
  position: relative;
  margin-bottom: 32px;
}

.date-header-main {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  padding: 24px 32px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(79, 70, 229, 0.2);
  position: relative;
  z-index: 2;
}

.date-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.date-info {
  flex: 1;
  color: white;
}

.date-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.date-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.date-count {
  font-weight: 600;
}

.date-separator {
  opacity: 0.6;
}

.date-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 12px;
  backdrop-filter: blur(5px);
}

.date-line {
  position: absolute;
  top: 50%;
  left: 24px;
  right: 24px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.3), transparent);
  z-index: 1;
}

/* 📋 작업 카드들 컨테이너 */
.schedule-cards-container {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.schedule-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.schedule-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.15);
  border-color: #4f46e5;
}

.schedule-card:focus {
  outline: 3px solid rgba(79, 70, 229, 0.3);
  outline-offset: 2px;
}

.card-content-wrapper {
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  min-height: 44px;
}

.building-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.building-icon {
  font-size: 28px !important;
  flex-shrink: 0;
  margin-top: 2px;
}

.building-text {
  flex: 1;
  min-width: 0;
}

.building-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unit-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
  flex-wrap: wrap;
}

.room-number {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

/* 상태 뱃지들 - 항상 가로로 나란히 오른쪽 끝에 */
.status-badges {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex-shrink: 0;
  margin-top: 2px;
}

.status-chip,
.invoice-chip {
  font-weight: 600;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mobile-status-text,
.mobile-invoice-text {
  font-size: 11px;
  font-weight: 600;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-icon {
  color: #94a3b8;
  margin-top: 3px;
  flex-shrink: 0;
}

.task-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.task-chip {
  font-weight: 500;
}

.memo-text {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
  flex: 1;
  word-break: keep-all;
}

.card-hover-indicator {
  position: absolute;
  top: 50%;
  right: -20px;
  transform: translateY(-50%);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  color: white;
  background: #4f46e5;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.schedule-card:hover .card-hover-indicator {
  opacity: 1;
  right: 16px;
}

/* 더 보기 버튼 */
.load-more-btn {
  border-radius: 16px;
  height: 48px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.2);
}

/* 📋 빈 상태 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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

/* 🔍 필터 드로어 */
.filter-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  z-index: 2000;
  max-height: 80vh;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.filter-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.filter-content {
  padding: 24px;
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 32px;
}

.filter-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.date-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
}

.date-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  outline: none;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  transition: all 0.3s ease;
  cursor: pointer;
}

.filter-chip:hover {
  transform: translateY(-1px);
}

.filter-chip:focus {
  outline: 2px solid rgba(79, 70, 229, 0.5);
  outline-offset: 2px;
}

.filter-actions {
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

/* 🎯 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .schedule-card:hover {
    transform: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .card-hover-indicator {
    display: none !important;
  }
  
  .stat-item:hover,
  .filter-chip:hover,
  .load-more-btn:hover,
  .home-btn:hover {
    transform: none;
  }
}

/* 🎯 반응형 디자인 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 20px;
  }

  .stat-number {
    font-size: 24px;
  }

  .schedule-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .date-header-main {
    padding: 20px 24px;
    gap: 16px;
  }

  .date-icon {
    width: 48px;
    height: 48px;
  }

  .date-title {
    font-size: 20px;
  }

  .schedule-cards-container {
    padding: 20px;
  }

  .card-header {
    gap: 12px;
  }

  .status-badges {
    gap: 4px;
  }

  .filter-content {
    padding: 20px;
  }

  .floating-actions {
    padding: 16px;
  }

  .hover-indicator {
    display: none;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .date-header-main {
    padding: 16px 20px;
    gap: 12px;
  }

  .date-icon {
    width: 40px;
    height: 40px;
  }

  .date-title {
    font-size: 18px;
  }

  .building-name {
    font-size: 16px;
  }

  .schedule-card {
    padding: 16px;
  }

  .schedule-cards-container {
    padding: 16px;
  }

  .card-header {
    gap: 8px;
    min-height: 40px;
  }

  .building-info {
    gap: 10px;
  }

  .status-badges {
    gap: 3px;
    margin-top: 0;
  }

  .mobile-status-text,
  .mobile-invoice-text {
    font-size: 10px;
  }

  .filter-header {
    padding: 20px;
  }

  .filter-content {
    padding: 16px;
  }

  .card-hover-indicator {
    display: none;
  }
}

/* 🎨 색상 유틸리티 */
.text-warning {
  color: #f59e0b !important;
}

.text-success {
  color: #10b981 !important;
}

.text-error {
  color: #ef4444 !important;
}

/* 애니메이션 */
.v-slide-y-transition-enter-active,
.v-slide-y-transition-leave-active {
  transition: all 0.3s ease;
}

.v-slide-y-transition-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.v-slide-y-transition-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 스크롤바 스타일링 */
.filter-content::-webkit-scrollbar {
  width: 6px;
}

.filter-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.filter-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.filter-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 포커스 가능한 요소들의 아웃라인 */
*:focus {
  outline: 2px solid rgba(79, 70, 229, 0.5);
  outline-offset: 2px;
}

/* 버튼 포커스 스타일 개선 */
.v-btn:focus {
  outline: 2px solid rgba(79, 70, 229, 0.5);
  outline-offset: 2px;
}
</style>