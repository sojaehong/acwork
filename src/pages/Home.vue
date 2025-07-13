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
            <h2 class="header-title">공조+</h2>
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
              @click.stop="changeDate(-1)"
            >
              <v-icon size="28">mdi-chevron-left</v-icon>
            </v-btn>
            
            <div class="date-display">
              <h2 class="date-title">{{ displayDate }}</h2>
              <div class="date-badge">{{ displayDday }}</div>
            </div>
            
            <v-btn 
              icon 
              size="large" 
              variant="text"
              class="date-nav-btn"
              @click.stop="changeDate(1)"
            >
              <v-icon size="28">mdi-chevron-right</v-icon>
            </v-btn>
          </div>

          <!-- 메타 정보 섹션 -->
          <div class="meta-info-section" @click="goToMetaEdit">
            <div class="meta-grid">
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
                        :key="user + i"
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

        <!-- 📝 작업 목록 -->
        <template v-if="scheduleStore.schedules.length">
          <!-- 진행 중인 작업 -->
          <div v-if="activeSchedules.length" class="task-section">
            <div class="section-header">
              <div class="section-icon active">
                <v-icon color="white">mdi-play-circle</v-icon>
              </div>
              <h3 class="section-title">진행 중인 작업</h3>
              <v-chip color="warning" size="small" class="ml-2">
                {{ activeSchedules.length }}개
              </v-chip>
            </div>
            <transition-group name="task-fade" tag="div" appear>
              <TaskCard
                v-for="item in activeSchedules"
                :key="item.id"
                :item="item"
                @click="goToDetail(item.id)"
                class="task-card-wrapper"
              />
            </transition-group>
          </div>

          <!-- 완료된 작업 -->
          <div v-if="completedDoneSchedules.length" class="task-section">
            <div class="section-header">
              <div class="section-icon completed">
                <v-icon color="white">mdi-check-circle</v-icon>
              </div>
              <h3 class="section-title">완료된 작업</h3>
              <v-chip color="success" size="small" class="ml-2">
                {{ completedDoneSchedules.length }}개
              </v-chip>
            </div>
            <transition-group name="task-fade" tag="div" appear>
              <TaskCard
                v-for="item in completedDoneSchedules"
                :key="item.id"
                :item="item"
                @click="goToDetail(item.id)"
                class="task-card-wrapper"
              />
            </transition-group>
          </div>

          <!-- 보류된 작업 -->
          <div v-if="completedHoldSchedules.length" class="task-section">
            <div class="section-header">
              <div class="section-icon hold">
                <v-icon color="white">mdi-pause-circle</v-icon>
              </div>
              <h3 class="section-title">보류된 작업</h3>
              <v-chip color="orange" size="small" class="ml-2">
                {{ completedHoldSchedules.length }}개
              </v-chip>
            </div>
            <transition-group name="task-fade" tag="div" appear>
              <TaskCard
                v-for="item in completedHoldSchedules"
                :key="item.id"
                :item="item"
                @click="goToDetail(item.id)"
                class="task-card-wrapper"
              />
            </transition-group>
          </div>
        </template>

        <!-- 빈 상태 -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <v-icon size="80" color="grey-lighten-2">mdi-clipboard-text-off</v-icon>
          </div>
          <h3 class="empty-title">등록된 작업이 없습니다</h3>
          <p class="empty-description">새 작업을 등록하여 시작해보세요!</p>
          <v-btn color="primary" size="large" @click="goToAddDate" class="mt-4">
            <v-icon start>mdi-plus</v-icon>
            첫 작업 등록하기
          </v-btn>
        </div>
      </v-container>

      <!-- 🎯 플로팅 액션 버튼 영역 -->
      <div class="floating-actions">
        <!-- 문서 관련 버튼 -->
        <div class="action-group">
          <div class="action-group-label">문서 관리</div>
          <div class="action-buttons">
            <v-btn 
              class="action-btn document-btn"
              @click="goToEstimateForm"
            >
              <v-icon start>mdi-file-document-outline</v-icon>
              견적서
            </v-btn>
            <v-btn 
              class="action-btn document-btn"
              @click="goToStatementForm"
            >
              <v-icon start>mdi-receipt</v-icon>
              거래명세서
            </v-btn>
          </div>
        </div>

        <!-- 주요 기능 버튼 -->
        <div class="action-group">
          <div class="action-group-label">주요 기능</div>
          <div class="action-buttons">
            <v-btn 
              class="action-btn feature-btn"
              color="info"
              @click="goToWorker"
            >
              <v-icon start>mdi-account-hard-hat</v-icon>
              작업자별
            </v-btn>
            <v-btn 
              class="action-btn feature-btn"
              color="success"
              @click="goToPayroll"
            >
              <v-icon start>mdi-calculator</v-icon>
              정산
            </v-btn>
            <v-btn 
              class="action-btn feature-btn primary-btn"
              color="primary"
              @click="goToAdd"
            >
              <v-icon start>mdi-plus-circle</v-icon>
              작업등록
            </v-btn>
          </div>
        </div>

        <!-- 전체 보기 버튼 -->
        <v-btn 
          class="view-all-btn"
          block
          size="large"
          variant="outlined"
          @click="goToAll"
        >
          <v-icon start>mdi-calendar-month</v-icon>
          전체 작업 일정 보기
        </v-btn>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore'
import TaskCard from '@/components/TaskCard.vue'
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'
import { getAuth, signInAnonymously } from 'firebase/auth'

const auth = getAuth()
const router = useRouter()
const scheduleStore = useScheduleStore()
const userStore = useUserStore()

const loading = ref(false)
const scheduleMeta = ref(null)

const todayKST = computed(() => {
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000
  const kst = new Date(now.getTime() + kstOffset)
  return kst.toISOString().split('T')[0]
})

const selectedDate = ref(todayKST.value)

const displayDate = computed(() => {
  const date = new Date(selectedDate.value)
  const day = date.toLocaleDateString('ko-KR', { weekday: 'short' })
  return selectedDate.value === todayKST.value ? '오늘' : `${selectedDate.value} (${day})`
})

const displayDday = computed(() => {
  const today = new Date(todayKST.value)
  const target = new Date(selectedDate.value)
  const diff = Math.floor((target - today) / (1000 * 60 * 60 * 24))
  return selectedDate.value === todayKST.value ? '오늘' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`
})

async function loadSchedules(date) {
  const q = query(collection(db, 'schedules'), where('date', '==', date))
  const snap = await getDocs(q)
  const schedules = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  scheduleStore.setSchedules(schedules)
}

async function loadScheduleMeta(date) {
  const q = query(collection(db, 'schedulesMeta'), where('date', '==', date), limit(1))
  const snap = await getDocs(q)
  if (!snap.empty) {
    const data = snap.docs[0].data()
    const userDocs = await Promise.all(data.workers.map(id => getDoc(doc(db, 'users', id))))
    data.workerNames = userDocs.map(u => u.exists() ? u.data().name : '알 수 없음')
    scheduleMeta.value = data
  } else {
    scheduleMeta.value = null
  }
}

async function loadData(date) {
  loading.value = true
  try {
    await Promise.all([
      loadSchedules(date),
      loadScheduleMeta(date)
    ])
  } catch (err) {
    console.error('데이터 로딩 실패:', err)
  } finally {
    loading.value = false
  }
}

function changeDate(offset) {
  const current = new Date(selectedDate.value)
  current.setDate(current.getDate() + offset)
  selectedDate.value = current.toISOString().split('T')[0]
  loadData(selectedDate.value)
}

async function logout() {
  try {
    await auth.signOut()
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_role')
    userStore.logout()
    await router.push('/login')
  } catch (err) {
    console.error('로그아웃 실패:', err)
  }
}

async function goTo(path) {
  try {
    loading.value = true
    await router.push(path)
  } catch (err) {
    console.error('이동 실패:', err)
  } finally {
    loading.value = false
  }
}

const goToAll = () => goTo('/schedules')
const goToAdd = () => goTo('/add')
const goToAddDate = () => {
  const formatted = selectedDate.value instanceof Date
    ? selectedDate.value.toISOString().split('T')[0]
    : selectedDate.value  // already string

  router.push({ path: '/add', query: { date: formatted } })
}
const goToPayroll = () => goTo('/payroll')
const goToWorker = () => goTo('/worker-schedules')
const goToMetaEdit = () => goTo('/meta')
const goToDetail = (id) => goTo(`/schedule/${id}`)
const goToEstimateForm = () => goTo('/estimate')
const goToStatementForm = () => goTo('/statement')

const activeSchedules = computed(() =>
  scheduleStore.schedules.filter(s => (s.status || '').trim() === '진행')
)
const completedSchedules = computed(() =>
  scheduleStore.schedules.filter(s => (s.status || '').trim() !== '진행' && (s.status || '').trim() !== '취소됨')
)
const completedDoneSchedules = computed(() =>
  completedSchedules.value.filter(s => (s.status || '').trim() === '완료')
)
const completedHoldSchedules = computed(() =>
  completedSchedules.value.filter(s => (s.status || '').trim() === '보류')
)

onMounted(async () => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth)
    }

    if (!userStore.userId) {
      const id = localStorage.getItem('user_id')
      const name = localStorage.getItem('user_name')
      const role = localStorage.getItem('user_role')
      if (id && name && role) {
        userStore.setUser({ id, name, role })
      }
    }

    await loadData(selectedDate.value)
  } catch (err) {
    console.error('초기 로딩 실패:', err)
    await router.push('/login')
  }
})
</script>

<style scoped>
/* 🎯 플로팅 액션 버튼 – 모바일/웹 동일 정렬 대응 */
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

.action-group {
  margin-bottom: 16px;
}
.action-group:last-child {
  margin-bottom: 0;
}

.action-group-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-buttons {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  gap: 8px;
}

.action-btn {
  flex: 1 1 0;
  min-width: 0;
  height: 48px;
  font-size: 14px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
}

.document-btn {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}
.document-btn:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

.feature-btn {
  font-weight: 600;
}
.primary-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
  color: white;
}
.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

.view-all-btn {
  margin-top: 12px;
  height: 56px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}
.view-all-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

/* ✅ 모바일 대응 (정렬 유지) */
@media (max-width: 600px) {
  .floating-actions {
    padding: 16px;
  }

  .action-btn {
    height: 44px;
    font-size: 13px;
    padding: 0 8px;
  }

  .view-all-btn {
    height: 48px;
    font-size: 14px;
  }
}

/* ⬇️ 이하 네 기존 스타일 유지 – 수정 필요 없음 */
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
}
.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
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

.date-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.date-nav-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 12px;
}
.date-nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
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

.meta-info-section {
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.meta-info-section:hover {
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
}
.meta-content {
  flex: 1;
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
}

.task-section {
  margin-bottom: 32px;
}
.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.section-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}
.section-icon.active {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}
.section-icon.completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
.section-icon.hold {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}
.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.task-card-wrapper {
  margin-bottom: 12px;
}

.task-fade-enter-active {
  transition: all 0.4s ease;
}
.task-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.task-fade-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.task-fade-leave-active {
  transition: all 0.3s ease;
}
.task-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.task-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

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
</style>
