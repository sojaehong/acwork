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
            <v-icon size="32">mdi-calculator</v-icon>
          </div>
          <div class="ml-3">
            <h2 class="header-title">정산 관리</h2>
            <div class="header-subtitle">작업자별 정산 현황</div>
          </div>
        </div>

        <div class="d-flex align-center">
          <div v-if="userStore.userId" class="user-info-chip">
            <v-avatar size="36" class="mr-2">
              <v-icon color="grey">mdi-account</v-icon>
            </v-avatar>
            <span class="user-name">{{ userStore.userName }}님</span>
          </div>
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
        </v-alert>

        <!-- 🌀 스켈레톤 로딩 UI -->
        <template v-if="loading">
          <!-- 작업자 선택 카드 스켈레톤 -->
          <div class="skeleton-worker-card mb-8">
            <div class="skeleton-card-header">
              <div class="skeleton-header-icon"></div>
              <div class="skeleton-header-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-chip"></div>
              </div>
            </div>
            <div class="skeleton-worker-grid">
              <div v-for="i in 6" :key="i" class="skeleton-worker-btn"></div>
            </div>
          </div>

          <!-- 정산 섹션 스켈레톤 -->
          <div class="skeleton-payroll-section">
            <div class="skeleton-section-header">
              <div class="skeleton-section-icon"></div>
              <div class="skeleton-section-title"></div>
              <div class="skeleton-section-chip"></div>
            </div>
            <div class="skeleton-payroll-cards">
              <div v-for="i in 3" :key="i" class="skeleton-payroll-card">
                <div class="skeleton-card-main">
                  <div class="skeleton-date-badge"></div>
                  <div class="skeleton-card-content">
                    <div class="skeleton-work-date"></div>
                    <div class="skeleton-work-details">
                      <div class="skeleton-detail-item"></div>
                      <div class="skeleton-detail-item"></div>
                    </div>
                  </div>
                </div>
                <div class="skeleton-status-chip"></div>
              </div>
            </div>
          </div>

          <!-- 두 번째 정산 섹션 스켈레톤 -->
          <div class="skeleton-payroll-section">
            <div class="skeleton-section-header">
              <div class="skeleton-section-icon"></div>
              <div class="skeleton-section-title"></div>
              <div class="skeleton-section-chip"></div>
            </div>
            <div class="skeleton-payroll-cards">
              <div v-for="i in 2" :key="i" class="skeleton-payroll-card">
                <div class="skeleton-card-main">
                  <div class="skeleton-date-badge"></div>
                  <div class="skeleton-card-content">
                    <div class="skeleton-work-date"></div>
                    <div class="skeleton-work-details">
                      <div class="skeleton-detail-item"></div>
                      <div class="skeleton-detail-item"></div>
                    </div>
                  </div>
                </div>
                <div class="skeleton-status-chip"></div>
              </div>
            </div>
          </div>
        </template>

        <!-- 📋 실제 컨텐츠 -->
        <template v-else>
          <!-- 👥 작업자 선택 카드 -->
          <v-card class="worker-selection-card mb-8" elevation="0">
            <div class="card-header">
              <div class="header-icon">
                <v-icon color="white">mdi-account-group</v-icon>
              </div>
              <h3 class="card-title">작업자 선택</h3>
              <v-chip color="rgba(255,255,255,0.2)" size="small" class="ml-2">
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
              정산을 확인할 작업자를 선택하면 상세 정보를 볼 수 있습니다.
            </p>
          </div>

          <!-- 📊 정산 현황 -->
          <template v-else>
            <!-- 💰 정산 안된 항목 -->
            <div class="payroll-section">
              <div class="section-header">
                <div class="section-icon unpaid">
                  <v-icon color="white">mdi-currency-usd-off</v-icon>
                </div>
                <h3 class="section-title">정산 대기</h3>
                <v-chip
                  :color="unpaid.length > 0 ? 'warning' : 'success'"
                  size="small"
                  class="ml-2"
                >
                  {{ unpaid.length }}건
                </v-chip>
              </div>

              <v-alert
                v-if="unpaid.length === 0"
                type="success"
                class="success-alert"
                prominent
              >
                <v-icon start>mdi-check-circle</v-icon>
                정산 대기 중인 항목이 없습니다!
              </v-alert>

              <transition-group name="payroll-fade" tag="div">
                <v-card
                  v-for="item in unpaid"
                  :key="`${item.id}-${item.dday}`"
                  class="payroll-card unpaid-card"
                  :class="{ selected: selectedUnpaid.includes(item.id) }"
                  @click="toggleUnpaid(item.id)"
                >
                  <div class="card-content">
                    <div class="card-main-info">
                      <div class="date-badge unpaid-badge">
                        D+{{ item.dday }}
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
                        <v-icon start size="14">mdi-clock-alert</v-icon>
                        정산 대기
                      </v-chip>
                    </div>
                  </div>

                  <div
                    class="selection-indicator"
                    v-if="selectedUnpaid.includes(item.id)"
                  >
                    <v-icon color="primary">mdi-check-circle</v-icon>
                  </div>
                </v-card>
              </transition-group>

              <!-- 정산 처리 버튼 -->
              <v-btn
                v-if="selectedUnpaid.length > 0"
                :loading="updating"
                color="success"
                size="large"
                block
                class="action-btn mt-4"
                @click="markAsPaid"
              >
                <v-icon start>mdi-check-circle</v-icon>
                선택한 {{ selectedUnpaid.length }}건 정산 처리
              </v-btn>
            </div>

            <!-- ✅ 정산 완료 항목 -->
            <div class="payroll-section">
              <div class="section-header">
                <div class="section-icon paid">
                  <v-icon color="white">mdi-check-circle</v-icon>
                </div>
                <h3 class="section-title">정산 완료</h3>
                <v-chip color="success" size="small" class="ml-2">
                  {{ paid.length }}건
                </v-chip>
              </div>

              <v-alert
                v-if="paid.length === 0"
                type="info"
                class="info-alert"
                prominent
              >
                <v-icon start>mdi-information</v-icon>
                정산 완료된 항목이 없습니다.
              </v-alert>

              <transition-group name="payroll-fade" tag="div">
                <v-card
                  v-for="item in paid"
                  :key="`${item.id}-${item.dday}-paid`"
                  class="payroll-card paid-card"
                  :class="{ selected: selectedPaid.includes(item.id) }"
                  @click="togglePaid(item.id)"
                >
                  <div class="card-content">
                    <div class="card-main-info">
                      <div class="date-badge paid-badge">D+{{ item.dday }}</div>
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
                        정산 완료
                      </v-chip>
                    </div>
                  </div>

                  <div
                    class="selection-indicator"
                    v-if="selectedPaid.includes(item.id)"
                  >
                    <v-icon color="error">mdi-close-circle</v-icon>
                  </div>
                </v-card>
              </transition-group>

              <!-- 정산 취소 버튼 -->
              <v-btn
                v-if="selectedPaid.length > 0"
                :loading="updating"
                color="error"
                size="large"
                block
                class="action-btn mt-4"
                @click="cancelPaid"
              >
                <v-icon start>mdi-close-circle</v-icon>
                선택한 {{ selectedPaid.length }}건 정산 취소
              </v-btn>
            </div>
          </template>
        </template>
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
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { getTodayDateKST } from '@/utils/date.js'
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  getDoc,
} from 'firebase/firestore'
import { useUserStore } from '@/stores/user'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const userStore = useUserStore()
const uiStore = useUiStore()

const meta = ref([])
const selectedWorker = ref(null)
const workers = ref([])
const selectedUnpaid = ref([])
const selectedPaid = ref([])
const userMap = ref({})

const loading = ref(false)
const updating = ref(false)
const error = ref('')

// 🚀 개선된 날짜 처리 함수

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const day = date.toLocaleDateString('ko-KR', { weekday: 'short' })
  return `${dateStr} (${day})`
}

const todayKST = getTodayDateKST()

function toKSTDate(dateStr) {
  return new Date(dateStr + 'T00:00:00+09:00')
}

function calcDday(dateStr) {
  return Math.floor(
    (toKSTDate(todayKST) - toKSTDate(dateStr)) / (1000 * 60 * 60 * 24)
  )
}

function selectWorker(id) {
  selectedWorker.value = selectedWorker.value === id ? null : id
  selectedUnpaid.value = []
  selectedPaid.value = []
}

function clearError() {
  error.value = ''
}

const goHome = () => {
  try {
    router.push('/')
  } catch (err) {
    console.error('홈 이동 중 오류:', err)
    error.value = '홈으로 이동 중 오류가 발생했습니다.'
  }
}

// 🚀 개선된 데이터 로딩 함수
async function fetchUsers() {
  try {
    const userSnap = await getDocs(collection(db, 'users'))
    workers.value = userSnap.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name || doc.id,
    }))
    userMap.value = Object.fromEntries(workers.value.map((u) => [u.id, u.name]))

    // 현재 사용자 자동 선택
    if (!selectedWorker.value && workers.value.length > 0) {
      const currentUserId = userStore.userId
      const match = workers.value.find((w) => w.id === currentUserId)
      selectedWorker.value = match ? match.id : workers.value[0].id
    }
  } catch (err) {
    console.error('사용자 데이터 로딩 실패:', err)
    throw new Error('사용자 정보를 불러오는 중 오류가 발생했습니다.')
  }
}

async function fetchMeta() {
  try {
    const snap = await getDocs(
      query(collection(db, 'schedulesMeta'), orderBy('date', 'desc'))
    )
    meta.value = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        paidMap: data.paidMap || {},
        workerNames: (data.workers || []).map(
          (uid) => userMap.value[uid] || '알 수 없음'
        ),
        dday: calcDday(data.date),
      }
    })
  } catch (err) {
    console.error('메타 데이터 로딩 실패:', err)
    throw new Error('정산 데이터를 불러오는 중 오류가 발생했습니다.')
  }
}

const unpaid = computed(() => {
  return meta.value.filter(
    (m) =>
      m.workers.includes(selectedWorker.value) &&
      !m.paidMap[selectedWorker.value] &&
      m.date <= todayKST
  )
})

const paid = computed(() => {
  return meta.value.filter(
    (m) =>
      m.workers.includes(selectedWorker.value) &&
      m.paidMap[selectedWorker.value] === true
  )
})

function toggleUnpaid(id) {
  selectedUnpaid.value.includes(id)
    ? (selectedUnpaid.value = selectedUnpaid.value.filter((i) => i !== id))
    : selectedUnpaid.value.push(id)
}

function togglePaid(id) {
  selectedPaid.value.includes(id)
    ? (selectedPaid.value = selectedPaid.value.filter((i) => i !== id))
    : selectedPaid.value.push(id)
}

// 🚀 개선된 정산 처리 함수
async function markAsPaid() {
  if (updating.value || selectedUnpaid.value.length === 0) return

  const confirm = window.confirm(
    `선택한 ${selectedUnpaid.value.length}건의 정산을 처리하시겠습니까?`
  )
  if (!confirm) return

  updating.value = true
  error.value = ''

  try {
    for (const id of selectedUnpaid.value) {
      const docRef = doc(db, 'schedulesMeta', id)
      const snap = await getDoc(docRef)

      if (!snap.exists()) {
        throw new Error(`문서 ID ${id}를 찾을 수 없습니다.`)
      }

      const data = snap.data()
      const paidMap = data.paidMap || {}
      paidMap[selectedWorker.value] = true

      await updateDoc(docRef, { paidMap })

      // 로컬 상태 업데이트
      const metaItem = meta.value.find((m) => m.id === id)
      if (metaItem) {
        metaItem.paidMap[selectedWorker.value] = true
      }
    }

    selectedUnpaid.value = []
    uiStore.showSnackbar('정산 처리가 완료되었습니다!', 'success')
  } catch (err) {
    console.error('정산 처리 중 오류:', err)
    error.value = '정산 처리 중 오류가 발생했습니다.'
  } finally {
    updating.value = false
  }
}

async function cancelPaid() {
  if (updating.value || selectedPaid.value.length === 0) return

  const confirm = window.confirm(
    `선택한 ${selectedPaid.value.length}건의 정산을 취소하시겠습니까?`
  )
  if (!confirm) return

  updating.value = true
  error.value = ''

  try {
    for (const id of selectedPaid.value) {
      const docRef = doc(db, 'schedulesMeta', id)
      const snap = await getDoc(docRef)

      if (!snap.exists()) {
        throw new Error(`문서 ID ${id}를 찾을 수 없습니다.`)
      }

      const data = snap.data()
      const paidMap = data.paidMap || {}
      paidMap[selectedWorker.value] = false

      await updateDoc(docRef, { paidMap })

      // 로컬 상태 업데이트
      const metaItem = meta.value.find((m) => m.id === id)
      if (metaItem) {
        metaItem.paidMap[selectedWorker.value] = false
      }
    }

    selectedPaid.value = []
    uiStore.showSnackbar('정산이 취소되었습니다!', 'success')
  } catch (err) {
    console.error('정산 취소 중 오류:', err)
    error.value = '정산 취소 중 오류가 발생했습니다.'
  } finally {
    updating.value = false
  }
}

// 🚀 개선된 초기화 함수
onMounted(async () => {
  loading.value = true

  try {
    // 인증 초기화
    const authResult = await userStore.initializeAuth(router)
    if (!authResult.success) {
      error.value = authResult.error
      return
    }

    // 재시도 로직을 포함한 데이터 로딩
    await userStore.withRetry(async () => {
      await fetchUsers()
      await fetchMeta()
    })
  } catch (err) {
    console.error('초기화 실패:', err)
    error.value = err.message || '데이터를 불러오는 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* 🎨 헤더 스타일 */
.custom-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04) !important;
}

.back-btn {
  background: rgba(100, 116, 139, 0.1) !important;
  color: #475569 !important;
  border-radius: 12px !important;
  transition: all 0.2s ease !important;
}

.back-btn:hover,
.back-btn:focus {
  background: rgba(100, 116, 139, 0.15) !important;
  transform: translateY(-1px);
}

.header-icon-wrapper {
  width: 48px !important;
  height: 48px !important;
  border-radius: 12px !important;
  background: rgba(100, 116, 139, 0.1) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  backdrop-filter: blur(10px) !important;
}
.header-icon-wrapper .v-icon {
  color: #64748b !important;
}

.header-title {
  color: #1e293b !important;
  font-weight: 700 !important;
  font-size: 24px !important;
  margin: 0 !important;
}

.header-subtitle {
  color: #64748b !important;
  font-size: 12px !important;
  font-weight: 500 !important;
}

.user-info-chip {
  background: rgba(255, 255, 255, 0.15) !important;
  border-radius: 24px !important;
  padding: 6px 16px !important;
  display: flex !important;
  align-items: center !important;
  backdrop-filter: blur(10px) !important;
}

.user-name {
  color: rgb(104, 103, 103) !important;
  font-weight: 600 !important;
  font-size: 14px !important;
}

/* 🌀 메인 컨텐츠 */
.main-content {
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

/* 🚀 스켈레톤 UI */
.skeleton-worker-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.skeleton-card-header {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.skeleton-header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
}

.skeleton-header-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.skeleton-title {
  width: 120px;
  height: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.skeleton-chip {
  width: 40px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.skeleton-worker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 24px;
}

.skeleton-worker-btn {
  height: 60px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 16px;
}

.skeleton-payroll-section {
  margin-bottom: 40px;
}

.skeleton-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.skeleton-section-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-section-title {
  width: 120px;
  height: 22px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-section-chip {
  width: 50px;
  height: 24px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
}

.skeleton-payroll-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-payroll-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.skeleton-card-main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.skeleton-date-badge {
  width: 60px;
  height: 32px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
  flex-shrink: 0;
}

.skeleton-card-content {
  flex: 1;
}

.skeleton-work-date {
  width: 150px;
  height: 18px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-work-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skeleton-detail-item {
  width: 120px;
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-status-chip {
  width: 80px;
  height: 24px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
  margin-left: auto;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
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

/* 📊 정산 섹션 */
.payroll-section {
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

.section-icon.unpaid {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.section-icon.paid {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

/* 📋 정산 카드 */
.payroll-card {
  background: white;
  border-radius: 16px;
  margin-bottom: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.payroll-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.payroll-card.selected {
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

.unpaid-card.selected {
  background: linear-gradient(135deg, #fef3cd 0%, #fde68a 100%);
}

.paid-card.selected {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
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

.unpaid-badge {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.paid-badge {
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

.selection-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 🚨 알림 */
.success-alert {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border: 1px solid #22c55e;
}

.info-alert {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1px solid #3b82f6;
}

/* 🎯 액션 버튼 */
.action-btn {
  border-radius: 16px;
  font-weight: 700;
  text-transform: none;
  height: 56px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
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

/* 애니메이션 */
.payroll-fade-enter-active {
  transition: all 0.4s ease;
}

.payroll-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.payroll-fade-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.payroll-fade-leave-active {
  transition: all 0.3s ease;
}

.payroll-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.payroll-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* 🎯 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .payroll-card:hover,
  .worker-btn:hover,
  .action-btn:hover,
  .home-btn:hover {
    transform: none;
  }
}

/* 🎯 애니메이션 줄임 설정 */
@media (prefers-reduced-motion: reduce) {
  .skeleton-worker-btn,
  .skeleton-section-icon,
  .skeleton-section-title,
  .skeleton-section-chip,
  .skeleton-date-badge,
  .skeleton-work-date,
  .skeleton-detail-item,
  .skeleton-status-chip {
    animation: none !important;
  }

  .payroll-card,
  .worker-btn,
  .action-btn,
  .home-btn {
    transition: none;
  }

  .payroll-card:hover,
  .worker-btn:hover,
  .action-btn:hover,
  .home-btn:hover {
    transform: none;
  }
}

/* 🎯 반응형 디자인 */
@media (max-width: 768px) {
  .header-title {
    font-size: 20px !important;
  }
  
  .header-subtitle {
    font-size: 14px !important;
  }
  
  .header-icon-wrapper {
    width: 40px !important;
    height: 40px !important;
  }
  
  .header-icon-wrapper .v-icon {
    font-size: 20px !important;
  }

  .worker-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px;
    padding: 20px;
  }

  .worker-btn {
    height: 52px;
    font-size: 14px;
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
    font-size: 18px !important;
  }
  
  .header-subtitle {
    font-size: 12px !important;
  }
  
  .header-icon-wrapper {
    width: 36px !important;
    height: 36px !important;
  }
  
  .header-icon-wrapper .v-icon {
    font-size: 18px !important;
  }

  .worker-grid {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .payroll-card {
    padding: 16px;
  }

  .card-header {
    padding: 20px;
  }

  .selection-indicator {
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
  }
}

/* 포커스 가능한 요소들의 아웃라인 */
*:focus-visible {
  outline: 3px solid rgba(79, 70, 229, 0.5);
  outline-offset: 2px;
  border-radius: 4px;
}

/* 버튼 포커스 스타일 개선 */
.v-btn:focus-visible {
  outline: 3px solid rgba(79, 70, 229, 0.5);
  outline-offset: 2px;
}
</style>
