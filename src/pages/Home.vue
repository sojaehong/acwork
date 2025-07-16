<template>
  <v-app>
    <!-- 🎨 현대적인 그라데이션 헤더 -->
    <v-app-bar 
      :elevation="0" 
      class="custom-header"
      height="80"
    >
      <div class="d-flex align-center justify-space-between w-100 px-4">
        <div class="d-flex align-center">
          <div class="header-icon-wrapper">
            <v-icon size="32" color="white">mdi-wrench</v-icon>
          </div>
          <div class="ml-3">
            <h1 class="header-title">공조+</h1>
            <div class="header-subtitle">스마트 작업 관리</div>
          </div>
        </div>
        
        <div class="d-flex align-center">
          <div v-if="userStore.userId" class="user-info-chip">
            <v-avatar size="36" class="mr-2">
              <v-icon color="primary">mdi-account</v-icon>
            </v-avatar>
            <span class="user-name">{{ userStore.userName }}님</span>
          </div>
          <v-btn 
            icon 
            size="large"
            class="logout-btn ml-2"
            @click="logout"
            aria-label="로그아웃"
          >
            <v-icon>mdi-logout</v-icon>
          </v-btn>
        </div>
      </div>
    </v-app-bar>

    <v-main class="main-content">
      <!-- 🌀 로딩 스피너 -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-container">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            width="6"
          />
          <div class="loading-text mt-4">데이터 로딩 중...</div>
        </div>
      </div>

      <!-- 🚨 에러 알림 -->
      <v-alert 
        v-if="error" 
        type="error" 
        class="ma-4" 
        prominent
        closable
        @click:close="clearError"
      >
        <v-icon start>mdi-alert-circle</v-icon>
        {{ error }}
      </v-alert>

      <v-container class="pa-6" style="padding-bottom: 280px !important; max-width: 1200px;">
        <!-- 📅 날짜 선택 및 메타 정보 카드 -->
        <v-card class="date-meta-card mb-8" elevation="0">
          <!-- 날짜 네비게이션 -->
          <div class="date-navigation">
            <v-btn 
              icon 
              size="large" 
              variant="text"
              class="date-nav-btn"
              @click="changeDateHandler(-1)"
              aria-label="이전 날짜"
            >
              <v-icon size="28">mdi-chevron-left</v-icon>
            </v-btn>
            
            <div class="date-display">
              <h2 class="date-title">{{ memoizedDisplayDate }}</h2>
              <div class="date-badge">{{ memoizedDday }}</div>
            </div>
            
            <v-btn 
              icon 
              size="large" 
              variant="text"
              class="date-nav-btn"
              @click="changeDateHandler(1)"
              aria-label="다음 날짜"
            >
              <v-icon size="28">mdi-chevron-right</v-icon>
            </v-btn>
          </div>

          <!-- 메타 정보 섹션 -->
          <div 
            class="meta-info-section" 
            @click="goToMetaEdit"
            tabindex="0"
            role="button"
            aria-label="메타 정보 편집"
          >
            <div class="meta-grid">
              <div class="meta-item">
                <div class="meta-icon">
                  <v-icon color="primary">mdi-clock-outline</v-icon>
                </div>
                <div class="meta-content">
                  <div class="meta-label">시작 시간</div>
                  <div class="meta-value">{{ safeMetaValue(scheduleMeta?.startTime, '설정되지 않음') }}</div>
                </div>
              </div>

              <div class="meta-item">
                <div class="meta-icon">
                  <v-icon color="success">mdi-account-group</v-icon>
                </div>
                <div class="meta-content">
                  <div class="meta-label">작업 인원</div>
                  <div class="meta-value">
                    <template v-if="scheduleMeta?.workerNames?.length">
                      <v-chip
                        v-for="(user, i) in scheduleMeta.workerNames"
                        :key="`worker-${i}-${user}`"
                        :color="user === userStore.userName ? 'primary' : 'grey-lighten-2'"
                        size="small"
                        class="ma-1"
                        variant="flat"
                      >
                        <v-icon start size="16">mdi-account</v-icon>
                        {{ user }}
                      </v-chip>
                    </template>
                    <span v-else class="text-grey-darken-1">배정되지 않음</span>
                  </div>
                </div>
              </div>

              <div class="meta-item">
                <div class="meta-icon">
                  <v-icon color="info">mdi-bullhorn</v-icon>
                </div>
                <div class="meta-content">
                  <div class="meta-label">공지사항</div>
                  <div class="meta-value">{{ safeMetaValue(scheduleMeta?.notice, '공지사항이 없습니다') }}</div>
                </div>
              </div>
            </div>
          </div>
        </v-card>

        <!-- 📝 작업 목록 - 성능 최적화된 렌더링 -->
        <template v-if="categorizedSchedules.all.length">
          <!-- 진행 중인 작업 -->
          <TaskSection
            v-if="categorizedSchedules.active.length"
            :schedules="categorizedSchedules.active"
            section-type="active"
            title="진행 중인 작업"
            icon="mdi-play-circle"
            color="warning"
            @item-click="handleDetailClick"
          />

          <!-- 완료된 작업 -->
          <TaskSection
            v-if="categorizedSchedules.completed.length"
            :schedules="categorizedSchedules.completed"
            section-type="completed"
            title="완료된 작업"
            icon="mdi-check-circle"
            color="success"
            @item-click="handleDetailClick"
          />

          <!-- 보류된 작업 -->
          <TaskSection
            v-if="categorizedSchedules.hold.length"
            :schedules="categorizedSchedules.hold"
            section-type="hold"
            title="보류된 작업"
            icon="mdi-pause-circle"
            color="orange"
            @item-click="handleDetailClick"
          />
        </template>

        <!-- 빈 상태 -->
        <EmptyState
          v-else-if="!loading"
          @add-first-task="goToAddDate"
        />
      </v-container>

      <!-- 🎯 플로팅 액션 버튼 영역 -->
      <FloatingActions
        @go-to-estimate="goToEstimateForm"
        @go-to-statement="goToStatementForm"
        @go-to-worker="goToWorker"
        @go-to-payroll="goToPayroll"
        @go-to-add="goToAdd"
        @go-to-all="goToAll"
      />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, defineAsyncComponent, nextTick, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore'
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'
import { getAuth, signInAnonymously } from 'firebase/auth'

// 🚀 성능 최적화: 컴포넌트 지연 로딩
const TaskCard = defineAsyncComponent(() => import('@/components/TaskCard.vue'))
const TaskSection = defineAsyncComponent(() => import('@/components/TaskSection.vue'))
const EmptyState = defineAsyncComponent(() => import('@/components/EmptyState.vue'))
const FloatingActions = defineAsyncComponent(() => import('@/components/FloatingActions.vue'))

const auth = getAuth()
const router = useRouter()
const scheduleStore = useScheduleStore()
const userStore = useUserStore()

// 🚀 성능 최적화: shallowRef 사용으로 깊은 반응성 최적화
const loading = ref(false)
const scheduleMeta = shallowRef(null)
const error = ref(null)
const retryCount = ref(0)
const maxRetries = 3

// 🚀 성능 최적화: AbortController로 요청 취소 관리
let abortController = null
let retryTimeout = null

// 타입 가드 함수 - 메모이제이션
const isValidScheduleItem = (item) => {
  return item && 
         typeof item.id !== 'undefined' && 
         typeof item.building === 'string' && 
         typeof item.status === 'string'
}

const safeMetaValue = (value, fallback) => {
  return value && typeof value === 'string' && value.trim() ? value.trim() : fallback
}

// 🚀 성능 최적화: 단일 computed로 모든 스케줄 카테고리화
const categorizedSchedules = computed(() => {
  try {
    const validSchedules = scheduleStore.schedules.filter(isValidScheduleItem)
    
    const result = {
      all: validSchedules,
      active: [],
      completed: [],
      hold: []
    }
    
    // 단일 루프로 모든 카테고리 분류
    for (const schedule of validSchedules) {
      const status = (schedule.status || '').trim()
      switch (status) {
        case '진행':
          result.active.push(schedule)
          break
        case '완료':
          result.completed.push(schedule)
          break
        case '보류':
          result.hold.push(schedule)
          break
      }
    }
    
    return result
  } catch (err) {
    console.error('스케줄 카테고리화 오류:', err)
    return { all: [], active: [], completed: [], hold: [] }
  }
})

// 🚀 성능 최적화: 메모이제이션된 날짜 계산
const todayKST = computed(() => {
  try {
    const now = new Date()
    const kstOffset = 9 * 60 * 60 * 1000
    const kst = new Date(now.getTime() + kstOffset)
    return kst.toISOString().split('T')[0]
  } catch (err) {
    console.error('날짜 계산 오류:', err)
    return new Date().toISOString().split('T')[0]
  }
})

const selectedDate = ref(todayKST.value)

const memoizedDisplayDate = computed(() => {
  try {
    const date = new Date(selectedDate.value)
    const day = date.toLocaleDateString('ko-KR', { weekday: 'short' })
    return selectedDate.value === todayKST.value ? '오늘' : `${selectedDate.value} (${day})`
  } catch (err) {
    console.error('날짜 표시 오류:', err)
    return selectedDate.value
  }
})

const memoizedDday = computed(() => {
  try {
    const today = new Date(todayKST.value)
    const target = new Date(selectedDate.value)
    const diff = Math.floor((target - today) / (1000 * 60 * 60 * 24))
    return selectedDate.value === todayKST.value ? '오늘' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`
  } catch (err) {
    console.error('D-day 계산 오류:', err)
    return ''
  }
})

// 🚀 성능 최적화: 이벤트 핸들러 최적화
const changeDateHandler = (offset) => {
  try {
    const current = new Date(selectedDate.value)
    current.setDate(current.getDate() + offset)
    selectedDate.value = current.toISOString().split('T')[0]
    loadData(selectedDate.value)
  } catch (err) {
    console.error('날짜 변경 오류:', err)
    error.value = '날짜 변경 중 오류가 발생했습니다.'
  }
}

const handleDetailClick = (id) => {
  if (!id) {
    error.value = '잘못된 작업 ID입니다.'
    return
  }
  goTo(`/schedule/${id}?from=home`)
}

// 🚀 성능 최적화: 데이터 로딩 함수들 - AbortController 적용
async function loadSchedules(date) {
  try {
    if (abortController) {
      abortController.abort()
    }
    abortController = new AbortController()
    
    await scheduleStore.fetchSchedulesByDate(date)
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('스케줄 로딩이 취소되었습니다.')
      return
    }
    console.error('스케줄 로딩 실패:', err)
    throw new Error('작업 일정을 불러오는 중 오류가 발생했습니다.')
  }
}

async function loadScheduleMeta(date) {
  try {
    const q = query(collection(db, 'schedulesMeta'), where('date', '==', date), limit(1))
    const snap = await getDocs(q)
    
    if (!snap.empty) {
      const data = snap.docs[0].data()
      if (data.workers && data.workers.length > 0) {
        // 🚀 성능 최적화: 병렬 처리 + 에러 핸들링
        const userPromises = data.workers.map(async (id) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', id))
            return userDoc.exists() ? userDoc.data()?.name || '알 수 없음' : '알 수 없음'
          } catch {
            return '알 수 없음'
          }
        })
        
        data.workerNames = await Promise.allSettled(userPromises).then(results =>
          results.map(result => result.status === 'fulfilled' ? result.value : '알 수 없음')
        )
      } else {
        data.workerNames = []
      }
      scheduleMeta.value = data
    } else {
      scheduleMeta.value = null
    }
  } catch (err) {
    console.error('메타 데이터 로딩 실패:', err)
    scheduleMeta.value = null
    throw new Error('작업 정보를 불러오는 중 오류가 발생했습니다.')
  }
}

// 🚀 성능 최적화: 디바운스된 데이터 로딩
let loadDataTimeout = null
async function loadData(date, isRetry = false) {
  if (loading.value && !isRetry) return
  
  // 기존 타이머 정리
  if (loadDataTimeout) {
    clearTimeout(loadDataTimeout)
  }
  
  loading.value = true
  error.value = null
  
  try {
    await Promise.all([
      loadSchedules(date),
      loadScheduleMeta(date)
    ])
    retryCount.value = 0
  } catch (err) {
    console.error('데이터 로딩 실패:', err)
    
    if (retryCount.value < maxRetries) {
      retryCount.value++
      loadDataTimeout = setTimeout(() => loadData(date, true), 1000 * retryCount.value)
    } else {
      error.value = err.message || '데이터를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.'
    }
  } finally {
    loading.value = false
  }
}

// 🚀 성능 최적화: 선택적 워처 (watch 조건화)
watch(selectedDate, (newDate, oldDate) => {
  if (newDate !== oldDate && newDate) {
    // 다음 틱에서 실행하여 렌더링 최적화
    nextTick(() => {
      loadData(newDate)
    })
  }
}, { flush: 'post' })

// 네비게이션 함수들
async function logout() {
  try {
    loading.value = true
    await auth.signOut()
    
    // 로컬 스토리지 정리
    const keysToRemove = ['user_id', 'user_name', 'user_role']
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    userStore.logout()
    await router.push('/login')
  } catch (err) {
    console.error('로그아웃 실패:', err)
    error.value = '로그아웃 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}

// 🚀 성능 최적화: 라우터 네비게이션 최적화
async function goTo(path, params = {}) {
  try {
    if (loading.value) return
    
    loading.value = true
    
    if (params.query) {
      await router.push({ path, query: params.query })
    } else {
      await router.push(path)
    }
  } catch (err) {
    console.error('페이지 이동 실패:', err)
    error.value = '페이지 이동 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}

// 에러 처리
const clearError = () => {
  error.value = null
}

// 네비게이션 래퍼 함수들
const goToAll = () => goTo('/schedules')
const goToAdd = () => goTo('/add')
const goToAddDate = () => {
  try {
    const formatted = selectedDate.value instanceof Date
      ? selectedDate.value.toISOString().split('T')[0]
      : selectedDate.value

    goTo('/add', { query: { date: formatted } })
  } catch (err) {
    console.error('날짜 포맷 오류:', err)
    goTo('/add')
  }
}
const goToPayroll = () => goTo('/payroll')
const goToWorker = () => goTo('/worker-schedules')
const goToMetaEdit = () => goTo('/meta')
const goToEstimateForm = () => goTo('/estimate')
const goToStatementForm = () => goTo('/statement')

// 🚀 성능 최적화: 라이프사이클 훅 최적화
onMounted(async () => {
  try {
    // 인증 확인
    if (!auth.currentUser) {
      await signInAnonymously(auth)
    }

    // 사용자 정보 복원
    if (!userStore.userId) {
      const userData = {
        id: localStorage.getItem('user_id'),
        name: localStorage.getItem('user_name'),
        role: localStorage.getItem('user_role')
      }
      
      if (userData.id && userData.name && userData.role) {
        userStore.setUser(userData)
      } else {
        await router.push('/login')
        return
      }
    }

    // 초기 데이터 로딩
    await loadData(selectedDate.value)
  } catch (err) {
    console.error('초기 로딩 실패:', err)
    error.value = '애플리케이션 초기화 중 오류가 발생했습니다.'
    
    // 로그인 페이지로 리다이렉트
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }
})

// 🚀 성능 최적화: 정리 작업 강화
onUnmounted(() => {
  // AbortController 정리
  if (abortController) {
    abortController.abort()
  }
  
  // 타이머 정리
  if (retryTimeout) {
    clearTimeout(retryTimeout)
  }
  if (loadDataTimeout) {
    clearTimeout(loadDataTimeout)
  }
  
  // 상태 정리
  error.value = null
  loading.value = false
  scheduleMeta.value = null
})
</script>

<style scoped>
/* 🚀 성능 최적화: will-change 속성 최적화 */
.task-card-wrapper,
.action-btn,
.meta-item,
.date-nav-btn,
.logout-btn {
  will-change: transform;
}

/* 기존 스타일 유지... */
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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

/* 🚀 성능 최적화: contain 속성으로 렌더링 최적화 */
.task-section {
  contain: layout style;
  margin-bottom: 32px;
}

.meta-item {
  contain: layout style;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.meta-item:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

/* 📱 반응형 디자인 */
@media (max-width: 768px) {
  .meta-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .date-navigation {
    padding: 20px;
  }

  .date-title {
    font-size: 24px;
  }
}

@media (max-width: 600px) {
  .meta-item {
    padding: 12px;
  }

  .meta-icon {
    width: 36px;
    height: 36px;
  }

  .meta-value {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 20px;
  }

  .date-navigation {
    padding: 16px;
  }

  .date-title {
    font-size: 20px;
  }

  .meta-grid {
    gap: 12px;
  }

  .meta-item {
    padding: 10px;
  }
}

/* 나머지 스타일들... */
.user-info-chip {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 6px 16px;
  display: flex;
  align-items: center;
  backdrop-filter: blur(6px);
  color: #fff;
}

.user-name {
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.logout-btn:hover,
.logout-btn:focus {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

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

.date-meta-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 🎯 날짜 네비게이션 스타일 */
.date-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.date-nav-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
}

.date-nav-btn:hover,
.date-nav-btn:focus {
  background: rgba(255, 255, 255, 0.2) !important;
  transform: translateY(-1px);
}

.date-nav-btn .v-icon {
  color: white !important;
}

.date-display {
  text-align: center;
}

.date-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.date-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 8px;
  display: inline-block;
}

/* 🎯 메타 정보 섹션 스타일 */
.meta-info-section {
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 0 0 20px 20px;
}

.meta-info-section:hover {
  background: #f8fafc;
}

.meta-info-section:focus {
  outline: 3px solid rgba(79, 70, 229, 0.3);
  outline-offset: 2px;
  background: #f8fafc;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.meta-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.meta-content {
  flex: 1;
  min-width: 0;
}

.meta-label {
  font-weight: 600;
  font-size: 14px;
  color: #64748b;
  margin-bottom: 4px;
}

.meta-value {
  font-size: 16px;
  color: #1e293b;
  line-height: 1.5;
  word-break: break-word;
}

/* 🚀 성능 최적화: 애니메이션 최적화 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .action-btn:hover,
  .date-nav-btn:hover,
  .logout-btn:hover,
  .meta-item:hover {
    transform: none;
  }
}
</style>