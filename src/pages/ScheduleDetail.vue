<template>
  <v-app>
    <!-- 🎨 일관된 헤더 디자인 -->
    <v-app-bar :elevation="0" class="custom-header" height="80">
      <div class="d-flex align-center justify-space-between w-100 px-4">
        <div class="d-flex align-center">
          <v-btn icon size="large" class="back-btn mr-3" @click="goBack">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div class="header-icon-wrapper">
            <v-icon size="32" color="white">mdi-file-document</v-icon>
          </div>
          <div class="ml-3">
            <h2 class="header-title">작업 상세</h2>
            <div class="header-subtitle">작업 정보 및 관리</div>
          </div>
        </div>

        <div class="d-flex align-center">
          <!-- 작업 상태 표시 -->
          <v-chip
            v-if="schedule?.status"
            :color="getStatusColor(schedule.status)"
            size="small"
            class="mr-2"
          >
            <v-icon start size="14">{{
              getStatusIcon(schedule.status)
            }}</v-icon>
            {{ schedule.status }}
          </v-chip>
        </div>
      </div>
    </v-app-bar>

    <v-main class="main-content">
      <!-- 🌀 로딩 오버레이 -->
      <div v-if="scheduleStore.isLoading" class="loading-overlay">
        <div class="loading-container">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            width="6"
          />
          <div class="loading-text mt-4">작업 정보 로딩 중...</div>
        </div>
      </div>

      <v-container
        class="pa-6"
        style="padding-bottom: 140px !important; max-width: 1000px"
        v-if="!scheduleStore.isLoading && schedule"
      >
        <!-- 📅 기본 정보 카드 -->
        <v-card class="detail-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-information</v-icon>
            </div>
            <h3 class="card-title">기본 정보</h3>
          </div>

          <div class="card-content">
            <div class="info-grid">
              <!-- 날짜 정보 -->
              <div class="info-item">
                <div class="info-icon">
                  <v-icon color="primary">mdi-calendar</v-icon>
                </div>
                <div class="info-content">
                  <div class="info-label">작업 날짜</div>
                  <div class="info-value">{{ formatDate(schedule?.date) }}</div>
                  <div class="info-extra">
                    {{ getDdayText(schedule?.date) }}
                  </div>
                </div>
              </div>

              <!-- 위치 정보 -->
              <div class="info-item">
                <div class="info-icon">
                  <v-icon color="primary">mdi-map-marker</v-icon>
                </div>
                <div class="info-content">
                  <div class="info-label">작업 위치</div>
                  <div class="info-value">{{ getLocationText() }}</div>
                  <div class="info-extra">{{ schedule?.building }}</div>
                </div>
              </div>

              <!-- 세금계산서 정보 -->
              <div class="info-item">
                <div class="info-icon">
                  <v-icon :color="schedule?.invoice ? 'blue' : 'grey'">
                    {{
                      schedule?.invoice ? 'mdi-receipt' : 'mdi-receipt-outline'
                    }}
                  </v-icon>
                </div>
                <div class="info-content">
                  <div class="info-label">세금계산서</div>
                  <div class="info-value">
                    {{ schedule?.invoice ? '발행함' : '미발행' }}
                  </div>
                  <div class="info-extra">
                    {{ schedule?.invoice ? 'O' : 'X' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card>

        <!-- 🛠 작업 내용 카드 -->
        <v-card class="detail-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-wrench</v-icon>
            </div>
            <h3 class="card-title">작업 내용</h3>
            <v-chip color="info" size="small" class="ml-2">
              {{ schedule?.tasks?.length || 0 }}개
            </v-chip>
          </div>

          <div class="card-content">
            <div v-if="schedule?.tasks?.length" class="task-chips">
              <v-chip
                v-for="(task, i) in schedule.tasks"
                :key="`${task.name}-${i}`"
                color="secondary"
                variant="tonal"
                size="large"
                class="task-chip"
              >
                <v-icon start size="16">mdi-tools</v-icon>
                {{ task.name }} ({{ task.count }}개)
              </v-chip>
            </div>
            <div v-else class="empty-tasks">
              <v-icon size="48" color="grey-lighten-2"
                >mdi-wrench-outline</v-icon
              >
              <div class="empty-text">등록된 작업이 없습니다</div>
            </div>
          </div>
        </v-card>

        <!-- 📌 상태 관리 카드 -->
        <v-card class="detail-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-flag</v-icon>
            </div>
            <h3 class="card-title">상태 관리</h3>
          </div>

          <div class="card-content">
            <div class="status-section">
              <label class="status-label">작업 상태 변경</label>
              <div class="status-buttons">
                <v-btn
                  v-for="s in statusOptions"
                  :key="s"
                  :variant="schedule.status === s ? 'flat' : 'outlined'"
                  :color="getStatusColor(s, schedule.status === s)"
                  class="status-btn"
                  @click="updateStatus(s)"
                  :loading="scheduleStore.isLoading && schedule.status !== s"
                >
                  <v-icon start>{{ getStatusIcon(s) }}</v-icon>
                  {{ s }}
                </v-btn>
              </div>
            </div>

            <!-- 보류 시 날짜 변경 -->
            <v-expand-transition>
              <div
                v-if="schedule.status === '보류'"
                class="date-change-section"
              >
                <label class="status-label">변경할 날짜 선택</label>
                <v-text-field
                  v-model="displayDate"
                  label="새로운 작업 날짜"
                  variant="outlined"
                  density="compact"
                  readonly
                  prepend-inner-icon="mdi-calendar"
                  append-inner-icon="mdi-chevron-down"
                  @click="pickerOpen = true"
                />
              </div>
            </v-expand-transition>
          </div>
        </v-card>

        <!-- 📝 메모 카드 -->
        <v-card class="detail-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-note-text</v-icon>
            </div>
            <h3 class="card-title">메모</h3>
          </div>

          <div class="card-content">
            <div v-if="schedule?.memo" class="memo-content">
              {{ schedule.memo }}
            </div>
            <div v-else class="empty-memo">
              <v-icon size="24" color="grey-lighten-2">mdi-note-outline</v-icon>
              <span class="empty-text">메모가 없습니다</span>
            </div>
          </div>
        </v-card>

        <!-- 날짜 선택 다이얼로그 -->
        <v-dialog v-model="pickerOpen" max-width="400">
          <v-card class="date-picker-dialog">
            <div class="dialog-header">
              <h3 class="dialog-title">날짜 변경</h3>
              <v-btn icon variant="text" @click="pickerOpen = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>

            <v-date-picker
              v-model="newDate"
              :min="today"
              color="primary"
              header-color="primary"
              class="custom-date-picker"
            />

            <v-card-actions class="pa-4">
              <v-spacer />
              <v-btn
                variant="outlined"
                @click="pickerOpen = false"
                :disabled="scheduleStore.isLoading"
              >
                취소
              </v-btn>
              <v-btn
                color="primary"
                :loading="scheduleStore.isLoading"
                @click="applyNewDate"
              >
                적용
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>

      <!-- 🎯 하단 액션 버튼 -->
      <div class="floating-actions">
        <v-row dense>
          <v-col cols="4">
            <v-btn
              variant="outlined"
              size="large"
              block
              class="action-btn back-btn"
              @click="goBack"
            >
              <v-icon start>mdi-arrow-left</v-icon>
              뒤로가기
            </v-btn>
          </v-col>
          <v-col cols="4">
            <v-btn
              v-if="schedule?.status === '취소됨'"
              color="error"
              size="large"
              block
              class="action-btn delete-btn"
              :loading="scheduleStore.isLoading"
              @click="deleteSchedule"
            >
              <v-icon start>mdi-delete</v-icon>
              완전삭제
            </v-btn>
            <v-btn
              v-else
              color="error"
              size="large"
              block
              class="action-btn cancel-btn"
              :loading="scheduleStore.isLoading"
              @click="cancelSchedule"
            >
              <v-icon start>mdi-cancel</v-icon>
              작업취소
            </v-btn>
          </v-col>
          <v-col cols="4">
            <v-btn
              color="primary"
              size="large"
              block
              class="action-btn edit-btn"
              @click="goToEdit"
            >
              <v-icon start>mdi-pencil</v-icon>
              수정하기
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const scheduleStore = useScheduleStore()
const { selectedSchedule: schedule } = storeToRefs(scheduleStore)
const uiStore = useUiStore()

const newDate = ref('')
const displayDate = ref('')
const pickerOpen = ref(false)
const statusOptions = ['진행', '보류', '완료']
const today = new Date().toISOString().split('T')[0]

const getStatusColor = (status, isSelected = false) => {
  if (!isSelected && arguments.length > 1) return 'grey'
  switch (status) {
    case '진행':
      return 'warning'
    case '완료':
      return 'success'
    case '보류':
      return 'error'
    case '취소됨':
      return 'grey'
    default:
      return 'grey'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case '진행':
      return 'mdi-play-circle'
    case '완료':
      return 'mdi-check-circle'
    case '보류':
      return 'mdi-pause-circle'
    case '취소됨':
      return 'mdi-cancel'
    default:
      return 'mdi-help-circle'
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const day = date.toLocaleDateString('ko-KR', { weekday: 'short' })
  return `${dateStr} (${day})`
}

const getDdayText = (dateStr) => {
  if (!dateStr) return ''
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

const getLocationText = () => {
  if (!schedule.value) return '-'
  const parts = []
  if (schedule.value.unit) parts.push(`${schedule.value.unit}동`)
  if (schedule.value.room) parts.push(`${schedule.value.room}호`)
  return parts.length > 0 ? parts.join(' ') : '위치 정보 없음'
}

onMounted(async () => {
  const id = route.params.id
  const scheduleFromStore = scheduleStore.getScheduleById(id)
  if (!scheduleFromStore) {
    await scheduleStore.fetchScheduleById(id)
  }
  scheduleStore.setSelectedSchedule(scheduleStore.getScheduleById(id))
})

watch(schedule, (newVal) => {
  if (newVal) {
    displayDate.value = newVal.date
  }
})

function formatDateToYYYYMMDD(date) {
  if (typeof date === 'string') return date
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().split('T')[0]
}

async function updateStatus(newStatus) {
  if (
    scheduleStore.isLoading ||
    !schedule.value.id ||
    schedule.value.status === newStatus
  )
    return
  try {
    await scheduleStore.updateSchedule({ ...schedule.value, status: newStatus })
    alert(`작업 상태가 '${newStatus}'로 변경되었습니다.`)
  } catch (err) {
    alert('상태 변경 중 오류가 발생했습니다.')
  }
}

async function applyNewDate() {
  if (!newDate.value) return
  const formatted = formatDateToYYYYMMDD(newDate.value)
  if (formatted < today) {
    alert('오늘 이전 날짜는 선택할 수 없습니다.')
    return
  }
  try {
    await scheduleStore.updateSchedule({
      ...schedule.value,
      date: formatted,
      status: '진행',
    })
    alert('일정이 성공적으로 변경되었습니다.')
  } catch (err) {
    alert('일정 변경 중 오류가 발생했습니다.')
  } finally {
    pickerOpen.value = false
  }
}

async function cancelSchedule() {
  if (scheduleStore.isLoading) return
  const ok = confirm('정말 이 작업을 취소하시겠습니까?')
  if (!ok) return
  try {
    await scheduleStore.updateSchedule({ ...schedule.value, status: '취소됨' })
    alert('작업이 취소되었습니다.')
    router.back()
  } catch (err) {
    alert('작업 취소 중 오류가 발생했습니다.')
  }
}

async function deleteSchedule() {
  if (scheduleStore.isLoading || !schedule.value.id) return
  const ok = confirm(
    '정말 이 취소된 작업을 완전히 삭제하시겠습니까? 복구할 수 없습니다.'
  )
  if (!ok) return
  try {
    await scheduleStore.deleteSchedule(schedule.value.id)
    alert('작업이 완전히 삭제되었습니다.')
    router.push('/schedules')
  } catch (err) {
    uiStore.showSnackbar('삭제 중 오류가 발생했습니다.', 'error')
  }
}

function goToEdit() {
  const originalFrom = route.query.from || 'schedules'
  router.push(`/schedule/${schedule.value.id}/edit?originalFrom=${originalFrom}`)
}

function goBack() {
  const fromPage = route.query.from
  
  if (fromPage === 'home') {
    router.push('/')
  } else {
    router.push('/schedules')
  }
}
</script>

<style scoped>
/* Styles remain the same */
/* 🎨 헤더 스타일 - 일관성 유지 */
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
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

/* 📋 상세 카드 */
.detail-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.detail-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.card-content {
  padding: 24px;
}

/* 📊 정보 그리드 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.info-item:hover {
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.info-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
}

.info-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.info-extra {
  font-size: 13px;
  color: #94a3b8;
}

/* 🛠 작업 칩 */
.task-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.task-chip {
  height: 48px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.task-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.empty-tasks,
.empty-memo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  color: #94a3b8;
  text-align: center;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
}

/* 📌 상태 관리 */
.status-section,
.date-change-section {
  margin-bottom: 20px;
}

.status-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.status-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.status-btn {
  height: 56px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
}

.status-btn:hover {
  transform: translateY(-2px);
}

.date-change-section {
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

/* 📝 메모 */
.memo-content {
  font-size: 16px;
  color: #475569;
  line-height: 1.6;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border-left: 4px solid #4f46e5;
}

/* 📅 날짜 선택 다이얼로그 */
.date-picker-dialog {
  border-radius: 20px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.dialog-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: white !important;
}

.dialog-header .v-btn {
  color: white !important;
}

.dialog-header .v-btn .v-btn__content {
  color: white !important;
}

.custom-date-picker {
  border-radius: 0;
}

/* 🎯 플로팅 액션 버튼 */
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

.action-btn {
  height: 56px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.back-btn {
  border: 2px solid #e2e8f0;
  color: #1e293b !important;
}

.back-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b !important;
}

.back-btn .v-btn__content {
  color: #1e293b !important;
}

.cancel-btn,
.delete-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

.cancel-btn:hover,
.delete-btn:hover {
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.edit-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.edit-btn:hover {
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

/* 📱 성공/에러 스낵바 */
.success-snackbar,
.error-snackbar {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  font-weight: 600;
  z-index: 10000;
  animation: slideInDown 0.3s ease;
}

.success-snackbar {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
}

.error-snackbar {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);
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
  .info-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .info-item {
    padding: 16px;
  }

  .info-value {
    font-size: 16px;
  }

  .task-chips {
    gap: 8px;
  }

  .task-chip {
    height: 44px;
    font-size: 14px;
  }

  .status-buttons {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .status-btn {
    height: 52px;
  }

  .floating-actions {
    padding: 16px;
  }

  .action-btn {
    height: 52px;
  }

  .empty-tasks,
  .empty-memo {
    padding: 30px;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 20px;
  }

  .card-header {
    padding: 16px 20px;
  }

  .card-content {
    padding: 20px;
  }

  .card-title {
    font-size: 16px;
  }

  .info-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .info-icon {
    align-self: center;
  }

  .status-label {
    font-size: 14px;
  }

  .memo-content {
    font-size: 14px;
    padding: 16px;
  }

  .dialog-header {
    padding: 16px 20px;
  }

  .dialog-title {
    font-size: 18px;
  }

  .empty-tasks,
  .empty-memo {
    padding: 20px;
  }

  .empty-text {
    font-size: 14px;
  }
}

/* 🔍 Vue 전환 애니메이션 */
.fade-stagger-enter-active {
  transition: all 0.4s ease;
}

.fade-stagger-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.fade-stagger-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.fade-stagger-leave-active {
  transition: all 0.3s ease;
}

.fade-stagger-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.fade-stagger-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* 🎨 날짜 피커 커스터마이징 */
:deep(.v-date-picker) {
  border-radius: 0;
  box-shadow: none;
}

:deep(.v-date-picker-header) {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}

:deep(.v-date-picker-header .v-btn) {
  color: white !important;
}

:deep(.v-date-picker-header .v-btn .v-btn__content) {
  color: white !important;
}

:deep(.v-date-picker-controls) {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}

:deep(.v-date-picker-controls .v-btn) {
  color: white !important;
}

:deep(.v-date-picker-controls .v-btn .v-btn__content) {
  color: white !important;
}

:deep(.v-date-picker-month) {
  border-radius: 0;
}

:deep(.v-date-picker-month .v-btn) {
  color: #1e293b !important;
}

:deep(.v-date-picker-month .v-btn .v-btn__content) {
  color: #1e293b !important;
}

:deep(.v-date-picker-month .v-btn--variant-flat) {
  color: white !important;
}

:deep(.v-date-picker-month .v-btn--variant-flat .v-btn__content) {
  color: white !important;
}
</style>
