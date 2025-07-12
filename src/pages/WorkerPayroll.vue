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
            @click="$router.push('/')"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div class="header-icon-wrapper">
            <v-icon size="32" color="white">mdi-calculator</v-icon>
          </div>
          <div class="ml-3">
            <h2 class="header-title">정산 관리</h2>
            <div class="header-subtitle">작업자별 정산 현황</div>
          </div>
        </div>
        
        <div class="d-flex align-center">
          <div v-if="userStore.userId" class="user-info-chip">
            <v-avatar size="36" class="mr-2">
              <v-icon color="primary">mdi-account</v-icon>
            </v-avatar>
            <span class="user-name">{{ userStore.userName }}님</span>
          </div>
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
          <div class="loading-text mt-4">정산 데이터 로딩 중...</div>
        </div>
      </div>

      <v-container class="pa-6" style="padding-bottom: 120px !important; max-width: 1200px;">
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
                {{ selectedWorker === worker.id ? 'mdi-account-check' : 'mdi-account' }}
              </v-icon>
              {{ worker.name }}
            </v-btn>
          </div>
        </v-card>

        <!-- 📋 작업자 미선택 상태 -->
        <div v-if="!selectedWorker" class="empty-state">
          <div class="empty-icon">
            <v-icon size="80" color="grey-lighten-2">mdi-account-question</v-icon>
          </div>
          <h3 class="empty-title">작업자를 선택해주세요</h3>
          <p class="empty-description">정산을 확인할 작업자를 선택하면 상세 정보를 볼 수 있습니다.</p>
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
                :class="{ 'selected': selectedUnpaid.includes(item.id) }"
                @click="toggleUnpaid(item.id)"
              >
                <div class="card-content">
                  <div class="card-main-info">
                    <div class="date-badge unpaid-badge">D+{{ item.dday }}</div>
                    <div class="date-info">
                      <h4 class="work-date">{{ item.date }}</h4>
                      <div class="work-details">
                        <div class="detail-item">
                          <v-icon size="16" color="grey-darken-1">mdi-clock-outline</v-icon>
                          <span>{{ item.startTime || '시간 미정' }}</span>
                        </div>
                        <div class="detail-item">
                          <v-icon size="16" color="grey-darken-1">mdi-account-group</v-icon>
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
                
                <div class="selection-indicator" v-if="selectedUnpaid.includes(item.id)">
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
                :class="{ 'selected': selectedPaid.includes(item.id) }"
                @click="togglePaid(item.id)"
              >
                <div class="card-content">
                  <div class="card-main-info">
                    <div class="date-badge paid-badge">D+{{ item.dday }}</div>
                    <div class="date-info">
                      <h4 class="work-date">{{ item.date }}</h4>
                      <div class="work-details">
                        <div class="detail-item">
                          <v-icon size="16" color="grey-darken-1">mdi-clock-outline</v-icon>
                          <span>{{ item.startTime || '시간 미정' }}</span>
                        </div>
                        <div class="detail-item">
                          <v-icon size="16" color="grey-darken-1">mdi-account-group</v-icon>
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
                
                <div class="selection-indicator" v-if="selectedPaid.includes(item.id)">
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
import { db } from '@/firebase/config'
import { collection, getDocs, query, orderBy, updateDoc, doc, getDoc } from 'firebase/firestore'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const meta = ref([])
const selectedWorker = ref(null)
const workers = ref([])
const selectedUnpaid = ref([])
const selectedPaid = ref([])
const userMap = ref({})

const loadingMeta = ref(false)
const updating = ref(false)
const error = ref('')

function getTodayKST() {
  const now = new Date()
  const offset = 9 * 60 * 60 * 1000
  const kst = new Date(now.getTime() + offset)
  return kst.toISOString().split('T')[0]
}
const todayKST = getTodayKST()

function toKSTDate(dateStr) {
  return new Date(dateStr + 'T00:00:00+09:00')
}
function calcDday(dateStr) {
  return Math.floor((toKSTDate(todayKST) - toKSTDate(dateStr)) / (1000 * 60 * 60 * 24))
}

function selectWorker(id) {
  selectedWorker.value = selectedWorker.value === id ? null : id
  selectedUnpaid.value = []
  selectedPaid.value = []
}

async function fetchUsers() {
  const userSnap = await getDocs(collection(db, 'users'))
  workers.value = userSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name || doc.id }))
  userMap.value = Object.fromEntries(workers.value.map(u => [u.id, u.name]))
  if (!selectedWorker.value && workers.value.length > 0) {
    const currentUserId = userStore.userId
    const match = workers.value.find(w => w.id === currentUserId)
    selectedWorker.value = match ? match.id : workers.value[0].id
  }
}

async function fetchMeta() {
  loadingMeta.value = true
  const snap = await getDocs(query(collection(db, 'schedulesMeta'), orderBy('date', 'desc')))
  meta.value = snap.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      paidMap: data.paidMap || {},
      workerNames: (data.workers || []).map(uid => userMap.value[uid] || '알 수 없음'),
      dday: calcDday(data.date)
    }
  })
  loadingMeta.value = false
}

const unpaid = computed(() => {
  return meta.value.filter(
    m =>
      m.workers.includes(selectedWorker.value) &&
      (!m.paidMap[selectedWorker.value]) &&
      m.date <= todayKST
  )
})

const paid = computed(() => {
  return meta.value.filter(
    m =>
      m.workers.includes(selectedWorker.value) &&
      m.paidMap[selectedWorker.value] === true
  )
})

function toggleUnpaid(id) {
  selectedUnpaid.value.includes(id)
    ? selectedUnpaid.value = selectedUnpaid.value.filter(i => i !== id)
    : selectedUnpaid.value.push(id)
}

function togglePaid(id) {
  selectedPaid.value.includes(id)
    ? selectedPaid.value = selectedPaid.value.filter(i => i !== id)
    : selectedPaid.value.push(id)
}

async function markAsPaid() {
  if (updating.value) return
  updating.value = true
  error.value = ''
  try {
    for (const id of selectedUnpaid.value) {
      const docRef = doc(db, 'schedulesMeta', id)
      const snap = await getDoc(docRef)
      const data = snap.data()
      const paidMap = data.paidMap || {}
      paidMap[selectedWorker.value] = true
      await updateDoc(docRef, { paidMap })
      const metaItem = meta.value.find(m => m.id === id)
      if (metaItem) metaItem.paidMap[selectedWorker.value] = true
    }
    selectedUnpaid.value = []
    showSuccessMessage('정산 처리가 완료되었습니다!')
  } catch (err) {
    console.error('정산 처리 중 오류:', err)
    error.value = '정산 처리 중 오류가 발생했습니다.'
  } finally {
    updating.value = false
  }
}

async function cancelPaid() {
  if (updating.value) return
  updating.value = true
  error.value = ''
  try {
    for (const id of selectedPaid.value) {
      const docRef = doc(db, 'schedulesMeta', id)
      const snap = await getDoc(docRef)
      const data = snap.data()
      const paidMap = data.paidMap || {}
      paidMap[selectedWorker.value] = false
      await updateDoc(docRef, { paidMap })
      const metaItem = meta.value.find(m => m.id === id)
      if (metaItem) metaItem.paidMap[selectedWorker.value] = false
    }
    selectedPaid.value = []
    showSuccessMessage('정산이 취소되었습니다!')
  } catch (err) {
    console.error('정산 취소 중 오류:', err)
    error.value = '정산 취소 중 오류가 발생했습니다.'
  } finally {
    updating.value = false
  }
}

function showSuccessMessage(message) {
  const snackbar = document.createElement('div')
  snackbar.className = 'success-snackbar'
  snackbar.textContent = message
  document.body.appendChild(snackbar)
  setTimeout(() => {
    if (document.body.contains(snackbar)) {
      document.body.removeChild(snackbar)
    }
  }, 3000)
}

onMounted(async () => {
  await fetchUsers()
  await fetchMeta()
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

.user-info-chip {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 6px 16px;
  display: flex;
  align-items: center;
  backdrop-filter: blur(10px);
}

.user-name {
  color: white;
  font-weight: 600;
  font-size: 14px;
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

.home-btn:hover {
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

/* 성공 스낵바 */
.success-snackbar {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
  z-index: 10000;
  animation: slideInDown 0.3s ease;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
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
}

@media (max-width: 480px) {
  .header-title {
    font-size: 20px;
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
  
  .floating-actions {
    padding: 16px;
  }
  
  .selection-indicator {
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
  }
}
</style>