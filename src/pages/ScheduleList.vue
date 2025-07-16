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

      <v-container class="pa-6" style="padding-bottom: 120px !important; max-width: 1200px">
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
        <StatsCard 
          v-if="!loading && !store.isLoading"
          :stats="computedStats"
          class="mb-8"
        />

        <!-- 📅 작업 목록 -->
        <template v-if="paginatedScheduleData.totalItems > 0">
          <!-- 날짜별 섹션들 -->
          <div class="schedule-sections">
            <DateSection
              v-for="(group, index) in paginatedScheduleData.groupedItems"
              :key="`date-${group.date}-${index}`"
              :date="group.date"
              :items="group.items"
              :is-mobile="isMobile"
              :badge-size="badgeSize"
              :icon-size="iconSize"
              @item-click="handleItemClick"
              class="mb-8"
            />
          </div>

          <!-- 🚀 더 보기 버튼 -->
          <div 
            v-if="paginatedScheduleData.hasMore"
            class="load-more-section"
          >
            <div class="text-center mb-4">
              <div class="progress-info">
                {{ paginatedScheduleData.currentItems }} / {{ paginatedScheduleData.totalItems }}개 표시됨
              </div>
            </div>
            
            <v-btn
              color="primary"
              variant="outlined"
              size="large"
              :loading="isLoadingMore"
              class="load-more-btn"
              block
              @click="loadMoreItems"
            >
              <v-icon start>mdi-plus</v-icon>
              더 보기 ({{ paginatedScheduleData.remainingCount }}개 남음)
            </v-btn>
          </div>
        </template>

        <!-- 빈 상태 -->
        <EmptyStateCard
          v-else-if="!loading && !store.isLoading"
          :has-active-filters="hasActiveFilters"
          @reset-filters="resetFilters"
        />
      </v-container>

      <!-- 🏠 하단 홈 버튼 -->
      <FloatingHomeButton 
        v-if="!showFilters"
        @go-home="goHome"
      />

      <!-- 🔍 필터 드로어 -->
      <FilterDrawer
        v-model="showFilters"
        :filter-groups="filterGroups"
        :filters="store.filters"
        @toggle-filter="handleFilterToggle"
        @reset-filters="resetFilters"
        @apply-filters="applyFilters"
      />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useScheduleStore } from '@/stores/schedule'
import { useDebounceFn, useThrottleFn } from '@vueuse/core'

// 🚀 성능 최적화: 컴포넌트 지연 로딩
const DateSection = defineAsyncComponent(() => import('@/components/DateSection.vue'))
const StatsCard = defineAsyncComponent(() => import('@/components/StatsCard.vue'))
const EmptyStateCard = defineAsyncComponent(() => import('@/components/EmptyStateCard.vue'))
const FloatingHomeButton = defineAsyncComponent(() => import('@/components/FloatingHomeButton.vue'))
const FilterDrawer = defineAsyncComponent(() => import('@/components/FilterDrawer.vue'))

const router = useRouter()
const userStore = useUserStore()
const store = useScheduleStore()

// 🚀 상태 관리
const loading = ref(false)
const showFilters = ref(false)
const error = ref('')
const currentPage = ref(1)
const isLoadingMore = ref(false)

// 상수
const ITEMS_PER_PAGE = 10 // 페이지당 날짜 그룹 수

// 🚀 반응형 상태
const isMobile = ref(false)
const badgeSize = computed(() => {
  if (typeof window !== 'undefined') {
    if (window.innerWidth <= 480) return 'x-small'
    if (window.innerWidth <= 768) return 'small'
  }
  return 'small'
})

const iconSize = computed(() => {
  if (typeof window !== 'undefined') {
    if (window.innerWidth <= 480) return '12'
    if (window.innerWidth <= 768) return '14'
  }
  return '14'
})

// 🚀 Resize 이벤트 최적화
const updateResponsiveState = useThrottleFn(() => {
  isMobile.value = window.innerWidth <= 768
}, 100)

// 🚀 필터링된 스케줄 데이터
const filteredSchedules = computed(() => {
  try {
    const { schedules } = store
    const { status, building, task, invoice, searchText, startDate, endDate } = store.filters
    
    return schedules.filter(item => {
      // 유효성 검사
      if (!item?.id || typeof item.building !== 'string' || typeof item.status !== 'string') {
        return false
      }
      
      // 상태 필터 (기본적으로 취소됨 제외)
      const matchStatus = status.length ? status.includes(item.status) : item.status !== '취소됨'
      if (!matchStatus) return false
      
      // 기타 필터들
      if (building.length && !building.includes(item.building)) return false
      if (task.length && !item.tasks?.some(t => task.includes(t.name))) return false
      if (invoice && ((invoice === 'O') !== Boolean(item.invoice))) return false
      
      // 검색어 필터
      if (searchText) {
        const search = searchText.toLowerCase()
        const matchRoom = item.room?.toLowerCase().includes(search)
        const matchMemo = item.memo?.toLowerCase().includes(search)
        const matchBuilding = item.building?.toLowerCase().includes(search)
        if (!matchRoom && !matchMemo && !matchBuilding) return false
      }
      
      // 날짜 범위 필터
      if (startDate && new Date(item.date) < new Date(startDate)) return false
      if (endDate && new Date(item.date) > new Date(endDate)) return false
      
      return true
    })
  } catch (err) {
    console.error('필터링 오류:', err)
    return []
  }
})

// 🚀 페이지네이션된 스케줄 데이터
const paginatedScheduleData = computed(() => {
  try {
    const filtered = filteredSchedules.value
    
    // 날짜별 그룹화
    const groupMap = new Map()
    for (const item of filtered) {
      const date = item.date
      if (!groupMap.has(date)) {
        groupMap.set(date, [])
      }
      groupMap.get(date).push(item)
    }
    
    // 날짜순 정렬 (최신순)
    const sortedGroups = Array.from(groupMap.entries())
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([date, items]) => ({ date, items }))
    
    // 페이지네이션
    const maxGroups = currentPage.value * ITEMS_PER_PAGE
    const paginatedGroups = sortedGroups.slice(0, maxGroups)
    
    const totalItemCount = filtered.length
    const currentItemCount = paginatedGroups.reduce((sum, group) => sum + group.items.length, 0)
    
    return {
      groupedItems: paginatedGroups,
      totalItems: totalItemCount,
      currentItems: currentItemCount,
      hasMore: paginatedGroups.length < sortedGroups.length,
      remainingCount: Math.max(0, sortedGroups.length - paginatedGroups.length),
      allGroups: sortedGroups
    }
  } catch (err) {
    console.error('페이지네이션 오류:', err)
    return {
      groupedItems: [],
      totalItems: 0,
      currentItems: 0,
      hasMore: false,
      remainingCount: 0,
      allGroups: []
    }
  }
})

// 🚀 통계 계산
const computedStats = computed(() => {
  const items = filteredSchedules.value
  const statusCounts = {}
  
  for (const item of items) {
    const status = item.status
    statusCounts[status] = (statusCounts[status] || 0) + 1
  }
  
  return {
    total: items.length,
    active: statusCounts['진행'] || 0,
    completed: statusCounts['완료'] || 0,
    hold: statusCounts['보류'] || 0
  }
})

// 🚀 필터 상태
const hasActiveFilters = computed(() => {
  const { status, building, task, invoice, searchText, startDate, endDate } = store.filters
  return Boolean(
    status.length || building.length || task.length || 
    invoice || searchText || startDate || endDate
  )
})

// 🚀 필터 옵션들
const filterOptions = computed(() => {
  const schedules = store.schedules
  return {
    statuses: [...new Set(schedules.map(s => s.status).filter(Boolean))],
    buildings: [...new Set(schedules.map(s => s.building).filter(Boolean))],
    taskTypes: [...new Set(schedules.flatMap(s => s.tasks?.map(t => t.name) || []).filter(Boolean))]
  }
})

const filterGroups = computed(() => ({
  status: {
    label: '상태',
    icon: 'mdi-flag',
    type: 'status',
    options: filterOptions.value.statuses,
    active: (val) => store.filters.status.includes(val),
  },
  building: {
    label: '건물',
    icon: 'mdi-office-building',
    type: 'building',
    options: filterOptions.value.buildings,
    active: (val) => store.filters.building.includes(val),
  },
  task: {
    label: '작업 종류',
    icon: 'mdi-wrench',
    type: 'task',
    options: filterOptions.value.taskTypes,
    active: (val) => store.filters.task.includes(val),
  },
  invoice: {
    label: '세금계산서',
    icon: 'mdi-receipt',
    type: 'invoice',
    options: ['O', 'X'],
    active: (val) => store.filters.invoice === val,
  }
}))

// 🚀 이벤트 핸들러들
const handleItemClick = (id) => {
  if (!id) {
    error.value = '잘못된 작업 ID입니다.'
    return
  }
  router.push(`/schedule/${id}?from=schedules`).catch(err => {
    console.error('라우팅 오류:', err)
    error.value = '페이지 이동 중 오류가 발생했습니다.'
  })
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const goHome = () => {
  router.push('/').catch(err => {
    console.error('홈 이동 오류:', err)
  })
}

const clearError = () => {
  error.value = ''
}

// 🚀 필터 처리
const handleFilterToggle = (type, value) => {
  try {
    if (type === 'invoice') {
      store.setFilters({
        invoice: store.filters.invoice === value ? null : value,
      })
    } else {
      const current = [...store.filters[type]]
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      store.setFilters({ [type]: updated })
    }
    
    // 필터 변경 시 페이지 리셋
    currentPage.value = 1
  } catch (err) {
    console.error('필터 토글 오류:', err)
    error.value = '필터 설정 중 오류가 발생했습니다.'
  }
}

const resetFilters = () => {
  try {
    store.resetFilters()
    currentPage.value = 1
  } catch (err) {
    console.error('필터 리셋 오류:', err)
    error.value = '필터 초기화 중 오류가 발생했습니다.'
  }
}

const applyFilters = useDebounceFn((filters) => {
  try {
    store.setFilters(filters)
    currentPage.value = 1
  } catch (err) {
    console.error('필터 적용 오류:', err)
  }
}, 300)

// 🚀 더 보기 기능
const loadMoreItems = () => {
  if (isLoadingMore.value) return
  
  isLoadingMore.value = true
  
  setTimeout(() => {
    currentPage.value += 1
    isLoadingMore.value = false
  }, 300)
}

// 🚀 라이프사이클
onMounted(async () => {
  loading.value = true
  
  try {
    // 인증 초기화
    const authResult = await userStore.initializeAuth(router)
    if (!authResult.success) {
      error.value = authResult.error
      return
    }

    // 데이터 로딩
    await userStore.withRetry(async () => {
      await store.fetchAllSchedules()
    })
    
    // 반응형 상태 초기화
    updateResponsiveState()
    window.addEventListener('resize', updateResponsiveState)
    
  } catch (err) {
    console.error('초기화 실패:', err)
    error.value = err.message || '데이터를 불러오는 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateResponsiveState)
})

// 필터 변경 감지
watch(
  () => store.filters,
  () => {
    currentPage.value = 1
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
/* 🎨 헤더 스타일 */
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

/* 📅 스케줄 섹션들 */
.schedule-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 🚀 더 보기 섹션 */
.load-more-section {
  margin-top: 40px;
  padding: 32px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.progress-info {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.load-more-btn {
  border-radius: 16px;
  height: 56px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.2);
}

.load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.3);
}

/* 🎯 반응형 디자인 */
@media (max-width: 768px) {
  .header-title {
    font-size: 20px;
  }
  
  .schedule-sections {
    gap: 24px;
  }
  
  .load-more-section {
    margin-top: 32px;
    padding: 24px;
  }
  
  .load-more-btn {
    height: 48px;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 18px;
  }
  
  .header-subtitle {
    font-size: 11px !important;
  }
  
  .schedule-sections {
    gap: 20px;
  }
  
  .load-more-section {
    margin-top: 24px;
    padding: 20px;
  }
  
  .load-more-btn {
    height: 44px;
    font-size: 14px;
  }
}

/* 🎯 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .load-more-btn:hover,
  .back-btn:hover,
  .filter-toggle-btn:hover {
    transform: none;
  }
}

/* 애니메이션 최적화 */
@media (prefers-reduced-motion: reduce) {
  .load-more-btn,
  .back-btn,
  .filter-toggle-btn {
    transition: none;
  }
  
  .load-more-btn:hover,
  .back-btn:hover,
  .filter-toggle-btn:hover {
    transform: none;
  }
}

/* 포커스 스타일 */
*:focus {
  outline: 2px solid rgba(79, 70, 229, 0.5);
  outline-offset: 2px;
}

.v-btn:focus {
  outline: 2px solid rgba(79, 70, 229, 0.5);
  outline-offset: 2px;
}
</style>