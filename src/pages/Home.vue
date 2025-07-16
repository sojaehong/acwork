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
      <!-- 🚨 에러 알림 (로딩과 독립적으로 표시) -->
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
        <!-- 📅 날짜 선택 및 메타 정보 카드 - 즉시 렌더링 -->
        <v-card class="date-meta-card mb-8" elevation="0">
          <!-- 날짜 네비게이션 -->
          <div class="date-navigation">
            <v-btn 
              icon 
              size="large" 
              variant="text"
              class="date-nav-btn"
              @click="changeDateHandler(-1)"
              :disabled="isChangingDate"
              aria-label="이전 날짜"
            >
              <v-icon size="28">mdi-chevron-left</v-icon>
            </v-btn>
            
            <div class="date-display">
              <h2 class="date-title">{{ displayDate }}</h2>
              <div class="date-badge">{{ ddayText }}</div>
            </div>
            
            <v-btn 
              icon 
              size="large" 
              variant="text"
              class="date-nav-btn"
              @click="changeDateHandler(1)"
              :disabled="isChangingDate"
              aria-label="다음 날짜"
            >
              <v-icon size="28">mdi-chevron-right</v-icon>
            </v-btn>
          </div>

          <!-- 메타 정보 섹션 - 로딩 중에도 스켈레톤 표시 -->
          <div 
            class="meta-info-section" 
            @click="goToMetaEdit"
            tabindex="0"
            role="button"
            aria-label="메타 정보 편집"
          >
            <!-- 🌀 메타 정보 로딩 중일 때 스켈레톤 -->
            <div v-if="isLoadingMeta" class="meta-skeleton">
              <div class="meta-grid">
                <div v-for="i in 3" :key="i" class="skeleton-item">
                  <div class="skeleton-icon"></div>
                  <div class="skeleton-content">
                    <div class="skeleton-label"></div>
                    <div class="skeleton-value"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 실제 메타 정보 -->
            <div v-else class="meta-grid">
              <div class="meta-item">
                <div class="meta-icon">
                  <v-icon color="primary">mdi-clock-outline</v-icon>
                </div>
                <div class="meta-content">
                  <div class="meta-label">시작 시간</div>
                  <div class="meta-value">{{ scheduleMeta?.startTime || '설정되지 않음' }}</div>
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
                  <div class="meta-value">{{ scheduleMeta?.notice || '공지사항이 없습니다' }}</div>
                </div>
              </div>
            </div>
          </div>
        </v-card>

        <!-- 📝 작업 목록 - 스켈레톤 로딩과 실제 컨텐츠 분리 -->
        <!-- 🌀 스케줄 로딩 중일 때 스켈레톤 -->
        <div v-if="isLoadingSchedules" class="schedule-skeleton">
          <div v-for="i in 3" :key="i" class="skeleton-section">
            <div class="skeleton-section-header">
              <div class="skeleton-section-icon"></div>
              <div class="skeleton-section-title"></div>
              <div class="skeleton-section-count"></div>
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

        <!-- 실제 작업 목록 -->
        <template v-else-if="categorizedSchedules.all.length">
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
          v-else-if="!isLoadingSchedules"
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

// 🚀 최적화: 컴포넌트 지연 로딩 - 우선순위별 로딩
const TaskSection = defineAsyncComponent(() => import('@/components/TaskSection.vue'))
const EmptyState = defineAsyncComponent(() => import('@/components/EmptyState.vue'))
const FloatingActions = defineAsyncComponent(() => import('@/components/FloatingActions.vue'))

const auth = getAuth()
const router = useRouter()
const scheduleStore = useScheduleStore()
const userStore = useUserStore()

// 🚀 최적화: 상태 분리 - 로딩 상태를 세분화
const isLoadingSchedules = ref(false)
const isLoadingMeta = ref(false)
const isChangingDate = ref(false)
const scheduleMeta = shallowRef(null)
const error = ref(null)

// 🚀 최적화: 오늘 날짜 캐싱 (한 번만 계산)
const TODAY_KST = (() => {
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000
  const kst = new Date(now.getTime() + kstOffset)
  return kst.toISOString().split('T')[0]
})()

const selectedDate = ref(TODAY_KST)

// 🚀 최적화: 간단한 computed로 변경 (불필요한 try-catch 제거)
const displayDate = computed(() => {
  if (selectedDate.value === TODAY_KST) return '오늘'
  const date = new Date(selectedDate.value)
  const day = date.toLocaleDateString('ko-KR', { weekday: 'short' })
  return `${selectedDate.value} (${day})`
})

const ddayText = computed(() => {
  if (selectedDate.value === TODAY_KST) return '오늘'
  const today = new Date(TODAY_KST)
  const target = new Date(selectedDate.value)
  const diff = Math.floor((target - today) / (1000 * 60 * 60 * 24))
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`
})

// 🚀 최적화: 스케줄 카테고리화 - 메모이제이션 강화
const categorizedSchedules = computed(() => {
  const schedules = scheduleStore.schedules
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return { all: [], active: [], completed: [], hold: [] }
  }
  
  const result = { all: [], active: [], completed: [], hold: [] }
  
  for (const schedule of schedules) {
    if (!schedule?.id || !schedule.building || !schedule.status) continue
    
    result.all.push(schedule)
    
    switch (schedule.status) {
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
})

// 🚀 최적화: 날짜 변경 핸들러 - 디바운스 적용
let dateChangeTimeout = null
const changeDateHandler = (offset) => {
  if (isChangingDate.value) return
  
  clearTimeout(dateChangeTimeout)
  isChangingDate.value = true
  
  const current = new Date(selectedDate.value)
  current.setDate(current.getDate() + offset)
  selectedDate.value = current.toISOString().split('T')[0]
  
  // 200ms 디바운스
  dateChangeTimeout = setTimeout(() => {
    isChangingDate.value = false
  }, 200)
}

// 🚀 최적화: 병렬 로딩을 순차 로딩으로 변경 (우선순위 기반)
async function loadSchedules(date) {
  if (isLoadingSchedules.value) return
  
  isLoadingSchedules.value = true
  try {
    await scheduleStore.fetchSchedulesByDate(date)
  } catch (err) {
    console.error('스케줄 로딩 실패:', err)
    throw new Error('작업 일정을 불러오는 중 오류가 발생했습니다.')
  } finally {
    isLoadingSchedules.value = false
  }
}

async function loadScheduleMeta(date) {
  if (isLoadingMeta.value) return
  
  isLoadingMeta.value = true
  try {
    const q = query(collection(db, 'schedulesMeta'), where('date', '==', date), limit(1))
    const snap = await getDocs(q)
    
    if (!snap.empty) {
      const data = snap.docs[0].data()
      
      // 🚀 최적화: 워커 정보 로딩 최적화
      if (data.workers?.length) {
        const workerPromises = data.workers.map(async (id) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', id))
            return userDoc.exists() ? (userDoc.data()?.name || '알 수 없음') : '알 수 없음'
          } catch {
            return '알 수 없음'
          }
        })
        
        data.workerNames = await Promise.all(workerPromises)
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
  } finally {
    isLoadingMeta.value = false
  }
}

// 🚀 최적화: 순차 로딩 - 스케줄 먼저, 메타는 나중에
async function loadData(date) {
  error.value = null
  
  try {
    // 1. 스케줄 데이터 먼저 로딩 (사용자가 가장 중요하게 생각하는 데이터)
    await loadSchedules(date)
    
    // 2. 메타 데이터는 백그라운드에서 로딩
    nextTick(() => {
      loadScheduleMeta(date).catch(err => {
        console.error('메타 데이터 로딩 실패:', err)
      })
    })
    
  } catch (err) {
    console.error('데이터 로딩 실패:', err)
    error.value = err.message || '데이터를 불러오는 중 오류가 발생했습니다.'
  }
}

// 🚀 최적화: watch 최적화 - flush: 'post' 제거
watch(selectedDate, (newDate) => {
  if (newDate) {
    loadData(newDate)
  }
})

// 이벤트 핸들러들
const handleDetailClick = (id) => {
  if (!id) {
    error.value = '잘못된 작업 ID입니다.'
    return
  }
  router.push(`/schedule/${id}?from=home`).catch(err => {
    console.error('라우팅 오류:', err)
    error.value = '페이지 이동 중 오류가 발생했습니다.'
  })
}

async function logout() {
  try {
    await auth.signOut()
    localStorage.clear()
    userStore.logout()
    await router.push('/login')
  } catch (err) {
    console.error('로그아웃 실패:', err)
    error.value = '로그아웃 중 오류가 발생했습니다.'
  }
}

const clearError = () => {
  error.value = null
}

// 🚀 최적화: 간단한 네비게이션 함수들
const goTo = (path, query = null) => {
  const route = query ? { path, query } : path
  router.push(route).catch(err => {
    console.error('페이지 이동 실패:', err)
    error.value = '페이지 이동 중 오류가 발생했습니다.'
  })
}

const goToAll = () => goTo('/schedules')
const goToAdd = () => goTo('/add')
const goToAddDate = () => goTo('/add', { date: selectedDate.value })
const goToPayroll = () => goTo('/payroll')
const goToWorker = () => goTo('/worker-schedules')
const goToMetaEdit = () => goTo('/meta')
const goToEstimateForm = () => goTo('/estimate')
const goToStatementForm = () => goTo('/statement')

// 🚀 최적화: 마운트 시 초기화 최적화
onMounted(async () => {
  try {
    // 1. 인증 확인 (빠른 체크)
    if (!auth.currentUser) {
      await signInAnonymously(auth)
    }

    // 2. 사용자 정보 복원 (로컬 스토리지에서)
    if (!userStore.userId) {
      const storedData = {
        id: localStorage.getItem('user_id'),
        name: localStorage.getItem('user_name'),
        role: localStorage.getItem('user_role')
      }
      
      if (storedData.id && storedData.name && storedData.role) {
        userStore.setUser(storedData)
      } else {
        await router.push('/login')
        return
      }
    }

    // 3. 데이터 로딩 시작
    await loadData(selectedDate.value)
    
  } catch (err) {
    console.error('초기 로딩 실패:', err)
    error.value = '애플리케이션 초기화 중 오류가 발생했습니다.'
    
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }
})

// 🚀 최적화: 정리 작업
onUnmounted(() => {
  if (dateChangeTimeout) {
    clearTimeout(dateChangeTimeout)
  }
})
</script>

<style scoped>
/* 🚀 성능 최적화: 스켈레톤 스타일 */
.schedule-skeleton {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.skeleton-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.skeleton-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-section-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-section-title {
  width: 120px;
  height: 24px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-section-count {
  width: 40px;
  height: 20px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-left: auto;
}

.skeleton-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.skeleton-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.skeleton-building-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.skeleton-building-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-building-text {
  flex: 1;
}

.skeleton-building-name {
  width: 80px;
  height: 18px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 6px;
}

.skeleton-room-number {
  width: 50px;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.skeleton-badge {
  width: 60px;
  height: 24px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-task-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.skeleton-chip {
  width: 80px;
  height: 20px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-memo {
  width: 100%;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* 메타 정보 스켈레톤 */
.meta-skeleton {
  padding: 0;
}

.skeleton-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.skeleton-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
}

.skeleton-label {
  width: 80px;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 8px;
}

.skeleton-value {
  width: 120px;
  height: 16px;
  border-radius: 4px;
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

/* 기존 스타일들 */
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

.date-nav-btn:disabled {
  background: rgba(255, 255, 255, 0.05) !important;
  opacity: 0.5;
  transform: none !important;
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

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.3s ease;
  contain: layout style;
}

.meta-item:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
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

  .skeleton-section {
    padding: 20px;
  }

  .skeleton-cards {
    gap: 10px;
  }

  .skeleton-card {
    padding: 16px;
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

  .skeleton-section {
    padding: 16px;
  }

  .skeleton-card {
    padding: 14px;
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

  .skeleton-section {
    padding: 12px;
  }

  .skeleton-card {
    padding: 12px;
  }

  .skeleton-building-icon {
    width: 24px;
    height: 24px;
  }

  .skeleton-section-icon {
    width: 36px;
    height: 36px;
  }
}

/* 🚀 성능 최적화 */
.will-change-transform {
  will-change: transform;
}

.contain-layout {
  contain: layout style;
}

/* 애니메이션 줄임 설정 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .shimmer {
    animation: none !important;
  }
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .date-nav-btn:hover,
  .logout-btn:hover,
  .meta-item:hover {
    transform: none;
  }
}

/* 🎯 다크 모드 대응 (선택사항) */
@media (prefers-color-scheme: dark) {
  .meta-item {
    background: #1e293b;
    color: #e2e8f0;
  }

  .meta-item:hover {
    background: #334155;
  }

  .meta-icon {
    background: #475569;
  }

  .meta-label {
    color: #94a3b8;
  }

  .meta-value {
    color: #e2e8f0;
  }

  .skeleton-section,
  .skeleton-card {
    background: #1e293b;
  }

  .skeleton-item {
    background: #334155;
  }
}

</style>