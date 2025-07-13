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
            @click="$router.push('/')"
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
            v-if="selectedWorkerName"
            color="warning"
            size="small"
            class="mr-2"
          >
            <v-icon start size="14">mdi-account</v-icon>
            {{ selectedWorkerName }}
          </v-chip>
        </div>
      </div>
    </v-app-bar>

    <v-main class="main-content">
      <!-- 🌀 로딩 오버레이 -->
      <div v-if="loadingMeta" class="loading-overlay">
        <div class="loading-container">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            width="6"
          />
          <div class="loading-text mt-4">작업자 일정 로딩 중...</div>
        </div>
      </div>

      <v-container
        class="pa-6"
        style="padding-bottom: 120px !important; max-width: 1200px"
      >
        <!-- 🚨 에러 알림 -->
        <v-alert v-if="error" type="error" class="mb-6" prominent>
          <v-icon start>mdi-alert-circle</v-icon>
          {{ error }}
        </v-alert>

        <!-- 👥 작업자 선택 카드 -->
        <v-card class="worker-selection-card mb-8" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-account-group</v-icon>
            </div>
            <h3 class="card-title">작업자 선택</h3>
            <v-chip color="info" size="small" class="ml-2">
              {{ workers.length }}명
            </v-chip>
          </div>

          <div class="worker-grid">
            <v-btn
              v-for="worker in workers"
              :key="worker.id"
              :variant="selectedWorker === worker.id ? 'flat' : 'outlined'"
              :color="selectedWorker === worker.id ? 'primary' : 'grey'"
              class="worker-btn"
              @click="selectWorker(worker.id)"
            >
              <v-icon start>
                {{
                  selectedWorker === worker.id
                    ? 'mdi-account-check'
                    : 'mdi-account'
                }}
              </v-icon>
              {{ worker.name }}
            </v-btn>
          </div>
        </v-card>

        <!-- 📋 작업자 미선택 상태 -->
        <div v-if="!selectedWorker" class="empty-state">
          <div class="empty-icon">
            <v-icon size="80" color="grey-lighten-2"
              >mdi-account-question</v-icon
            >
          </div>
          <h3 class="empty-title">작업자를 선택해주세요</h3>
          <p class="empty-description">
            일정을 확인할 작업자를 선택하면 상세 정보를 볼 수 있습니다.
          </p>
        </div>

        <!-- 📊 일정 현황 -->
        <template v-else>
          <!-- 📈 통계 요약 -->
          <v-card class="stats-card mb-8" elevation="0">
            <div class="stats-header">
              <div class="stats-icon">
                <v-icon color="primary">mdi-chart-timeline</v-icon>
              </div>
              <h3 class="stats-title">{{ selectedWorkerName }} 일정 현황</h3>
            </div>

            <div class="stats-grid">
              <div class="stat-item upcoming">
                <div class="stat-number">{{ upcomingMeta.length }}</div>
                <div class="stat-label">예정된 작업</div>
                <div class="stat-icon">
                  <v-icon>mdi-calendar-clock</v-icon>
                </div>
              </div>
              <div class="stat-item completed">
                <div class="stat-number">{{ pastMeta.length }}</div>
                <div class="stat-label">완료된 작업</div>
                <div class="stat-icon">
                  <v-icon>mdi-calendar-check</v-icon>
                </div>
              </div>
              <div class="stat-item total">
                <div class="stat-number">
                  {{ upcomingMeta.length + pastMeta.length }}
                </div>
                <div class="stat-label">총 작업 수</div>
                <div class="stat-icon">
                  <v-icon>mdi-calendar-multiple</v-icon>
                </div>
              </div>
            </div>
          </v-card>

          <!-- 📅 예정된 일정 -->
          <div class="schedule-section">
            <div class="section-header">
              <div class="section-icon upcoming">
                <v-icon color="white">mdi-calendar-clock</v-icon>
              </div>
              <h3 class="section-title">예정된 일정</h3>
              <v-chip
                :color="upcomingMeta.length > 0 ? 'warning' : 'grey'"
                size="small"
                class="ml-2"
              >
                {{ upcomingMeta.length }}건
              </v-chip>
            </div>

            <v-alert
              v-if="upcomingMeta.length === 0"
              type="info"
              class="info-alert"
              prominent
            >
              <v-icon start>mdi-calendar-remove</v-icon>
              예정된 일정이 없습니다.
            </v-alert>

            <transition-group name="schedule-fade" tag="div">
              <v-card
                v-for="item in upcomingMeta"
                :key="`${item.id}-${item.dday}-upcoming`"
                class="schedule-card upcoming-card"
              >
                <div class="card-content">
                  <div class="card-main-info">
                    <div class="date-badge upcoming-badge">
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
                    <v-chip color="warning" size="small" variant="flat">
                      <v-icon start size="14">mdi-calendar-clock</v-icon>
                      {{ getDdayText(item.dday) }}
                    </v-chip>
                  </div>
                </div>
              </v-card>
            </transition-group>
          </div>

          <!-- 📜 지난 일정 -->
          <div class="schedule-section">
            <div class="section-header">
              <div class="section-icon completed">
                <v-icon color="white">mdi-calendar-check</v-icon>
              </div>
              <h3 class="section-title">지난 일정</h3>
              <v-chip color="success" size="small" class="ml-2">
                {{ pastMeta.length }}건
              </v-chip>
            </div>

            <v-alert
              v-if="pastMeta.length === 0"
              type="info"
              class="info-alert"
              prominent
            >
              <v-icon start>mdi-calendar-remove</v-icon>
              지난 일정이 없습니다.
            </v-alert>

            <transition-group name="schedule-fade" tag="div">
              <v-card
                v-for="item in pastMeta"
                :key="`${item.id}-${item.dday}-past`"
                class="schedule-card past-card"
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
            </transition-group>
          </div>
        </template>
      </v-container>

      <!-- 🏠 하단 홈 버튼 -->
      <div class="floating-actions">
        <v-btn
          block
          size="large"
          variant="outlined"
          class="home-btn"
          @click="$router.push('/')"
        >
          <v-icon start>mdi-home</v-icon>
          홈으로 돌아가기
        </v-btn>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

function getTodayKST() {
  const now = new Date()
  const offset = 9 * 60 * 60 * 1000
  const kst = new Date(now.getTime() + offset)
  return kst.toISOString().split('T')[0]
}

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

const selectedWorker = ref(null)
const workers = ref([])
const metaList = ref([])
const userMap = ref({})
const loadingMeta = ref(false)
const error = ref('')
const today = getTodayKST()

const selectedWorkerName = computed(() => {
  if (!selectedWorker.value) return ''
  const worker = workers.value.find((w) => w.id === selectedWorker.value)
  return worker ? worker.name : ''
})

onMounted(async () => {
  await fetchUsers()
  const queryId = route.query.worker
  const currentUserId = userStore.userId
  if (queryId && workers.value.find((w) => w.id === queryId)) {
    selectedWorker.value = queryId
  } else if (!selectedWorker.value && currentUserId) {
    const match = workers.value.find((w) => w.id === currentUserId)
    selectedWorker.value = match ? match.id : null
  }
  await fetchMeta()
})

const selectWorker = (id) => {
  selectedWorker.value = selectedWorker.value === id ? null : id
  router.replace({ query: { worker: selectedWorker.value || undefined } })
}

async function fetchUsers() {
  const snap = await getDocs(collection(db, 'users'))
  workers.value = snap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name || doc.id,
  }))
  userMap.value = Object.fromEntries(workers.value.map((u) => [u.id, u.name]))
}

async function fetchMeta() {
  loadingMeta.value = true
  error.value = ''
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
  } catch (err) {
    console.error(err)
    error.value = '작업자별 일정 조회 중 오류가 발생했습니다.'
  } finally {
    loadingMeta.value = false
  }
}

const upcomingMeta = computed(() => {
  if (!selectedWorker.value) return []
  return metaList.value
    .filter((m) => m.workers.includes(selectedWorker.value) && m.date >= today)
    .map((m) => ({ ...m, dday: dateDiff(today, m.date) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
})

const pastMeta = computed(() => {
  if (!selectedWorker.value) return []
  return metaList.value
    .filter((m) => m.workers.includes(selectedWorker.value) && m.date < today)
    .map((m) => ({ ...m, dday: dateDiff(m.date, today) }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})
</script>

<style scoped>
/* 🎨 헤더 스타일 - 메인과 동일 */
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 12px;
}

.back-btn:hover {
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

/* 👥 작업자 선택 카드 */
.worker-selection-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.worker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 24px;
}

.worker-btn {
  height: 60px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
}

.worker-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
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
  margin-bottom: 8px;
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
}

.schedule-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.upcoming-card {
  background: linear-gradient(135deg, #fef3cd 0%, #fde68a 5%, #ffffff 15%);
  border-left: 6px solid #f59e0b;
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

/* 🚨 알림 */
.info-alert {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1px solid #3b82f6;
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

/* 애니메이션 */
.schedule-fade-enter-active {
  transition: all 0.4s ease;
}

.schedule-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.schedule-fade-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.schedule-fade-leave-active {
  transition: all 0.3s ease;
}

.schedule-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.schedule-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* 🎯 반응형 디자인 */
@media (max-width: 768px) {
  .worker-grid {
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
</style>
