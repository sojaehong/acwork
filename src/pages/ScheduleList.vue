<template>
  <v-app>
    <!-- 🎨 일관된 헤더 디자인 -->
    <v-app-bar 
      :elevation="0" 
      class="custom-header"
      height="80"
    >
      <div class="d-flex align-center justify-space-between w-100 px-4">
        <div class="d-flex align-center">
          <v-btn 
            icon 
            size="large"
            class="back-btn mr-3"
            @click="goHome"
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
            @click="showFilters = !showFilters"
          >
            <v-icon>{{ showFilters ? 'mdi-filter-off' : 'mdi-filter' }}</v-icon>
          </v-btn>
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
          <div class="loading-text mt-4">작업 목록 로딩 중...</div>
        </div>
      </div>

      <v-container class="pa-6" style="padding-bottom: 120px !important; max-width: 1200px;">
        <!-- 🚨 에러 알림 -->
        <v-alert v-if="error" type="error" class="mb-6" prominent>
          <v-icon start>mdi-alert-circle</v-icon>
          {{ error }}
        </v-alert>

        <!-- 📊 통계 요약 카드 -->
        <v-card class="stats-card mb-8" elevation="0" v-if="!isLoading">
          <div class="stats-header">
            <div class="stats-icon">
              <v-icon color="primary">mdi-chart-line</v-icon>
            </div>
            <h3 class="stats-title">작업 현황</h3>
          </div>
          
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">{{ filteredSchedules.length }}</div>
              <div class="stat-label">총 작업</div>
            </div>
            <div class="stat-item">
              <div class="stat-number text-warning">{{ getStatusCount('진행') }}</div>
              <div class="stat-label">진행중</div>
            </div>
            <div class="stat-item">
              <div class="stat-number text-success">{{ getStatusCount('완료') }}</div>
              <div class="stat-label">완료</div>
            </div>
            <div class="stat-item">
              <div class="stat-number text-error">{{ getStatusCount('보류') }}</div>
              <div class="stat-label">보류</div>
            </div>
          </div>
        </v-card>

        <!-- 📅 작업 목록 -->
        <div v-if="groupedSchedules.length">
          <v-slide-y-transition group>
            <div v-for="[date, items] in groupedSchedules" :key="date" class="date-group mb-8">
              <!-- 날짜 헤더 -->
              <div class="date-header">
                <div class="date-icon">
                  <v-icon color="primary">mdi-calendar</v-icon>
                </div>
                <div class="date-info">
                  <h3 class="date-title">{{ formatDateWithDay(date) }}</h3>
                  <div class="date-count">{{ items.length }}건의 작업</div>
                </div>
                <div class="date-badge">
                  {{ getDdayText(date) }}
                </div>
              </div>

              <!-- 작업 카드들 -->
              <div class="schedule-grid">
                <v-card
                  v-for="item in items"
                  :key="item.id"
                  class="schedule-card"
                  elevation="0"
                  @click="goToDetail(item.id)"
                >
                  <div class="card-content-wrapper">
                    <!-- 카드 헤더: 건물 정보 + 상태 -->
                    <div class="card-header">
                      <div class="building-info">
                        <v-icon class="building-icon" color="primary">mdi-office-building-outline</v-icon>
                        <div class="building-text">
                          <h4 class="building-name">{{ item.building }}</h4>
                          <div class="unit-info">
                            <span v-if="item.unit">{{ item.unit }}동</span>
                            <span v-if="item.room" class="room-number">{{ item.room }}호</span>
                          </div>
                        </div>
                      </div>
                      <div class="status-badges">
                        <v-chip :color="displayStatusColor(item)" size="small" variant="flat" class="status-chip">
                          <v-icon start size="14">{{ getStatusIcon(item) }}</v-icon>
                          {{ displayStatusText(item) }}
                        </v-chip>
                        <v-chip :color="item.invoice ? 'blue' : 'grey-lighten-2'" size="small" variant="flat" class="invoice-chip">
                          <v-icon start size="14">{{ item.invoice ? 'mdi-receipt' : 'mdi-receipt-outline' }}</v-icon>
                          {{ item.invoice ? '계산서' : '미발행' }}
                        </v-chip>
                      </div>
                    </div>

                    <v-divider class="my-3"></v-divider>

                    <!-- 카드 본문: 작업 내용 + 메모 -->
                    <div class="card-body">
                      <!-- 작업 내용 -->
                      <div class="info-row" v-if="item.tasks?.length">
                        <v-icon class="info-icon" size="18">mdi-format-list-checks</v-icon>
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
                        <v-icon class="info-icon" size="18">mdi-note-text-outline</v-icon>
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
          </v-slide-y-transition>
        </div>

        <!-- 빈 상태 -->
        <div v-else-if="!isLoading" class="empty-state">
          <div class="empty-icon">
            <v-icon size="80" color="grey-lighten-2">mdi-calendar-remove</v-icon>
          </div>
          <h3 class="empty-title">
            {{ hasActiveFilters ? '필터 조건에 맞는 작업이 없습니다' : '등록된 작업이 없습니다' }}
          </h3>
          <p class="empty-description">
            {{ hasActiveFilters ? '필터를 조정하거나 초기화해보세요.' : '새 작업을 등록하여 시작해보세요!' }}
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
              @click="showFilters = false"
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
                >
                  <v-icon 
                    v-if="group.active(opt)" 
                    start 
                    size="14"
                  >
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
              <v-btn
                color="primary"
                block
                @click="showFilters = false"
              >
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useScheduleStore } from '@/stores/schedule'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Korean } from 'flatpickr/dist/l10n/ko.js'
import debounce from 'lodash/debounce'

const router = useRouter()
const store = useScheduleStore()

const error = ref('')
const isLoading = ref(false)
const showFilters = ref(false)
const statuses = ref([])
const buildings = ref([])
const taskTypes = ref([])
const invoiceOptions = ['O', 'X']

const dateConfig = { locale: Korean, dateFormat: 'Y-m-d', disableMobile: true }

const toggleFilter = (type, value) => {
  if (type === 'invoice') {
    store.setFilters({ invoice: store.filters.invoice === value ? null : value })
    applyFiltersDebounced()
    return
  }
  const target = [...store.filters[type]]
  const updated = target.includes(value) ? target.filter(v => v !== value) : [...target, value]
  store.setFilters({ [type]: updated })
  applyFiltersDebounced()
}

const resetFilters = () => {
  store.resetFilters()
  applyFilters()
}

const applyFilters = () => {
  isLoading.value = true
  setTimeout(() => { isLoading.value = false }, 200)
}
const applyFiltersDebounced = debounce(applyFilters, 200)

const goToDetail = id => router.push(`/schedule/${id}`)
const goHome = () => router.push('/')

const formatDateWithDay = dateStr => {
  const date = new Date(dateStr)
  const day = date.toLocaleDateString('ko-KR', { weekday: 'short' })
  return `${dateStr} (${day})`
}

const getDdayText = dateStr => {
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
}

const displayStatusColor = item => {
  const today = new Date().toISOString().split('T')[0]
  if (item.status === '진행') {
    if (item.date === today) return 'orange'
    if (item.date > today) return 'purple'
  }
  switch (item.status) {
    case '완료': return 'green'
    case '보류': return 'red'
    default: return 'grey'
  }
}

const displayStatusText = item => {
  const today = new Date().toISOString().split('T')[0]
  if (item.status === '진행') {
    if (item.date === today) return '진행'
    if (item.date > today) return '예정'
  }
  return item.status
}

const getStatusIcon = item => {
  const today = new Date().toISOString().split('T')[0]
  if (item.status === '진행') {
    if (item.date === today) return 'mdi-play-circle'
    if (item.date > today) return 'mdi-clock-outline'
  }
  switch (item.status) {
    case '완료': return 'mdi-check-circle'
    case '보류': return 'mdi-pause-circle'
    default: return 'mdi-help-circle'
  }
}

const getStatusCount = status => {
  return filteredSchedules.value.filter(item => item.status === status).length
}

const hasActiveFilters = computed(() => {
  const { status, building, task, invoice, searchText, startDate, endDate } = store.filters
  return (
    status.length || building.length || task.length || invoice || searchText || startDate || endDate
  )
})

const filteredSchedules = computed(() => {
  return store.schedules.filter(item => {
    const { status, building, task, invoice, searchText, startDate, endDate } = store.filters
    const matchStatus = status.length ? status.includes(item.status) : item.status !== '취소됨'
    const matchBuilding = !building.length || building.includes(item.building)
    const matchTask = !task.length || item.tasks?.some(t => task.includes(t.name))
    const matchInvoice = !invoice || (invoice === 'O' ? item.invoice : !item.invoice)
    const matchSearch = !searchText || (item.room?.includes(searchText) || item.memo?.includes(searchText))
    const matchDate = (!startDate || new Date(item.date) >= new Date(startDate)) && (!endDate || new Date(item.date) <= new Date(endDate))
    return matchStatus && matchBuilding && matchInvoice && matchTask && matchSearch && matchDate
  })
})

const groupedSchedules = computed(() => {
  const groups = {}
  for (const item of filteredSchedules.value) {
    const date = item.date
    if (!groups[date]) groups[date] = []
    groups[date].push(item)
  }
  return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]))
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
  }
}))

onMounted(async () => {
  try {
    isLoading.value = true
    const q = query(collection(db, 'schedules'), orderBy('date', 'desc'))
    const snapshot = await getDocs(q)
    const fetchedSchedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    store.setSchedules(fetchedSchedules)
    statuses.value = [...new Set(fetchedSchedules.map(s => s.status))]
    buildings.value = [...new Set(fetchedSchedules.map(s => s.building))]
    taskTypes.value = [...new Set(fetchedSchedules.flatMap(s => s.tasks?.map(t => t.name) || []))]
  } catch (err) {
    error.value = '작업을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
/* 🎨 헤더 스타일 - 메인과 동일 */
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-btn, .filter-toggle-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 12px;
}

.back-btn:hover, .filter-toggle-btn:hover {
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

/* 📅 날짜 그룹 */
.date-group {
  margin-bottom: 32px;
}

.date-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.date-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.date-info {
  flex: 1;
}

.date-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.date-count {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.date-badge {
  padding: 8px 16px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
}

/* 📋 스케줄 카드 */
.schedule-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
}

.schedule-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.15);
  border-color: #4f46e5;
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
}

.building-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.building-icon {
  font-size: 28px !important;
}

.building-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.unit-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
  margin-top: 2px;
}

.room-number {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  color: #475569;
}

.status-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.status-chip, .invoice-chip {
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

.home-btn:hover {
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

.filter-actions {
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
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
  
  .date-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .date-badge {
    align-self: flex-start;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .status-badges {
    flex-direction: row;
    gap: 8px;
  }
  
  .filter-content {
    padding: 20px;
  }
  
  .floating-actions {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 20px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
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
</style>