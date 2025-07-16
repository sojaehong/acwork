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

        <!-- 🌀 스켈레톤 로딩 UI -->
        <template v-if="loading || store.isLoading">
          <div class="skeleton-stats-card mb-8"></div>
          <div class="schedule-skeleton">
            <div v-for="i in 2" :key="i" class="skeleton-section">
              <div class="skeleton-section-header">
                <div class="skeleton-section-icon"></div>
                <div class="skeleton-section-title"></div>
              </div>
              <div class="skeleton-cards">
                <div v-for="j in 2" :key="j" class="skeleton-card">
                  <div class="skeleton-card-header">
                    <div class="skeleton-building-info">
                      <div class="skeleton-building-icon"></div>
                      <div class="skeleton-building-text">
                        <div class="skeleton-building-name"></div>
                        <div class="skeleton-room-number"></div>
                      </div>
                    </div>
                    <div class="skeleton-badges">
                      <div class="skeleton-badge"></div>
                      <div class="skeleton-badge"></div>
                    </div>
                  </div>
                  <div class="skeleton-card-body">
                    <div class="skeleton-task-chips">
                      <div class="skeleton-chip"></div>
                      <div class="skeleton-chip"></div>
                    </div>
                    <div class="skeleton-memo"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 📊 실제 컨텐츠 -->
        <template v-else>
          <!-- 통계 요약 카드 -->
          <StatsCard 
            :stats="computedStats"
            class="mb-8"
          />

          <!-- 작업 목록 -->
          <template v-if="paginatedScheduleData.totalItems > 0">
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

            <!-- 더 보기 버튼 -->
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
            v-else
            :has-active-filters="hasActiveFilters"
            @reset-filters="resetFilters"
          />
        </template>
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
import { ref, computed, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
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
const loading = ref(true)
const showFilters = ref(false)
const error = ref('')
const currentPage = ref(1)
const isLoadingMore = ref(false)

// 상수
const ITEMS_PER_PAGE = 10 // 페이지당 날짜 그룹 수

// 🚀 반응형 상태
const isMobile = ref(false)
const badgeSize = computed(() => (isMobile.value ? 'x-small' : 'small'))
const iconSize = computed(() => (isMobile.value ? '12' : '14'))

// 🚀 Resize 이벤트 최적화
const updateResponsiveState = useThrottleFn(() => {
  isMobile.value = window.innerWidth <= 768
}, 200)

// 🚀 필터링된 스케줄 데이터
const filteredSchedules = computed(() => {
  try {
    const { schedules } = store
    const { status, building, task, invoice, searchText, startDate, endDate } = store.filters
    
    return schedules.filter(item => {
      if (!item?.id || typeof item.building !== 'string' || typeof item.status !== 'string') return false
      
      const matchStatus = status.length ? status.includes(item.status) : item.status !== '취소됨'
      if (!matchStatus) return false
      
      if (building.length && !building.includes(item.building)) return false
      if (task.length && !item.tasks?.some(t => task.includes(t.name))) return false
      if (invoice && ((invoice === 'O') !== Boolean(item.invoice))) return false
      
      if (searchText) {
        const search = searchText.toLowerCase()
        if (
          !item.room?.toLowerCase().includes(search) &&
          !item.memo?.toLowerCase().includes(search) &&
          !item.building?.toLowerCase().includes(search)
        ) return false
      }
      
      if (startDate && new Date(item.date) < new Date(startDate)) return false
      if (endDate && new Date(item.date) > new Date(endDate)) return false
      
      return true
    })
  } catch (err) {
    console.error('필터링 오류:', err)
    error.value = '데이터 필터링 중 오류가 발생했습니다.'
    return []
  }
})

// 🚀 페이지네이션된 스케줄 데이터
const paginatedScheduleData = computed(() => {
  try {
    const filtered = filteredSchedules.value
    
    const groupMap = new Map()
    for (const item of filtered) {
      if (!groupMap.has(item.date)) {
        groupMap.set(item.date, [])
      }
      groupMap.get(item.date).push(item)
    }
    
    const sortedGroups = Array.from(groupMap.entries())
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([date, items]) => ({ date, items }))
    
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
    }
  } catch (err) {
    console.error('페이지네이션 오류:', err)
    error.value = '데이터 페이지네이션 중 오류가 발생했습니다.'
    return { groupedItems: [], totalItems: 0, currentItems: 0, hasMore: false, remainingCount: 0 }
  }
})

// 🚀 통계 계산
const computedStats = computed(() => {
  const items = filteredSchedules.value
  const statusCounts = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})
  
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
  return !!(status.length || building.length || task.length || invoice || searchText || startDate || endDate)
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
  status: { label: '상태', icon: 'mdi-flag', type: 'status', options: filterOptions.value.statuses, active: (val) => store.filters.status.includes(val) },
  building: { label: '건물', icon: 'mdi-office-building', type: 'building', options: filterOptions.value.buildings, active: (val) => store.filters.building.includes(val) },
  task: { label: '작업 종류', icon: 'mdi-wrench', type: 'task', options: filterOptions.value.taskTypes, active: (val) => store.filters.task.includes(val) },
  invoice: { label: '세금계산서', icon: 'mdi-receipt', type: 'invoice', options: ['O', 'X'], active: (val) => store.filters.invoice === val }
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

const toggleFilters = () => { showFilters.value = !showFilters.value }
const goHome = () => { router.push('/').catch(err => console.error('홈 이동 오류:', err)) }
const clearError = () => { error.value = '' }

// 🚀 필터 처리
const handleFilterToggle = (type, value) => {
  store.toggleFilter(type, value)
  currentPage.value = 1
}

const resetFilters = () => {
  store.resetFilters()
  currentPage.value = 1
}

const applyFilters = useDebounceFn((filters) => {
  store.setFilters(filters)
  currentPage.value = 1
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
    const authResult = await userStore.initializeAuth(router)
    if (!authResult.success) {
      error.value = authResult.error
      return
    }
    await userStore.withRetry(() => store.fetchAllSchedules())
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
watch(() => store.filters, () => { currentPage.value = 1 }, { deep: true })
watch(() => store.error, (newError) => { if (newError) error.value = newError })
</script>

<style scoped>
/* 🎨 헤더 스타일 */
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}
.back-btn, .filter-toggle-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
}
.back-btn:hover, .filter-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  transform: translateY(-1px);
}
.header-icon-wrapper {
  width: 48px; height: 48px; border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(10px);
}
.header-title {
  color: white; font-weight: 700; font-size: 24px; margin: 0;
}
.header-subtitle {
  color: rgba(255, 255, 255, 0.8); font-size: 12px; font-weight: 500;
}

/* 🌀 메인 컨텐츠 및 로딩 */
.main-content {
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}
.schedule-sections {
  display: flex; flex-direction: column; gap: 32px;
}

/* 🚀 스켈레톤 UI */
.skeleton-stats-card {
  height: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 20px;
}
.schedule-skeleton { display: flex; flex-direction: column; gap: 32px; }
.skeleton-section-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.skeleton-section-icon { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skeleton-section-title { width: 150px; height: 28px; border-radius: 8px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skeleton-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
.skeleton-card { background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; }
.skeleton-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
.skeleton-building-info { display: flex; align-items: flex-start; gap: 12px; flex: 1; }
.skeleton-building-icon { width: 28px; height: 28px; border-radius: 6px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; flex-shrink: 0; }
.skeleton-building-text { flex: 1; }
.skeleton-building-name { width: 80px; height: 18px; border-radius: 4px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; margin-bottom: 6px; }
.skeleton-room-number { width: 50px; height: 14px; border-radius: 4px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skeleton-badges { display: flex; gap: 6px; flex-shrink: 0; }
.skeleton-badge { width: 60px; height: 24px; border-radius: 12px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skeleton-card-body { display: flex; flex-direction: column; gap: 12px; }
.skeleton-task-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.skeleton-chip { width: 80px; height: 20px; border-radius: 10px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skeleton-memo { width: 100%; height: 16px; border-radius: 4px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

/* 🚀 더 보기 섹션 */
.load-more-section { margin-top: 40px; padding: 32px; background: white; border-radius: 20px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); text-align: center; }
.progress-info { font-size: 14px; color: #64748b; font-weight: 500; }
.load-more-btn { border-radius: 16px; height: 56px; font-weight: 600; text-transform: none; transition: all 0.3s ease; box-shadow: 0 4px 16px rgba(79, 70, 229, 0.2); }
.load-more-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(79, 70, 229, 0.3); }

/* 🎯 반응형 디자인 */
@media (max-width: 768px) {
  .header-title { font-size: 20px; }
  .schedule-sections { gap: 24px; }
  .load-more-section { margin-top: 32px; padding: 24px; }
  .load-more-btn { height: 48px; }
  .skeleton-cards { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .header-title { font-size: 18px; }
  .header-subtitle { font-size: 11px !important; }
  .schedule-sections { gap: 20px; }
  .load-more-section { margin-top: 24px; padding: 20px; }
  .load-more-btn { height: 44px; font-size: 14px; }
}

/* 🎯 터치 및 접근성 최적화 */
@media (hover: none) and (pointer: coarse) {
  .load-more-btn:hover, .back-btn:hover, .filter-toggle-btn:hover { transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .load-more-btn, .back-btn, .filter-toggle-btn, .skeleton-stats-card, .skeleton-section-icon, .skeleton-section-title, .skeleton-building-icon, .skeleton-building-name, .skeleton-room-number, .skeleton-badge, .skeleton-chip, .skeleton-memo { transition: none; animation: none !important; }
}
*:focus-visible { outline: 3px solid rgba(79, 70, 229, 0.5); outline-offset: 2px; border-radius: 4px; }
</style>
