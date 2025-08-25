<template>
  <v-app>
    <!-- 🎨 일관된 헤더 디자인 -->
    <v-app-bar :elevation="0" class="custom-header" height="80">
      <div class="d-flex align-center justify-space-between w-100 px-4">
        <div class="d-flex align-center">
          <div class="header-icon-wrapper">
            <v-icon size="32">mdi-wrench</v-icon>
          </div>
          <div class="ml-3">
            <h2 class="header-title">공조+</h2>
            <div class="header-subtitle">스마트 작업 관리</div>
          </div>
        </div>

        <div class="d-flex align-center">
          <div v-if="userStore.userId" class="user-info-chip mr-3">
            <v-avatar size="36" class="user-avatar">
              <v-icon color="primary">mdi-account</v-icon>
            </v-avatar>
            <span class="user-name">{{ userStore.userName }}님</span>
          </div>
          <v-btn
            icon
            size="large"
            class="logout-btn"
            @click="handleLogout"
            aria-label="로그아웃"
          >
            <v-icon>mdi-logout</v-icon>
          </v-btn>
        </div>
      </div>
    </v-app-bar>

    <v-main class="main-content">
      <!-- 에러 알림 -->
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

      <v-container
        class="pa-6"
        style="padding-bottom: 280px !important; max-width: 1200px"
      >
        <!-- 날짜 선택 및 메타 정보 카드 -->
        <v-card class="date-meta-card mb-8" elevation="0">
          <!-- 날짜 네비게이션 컴포넌트 -->
          <HomeDateNavigation
            :selected-date="selectedDateObj"
            :is-changing-date="isChangingDate"
            @change-date="changeDateHandler"
          />

          <!-- 메타 정보 컴포넌트 -->
          <HomeMetaInfo
            :schedule-meta="scheduleMeta"
            :is-loading="isLoadingMeta"
            :current-user-name="userStore.userName"
            @edit-meta="goToMetaEdit"
          />
        </v-card>

        <!-- 작업 목록 섹션 -->
        <HomeScheduleSkeleton v-if="isLoadingSchedules" />

        <HomeScheduleList
          v-else
          :schedules="scheduleStore.schedules || []"
          @item-click="handleItemClick"
          @add-schedule="goToAddDate"
        />
      </v-container>

      <!-- 플로팅 액션 버튼 영역 -->
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
import {
  ref,
  onMounted,
  onUnmounted,
  computed,
  watch,
  defineAsyncComponent,
  nextTick,
  shallowRef,
} from 'vue'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'
import { getAuth, signInAnonymously } from 'firebase/auth'

// 비동기 컴포넌트 로딩으로 성능 최적화
const HomeDateNavigation = defineAsyncComponent(
  () => import('@/components/home/HomeDateNavigation.vue')
)
const HomeMetaInfo = defineAsyncComponent(
  () => import('@/components/home/HomeMetaInfo.vue')
)
const HomeScheduleSkeleton = defineAsyncComponent(
  () => import('@/components/home/HomeScheduleSkeleton.vue')
)
const HomeScheduleList = defineAsyncComponent(
  () => import('@/components/home/HomeScheduleList.vue')
)
const FloatingActions = defineAsyncComponent(
  () => import('@/components/FloatingActions.vue')
)

const auth = getAuth()
const router = useRouter()
const scheduleStore = useScheduleStore()
const userStore = useUserStore()

// 상태 관리 - 세분화된 로딩 상태
const isLoadingSchedules = ref(false)
const isLoadingMeta = ref(false)
const isChangingDate = ref(false)
const scheduleMeta = shallowRef(null)
const error = ref(null)

// 오늘 날짜 캐싱 (한 번만 계산)
const TODAY_KST = (() => {
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000
  const kst = new Date(now.getTime() + kstOffset)
  return kst.toISOString().split('T')[0]
})()

const selectedDate = ref(TODAY_KST)

// 선택된 날짜를 Date 객체로 변환
const selectedDateObj = computed(() => new Date(selectedDate.value))

// 에러 처리 함수
const clearError = () => {
  error.value = null
}

const setError = (message, originalError = null) => {
  error.value = message
}

// 날짜 변경 핸들러
const changeDateHandler = async (direction) => {
  if (isChangingDate.value) return

  isChangingDate.value = true
  try {
    const currentDate = new Date(selectedDate.value)
    currentDate.setDate(currentDate.getDate() + direction)
    const newDate = currentDate.toISOString().split('T')[0]

    selectedDate.value = newDate
    await loadData()
  } catch (err) {
    setError('날짜 변경 중 오류가 발생했습니다.', err)
  } finally {
    isChangingDate.value = false
  }
}

// 메타 정보 로딩
const loadMetaData = async (date) => {
  isLoadingMeta.value = true
  try {
    await scheduleStore.fetchSchedulesMetaByDate(date)
    scheduleMeta.value = scheduleStore.schedulesMeta[date]
  } catch (err) {
    setError('메타 정보를 불러오는데 실패했습니다.', err)
  } finally {
    isLoadingMeta.value = false
  }
}

// 스케줄 데이터 로딩
const loadScheduleData = async (date) => {
  isLoadingSchedules.value = true
  try {
    await scheduleStore.fetchSchedulesByDate(date)
  } catch (err) {
    setError('스케줄 데이터를 불러오는데 실패했습니다.', err)
  } finally {
    isLoadingSchedules.value = false
  }
}

// 전체 데이터 로딩
const loadData = async () => {
  const promises = [
    loadMetaData(selectedDate.value),
    loadScheduleData(selectedDate.value),
  ]

  await Promise.allSettled(promises)
}

// 네비게이션 함수들
const goToMetaEdit = () => {
  router.push(`/meta?date=${selectedDate.value}`)
}

const goToAddDate = () => {
  router.push(`/add?date=${selectedDate.value}`)
}

const handleDetailClick = (schedule) => {
  router.push(`/schedule/${schedule.id}?from=home`)
}

// HomeScheduleList에서 전달받은 이벤트 처리
const handleItemClick = (item) => {
  if (item && item.id) {
    router.push(`/schedule/${item.id}?from=home`)
  }
}

const goToAdd = () => {
  router.push('/add')
}

const goToAll = () => {
  router.push('/schedules')
}

const goToEstimateForm = () => {
  router.push('/estimate')
}

const goToStatementForm = () => {
  router.push('/statement')
}

const goToWorker = () => {
  router.push('/worker-schedules')
}

const goToPayroll = () => {
  router.push('/payroll')
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

// 인증 확인 및 초기화
const initializeAuth = async () => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth)
    }

    if (!userStore.userId) {
      const restored = userStore.restoreUserFromLocalStorage()
      if (!restored) {
        router.push('/login')
        return
      }
    }

    await loadData()
  } catch (err) {
    setError('인증 초기화에 실패했습니다.', err)
    setTimeout(() => router.push('/login'), 3000)
  }
}

// 날짜 변경 감시
watch(selectedDate, (newDate) => {
  if (newDate) {
    loadData()
  }
})

// 컴포넌트 생명주기
onMounted(() => {
  initializeAuth()
})

onUnmounted(() => {
  // 정리 작업
  clearError()
})
</script>

<style scoped>
.main-content {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding-top: 80px;
}

.date-meta-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
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

.user-info-chip {
  background: rgba(100, 116, 139, 0.1) !important;
  border-radius: 20px !important;
  padding: 4px 12px 4px 4px !important;
  display: flex !important;
  align-items: center !important;
  backdrop-filter: blur(10px) !important;
  gap: 8px !important;
}

.user-avatar {
  flex-shrink: 0;
}

.user-name {
  font-weight: 500 !important;
  font-size: 14px !important;
  color: #64748b !important;
  white-space: nowrap;
}

.logout-btn {
  background: rgba(100, 116, 139, 0.1) !important;
  color: #64748b !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
}

.logout-btn:hover,
.logout-btn:focus {
  background: rgba(100, 116, 139, 0.2) !important;
  transform: translateY(-1px);
}

/* 📱 반응형 디자인 */
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
</style>
