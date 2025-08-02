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
        style="
          padding-top: 100px !important;
          padding-bottom: 140px !important;
          max-width: 800px;
        "
        v-if="!scheduleStore.isLoading && schedule"
      >
        <!-- 🏢 메인 정보 카드 -->
        <v-card class="main-info-card mb-4" elevation="2">
          <!-- 헤더: 위치 & 날짜 -->
          <div class="main-header">
            <div class="location-section">
              <div class="location-badge">
                <v-icon color="white" size="18">mdi-map-marker</v-icon>
              </div>
              <div class="location-details">
                <div class="building-name">{{ schedule?.building }}</div>
                <div class="unit-room">{{ getLocationText() }}</div>
              </div>
            </div>

            <div class="date-section">
              <div class="date-main">{{ formatDateShort(schedule?.date) }}</div>
              <div class="date-day">{{ getDateDay(schedule?.date) }}</div>
              <v-chip
                :color="getDdayColor()"
                size="small"
                class="dday-chip"
                variant="flat"
              >
                {{ getDdayText(schedule?.date) }}
              </v-chip>
            </div>
          </div>

          <!-- 콘텐츠: 작업 & 정보 -->
          <div class="main-content">
            <!-- 작업 내용 -->
            <div class="work-section">
              <div class="section-header">
                <v-icon color="primary">mdi-wrench</v-icon>
                <span class="section-title">작업 내용</span>
                <v-chip color="info" size="x-small" variant="tonal">
                  {{ schedule?.tasks?.length || 0 }}개
                </v-chip>
              </div>

              <div v-if="schedule?.tasks?.length" class="work-chips">
                <div
                  v-for="(task, i) in schedule.tasks"
                  :key="`${task.name}-${i}`"
                  class="work-chip"
                >
                  <div class="chip-icon">
                    <v-icon size="16" color="primary">mdi-tools</v-icon>
                  </div>
                  <div class="chip-content">
                    <div class="chip-name">{{ task.name }}</div>
                    <div class="chip-count">{{ task.count }}개</div>
                  </div>
                </div>
              </div>

              <div v-else class="empty-work">
                <v-icon color="grey-lighten-1" size="24"
                  >mdi-wrench-outline</v-icon
                >
                <span class="empty-text">등록된 작업이 없습니다</span>
              </div>
            </div>

            <!-- 추가 정보 -->
            <div
              class="additional-info"
              :class="{ 'single-item': !schedule?.memo }"
            >
              <!-- 세금계산서 (항상 표시) -->
              <div class="invoice-card">
                <div class="invoice-header">
                  <v-icon
                    size="18"
                    :color="schedule?.invoice ? 'green' : 'grey'"
                  >
                    {{
                      schedule?.invoice ? 'mdi-receipt' : 'mdi-receipt-outline'
                    }}
                  </v-icon>
                  <span class="invoice-title">세금계산서</span>
                </div>
                <v-chip
                  :color="schedule?.invoice ? 'success' : 'grey'"
                  size="small"
                  :variant="schedule?.invoice ? 'flat' : 'tonal'"
                  class="invoice-status"
                >
                  <v-icon start size="14">
                    {{
                      schedule?.invoice
                        ? 'mdi-check-circle'
                        : 'mdi-close-circle'
                    }}
                  </v-icon>
                  {{ schedule?.invoice ? '발행완료' : '미발행' }}
                </v-chip>
              </div>

              <!-- 메모 (있을 때만 표시) -->
              <div v-if="schedule?.memo" class="memo-card">
                <div class="memo-header">
                  <v-icon size="18" color="indigo">mdi-note-text</v-icon>
                  <span class="memo-title">메모</span>
                </div>
                <div class="memo-content">{{ schedule.memo }}</div>
              </div>
            </div>
          </div>
        </v-card>

        <!-- 📅 같은 장소의 다른 작업들 -->
        <v-card
          class="related-works-card mb-4"
          elevation="1"
          v-if="relatedWorks && relatedWorks.length > 0"
        >
          <div class="related-header">
            <div class="related-title-section">
              <div class="related-icon">
                <v-icon color="white" size="16">mdi-history</v-icon>
              </div>
              <div class="related-title">
                <div class="title-main">
                  {{ schedule?.building }} {{ getLocationText() }}
                </div>
                <div class="title-sub">이 장소의 다른 작업 내역</div>
              </div>
            </div>
            <v-chip color="amber" size="small" variant="tonal">
              {{ relatedWorks?.length || 0 }}건
            </v-chip>
          </div>

          <div class="related-content">
            <div
              v-for="(work, index) in relatedWorks"
              :key="work.id"
              class="related-item"
              @click="goToRelatedWork(work.id)"
            >
              <div class="item-number">{{ index + 1 }}</div>

              <div class="item-main">
                <div class="item-header">
                  <div class="item-date">
                    <v-icon size="12" color="blue-grey">mdi-calendar</v-icon>
                    {{ formatDateShort(work.date) }}
                  </div>
                  <v-chip
                    :color="getStatusColor(work.status)"
                    size="x-small"
                    variant="flat"
                  >
                    {{ work.status }}
                  </v-chip>
                </div>

                <div class="item-tasks">
                  <div class="task-preview">
                    <span
                      v-for="(task, i) in (work.tasks || []).slice(0, 3)"
                      :key="i"
                      class="task-name"
                    >
                      {{ task.name
                      }}<span
                        v-if="i < Math.min((work.tasks || []).length, 3) - 1"
                        >,
                      </span>
                    </span>
                    <span
                      v-if="work.tasks && work.tasks.length > 3"
                      class="more-indicator"
                    >
                      외 {{ work.tasks.length - 3 }}건
                    </span>
                  </div>
                </div>
              </div>

              <div class="item-arrow">
                <v-icon size="16" color="grey">mdi-chevron-right</v-icon>
              </div>
            </div>
          </div>
        </v-card>

        <!-- 리스트가 비어있을 때 메시지 -->
        <v-card class="no-related-card mb-4" elevation="0" v-else>
          <div class="no-related-content">
            <v-icon size="32" color="grey-lighten-2">mdi-history</v-icon>
            <div class="no-related-text">
              <div class="no-related-title">
                {{ schedule?.building }} {{ getLocationText() }}
              </div>
              <div class="no-related-sub">
                이 장소의 다른 작업 내역이 없습니다
              </div>
            </div>
          </div>
        </v-card>

        <!-- 🔄 상태 관리 카드 -->
        <v-card class="status-management-card mb-4" elevation="1">
          <div class="status-header">
            <div class="status-title-section">
              <div class="status-icon">
                <v-icon color="white" size="16">mdi-flag</v-icon>
              </div>
              <div class="status-title">상태 관리</div>
            </div>
            <div class="current-status">
              <span class="current-label">현재 상태</span>
              <v-chip
                :color="getStatusColor(schedule?.status)"
                size="small"
                variant="flat"
              >
                <v-icon start size="14">{{
                  getStatusIcon(schedule?.status)
                }}</v-icon>
                {{ schedule?.status }}
              </v-chip>
            </div>
          </div>

          <div class="status-content">
            <div class="status-change-section">
              <div class="change-label">상태 변경</div>
              <div class="status-buttons">
                <v-btn
                  v-for="s in statusOptions"
                  :key="s"
                  :variant="schedule.status === s ? 'flat' : 'outlined'"
                  :color="getStatusColor(s)"
                  class="status-btn"
                  size="default"
                  @click="updateStatus(s)"
                  :loading="scheduleStore.isLoading && schedule.status !== s"
                  :disabled="schedule.status === s"
                >
                  <v-icon start size="16">{{ getStatusIcon(s) }}</v-icon>
                  {{ s }}
                </v-btn>
              </div>
            </div>

            <!-- 보류 시 날짜 변경 -->
            <v-expand-transition>
              <div
                v-if="schedule.status === '보류'"
                class="date-reschedule-section"
              >
                <div class="reschedule-header">
                  <v-icon color="warning" size="18">mdi-calendar-edit</v-icon>
                  <span class="reschedule-title">일정 재조정</span>
                </div>
                <v-text-field
                  v-model="displayDate"
                  label="새로운 작업 날짜 선택"
                  variant="outlined"
                  density="comfortable"
                  readonly
                  prepend-inner-icon="mdi-calendar"
                  append-inner-icon="mdi-chevron-down"
                  @click="pickerOpen = true"
                  class="reschedule-input"
                />
              </div>
            </v-expand-transition>
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
          <v-col cols="3">
            <v-btn
              variant="outlined"
              size="large"
              block
              class="action-btn back-btn"
              @click="goBack"
            >
              <v-icon start>mdi-arrow-left</v-icon>
              뒤로
            </v-btn>
          </v-col>
          <v-col cols="3">
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
          <v-col cols="3">
            <v-btn
              color="success"
              size="large"
              block
              class="action-btn add-more-btn"
              @click="addMoreWork"
            >
              <v-icon start>mdi-plus</v-icon>
              추가작업
            </v-btn>
          </v-col>
          <v-col cols="3">
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
import { getTodayDateKST } from '@/utils/date.js'

const route = useRoute()
const router = useRouter()
const scheduleStore = useScheduleStore()
const { selectedSchedule: schedule } = storeToRefs(scheduleStore)
const uiStore = useUiStore()

const newDate = ref('')
const displayDate = ref('')
const pickerOpen = ref(false)
const statusOptions = ['진행', '보류', '완료']
const today = getTodayDateKST()
const relatedWorks = ref([])

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

const formatDateShort = (dateStr) => {
  if (!dateStr) return '-'
  return dateStr.split('-').slice(1).join('.') // MM.DD 형식
}

const getDateDay = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', { weekday: 'short' })
}

const getDdayText = (dateStr) => {
  if (!dateStr) return ''
  const today = getTodayDateKST()
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

const getDdayColor = () => {
  if (!schedule.value?.date) return 'grey'
  const diffDays = Math.ceil(
    (new Date(schedule.value.date) - new Date(getTodayDateKST())) /
      (1000 * 60 * 60 * 24)
  )
  if (diffDays === 0) return 'warning'
  if (diffDays < 0) return 'error'
  if (diffDays === 1) return 'orange'
  return 'info'
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
  let currentSchedule = scheduleStore.getScheduleById(id)

  // 스케줄이 스토어에 없으면 개별 조회 대신 전체 스케줄을 먼저 로드해보기
  if (!currentSchedule) {
    try {
      await scheduleStore.fetchAllSchedules()
      currentSchedule = scheduleStore.getScheduleById(id)
    } catch (error) {
      console.error('스케줄 로드 오류:', error)
      // 전체 로드가 실패하면 개별 조회 시도
      try {
        await scheduleStore.fetchScheduleById(id)
        currentSchedule = scheduleStore.getScheduleById(id)
      } catch (individualError) {
        console.error('개별 스케줄 로드 오류:', individualError)
        uiStore.showSnackbar('작업 정보를 불러올 수 없습니다.', 'error')
        router.back()
        return
      }
    }
  }

  if (currentSchedule) {
    scheduleStore.setSelectedSchedule(currentSchedule)
    // 같은 장소의 다른 작업들 로드 (이미 전체 스케줄이 로드되어 있으므로 추가 fetch 불필요)
    await loadRelatedWorks(currentSchedule)
  } else {
    uiStore.showSnackbar('해당 작업을 찾을 수 없습니다.', 'error')
    router.back()
  }
})

// 같은 장소의 다른 작업들 로드
async function loadRelatedWorks(currentSchedule) {
  try {
    console.log('=== 관련 작업 로드 시작 ===')
    console.log('현재 스케줄 전체 정보:', currentSchedule)

    if (!currentSchedule) {
      console.log('❌ 현재 스케줄이 없음')
      relatedWorks.value = []
      return
    }

    // 현재 작업의 위치 정보
    const currentBuilding = currentSchedule.building || ''
    const currentUnit = currentSchedule.unit || ''
    const currentRoom = currentSchedule.room || ''

    console.log('현재 작업 위치 정보:', {
      building: currentBuilding,
      unit: currentUnit,
      room: currentRoom,
      id: currentSchedule.id,
    })

    // 전체 스케줄 로드
    await scheduleStore.fetchAllSchedules()
    const allSchedules = scheduleStore.schedules || []
    console.log('전체 스케줄 수:', allSchedules.length)

    if (allSchedules.length === 0) {
      console.log('❌ 로드된 스케줄이 없음')
      relatedWorks.value = []
      return
    }

    console.log('전체 스케줄 리스트:')
    allSchedules.forEach((schedule) => {
      console.log(
        `- ID: ${schedule.id}, 건물: "${schedule.building}", 동: "${schedule.unit || ''}", 호: "${schedule.room || ''}", 날짜: ${schedule.date}`
      )
    })

    // 필터링 시작
    console.log('\\n=== 필터링 시작 ===')
    const filteredWorks = []

    for (const work of allSchedules) {
      // 자기 자신 제외
      if (work.id === currentSchedule.id) {
        console.log(`⏭️ 자기 자신 제외: ${work.id}`)
        continue
      }

      // 취소된 작업 제외
      if (work.status === '취소됨') {
        console.log(`⏭️ 취소된 작업 제외: ${work.id}`)
        continue
      }

      // 건물 비교
      const workBuilding = work.building || ''
      const workUnit = work.unit || ''
      const workRoom = work.room || ''

      const buildingMatch = workBuilding === currentBuilding
      const unitMatch = workUnit === currentUnit
      const roomMatch = workRoom === currentRoom

      console.log(`작업 ${work.id} 비교:`)
      console.log(
        `  건물: "${workBuilding}" === "${currentBuilding}" → ${buildingMatch}`
      )
      console.log(`  동: "${workUnit}" === "${currentUnit}" → ${unitMatch}`)
      console.log(`  호: "${workRoom}" === "${currentRoom}" → ${roomMatch}`)

      const isMatch = buildingMatch && unitMatch && roomMatch
      console.log(`  최종 매치: ${isMatch}`)

      if (isMatch) {
        filteredWorks.push(work)
        console.log(`✅ 매치된 작업 추가: ${work.id}`)
      }
    }

    console.log('\\n=== 필터링 결과 ===')
    console.log('매치된 작업 수:', filteredWorks.length)

    // 날짜순 정렬하고 최대 5개만
    relatedWorks.value = filteredWorks
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)

    console.log('최종 관련 작업들:')
    relatedWorks.value.forEach((work) => {
      console.log(
        `- ${work.id}: ${work.building} ${work.unit || ''}동 ${work.room || ''}호 (${work.date})`
      )
    })
  } catch (error) {
    console.error('❌ 관련 작업 로드 실패:', error)
    relatedWorks.value = []
  }
}

// 관련 작업으로 이동
function goToRelatedWork(workId) {
  console.log('관련 작업 클릭:', workId)
  router.push(`/schedule/${workId}?from=${route.query.from || 'schedules'}`)
}

watch(schedule, (newVal) => {
  if (newVal) {
    displayDate.value = newVal.date
  }
})

// route 파라미터 변화 감지
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      console.log('Route ID 변경됨:', oldId, '->', newId)

      // 새로운 스케줄 로드
      let currentSchedule = scheduleStore.getScheduleById(newId)

      if (!currentSchedule) {
        try {
          await scheduleStore.fetchAllSchedules()
          currentSchedule = scheduleStore.getScheduleById(newId)
        } catch (error) {
          console.error('스케줄 로드 오류:', error)
          try {
            await scheduleStore.fetchScheduleById(newId)
            currentSchedule = scheduleStore.getScheduleById(newId)
          } catch (individualError) {
            console.error('개별 스케줄 로드 오류:', individualError)
            uiStore.showSnackbar('작업 정보를 불러올 수 없습니다.', 'error')
            return
          }
        }
      }

      if (currentSchedule) {
        scheduleStore.setSelectedSchedule(currentSchedule)
        await loadRelatedWorks(currentSchedule)
      }
    }
  },
  { immediate: false }
)

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
  router.push(
    `/schedule/${schedule.value.id}/edit?originalFrom=${originalFrom}`
  )
}

function goBack() {
  const fromPage = route.query.from

  if (fromPage === 'home') {
    router.push('/')
  } else {
    router.push('/schedules')
  }
}

// 🚀 새로 추가: 추가 작업 등록 함수
function addMoreWork() {
  if (!schedule.value) return

  // 현재 스케줄 정보를 쿼리 파라미터로 전달 (날짜는 오늘로 설정)
  const queryParams = {
    building: schedule.value.building,
    unit: schedule.value.unit || '',
    room: schedule.value.room || '',
    date: today,
    from: 'detail',
  }

  router.push({
    path: '/add',
    query: queryParams,
  })
}
</script>

<style scoped>
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
}

/* 🏢 메인 정보 카드 */
.main-info-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.main-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.location-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.location-badge {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.location-details {
  display: flex;
  flex-direction: column;
}

.building-name {
  font-size: 18px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
}

.unit-room {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
}

.date-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.date-main {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.date-day {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.dday-chip {
  font-weight: 600;
  font-size: 11px;
}

/* 메인 콘텐츠 */
.main-content {
  padding: 16px 20px 12px 20px;
}

.work-section {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.work-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.work-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 180px;
  max-width: 280px;
}

.work-chip:hover {
  border-color: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
}

.chip-icon {
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.chip-content {
  flex: 1;
}

.chip-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
}

.chip-count {
  font-size: 12px;
  color: #64748b;
}

.empty-work {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px;
  color: #94a3b8;
  text-align: center;
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
}

/* 추가 정보 */
.additional-info {
  display: flex;
  gap: 12px;
  align-items: stretch;
  margin-top: 12px;
}

.memo-card {
  flex: 2;
  min-width: 0;
}

.invoice-card {
  flex: 1;
  min-width: 140px;
}

.additional-info.single-item .invoice-card {
  flex: none;
  width: fit-content;
  max-width: 200px;
}

.memo-card,
.invoice-card {
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  border-left: 3px solid;
}

.memo-card {
  border-left-color: #6366f1;
}

.invoice-card {
  border-left-color: #10b981;
}

.memo-header,
.invoice-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.memo-title,
.invoice-title {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.memo-content {
  font-size: 14px;
  color: #1e293b;
  line-height: 1.5;
}

.invoice-status {
  font-weight: 600;
}

/* 관련 작업들 카드 */
.related-works-card,
.no-related-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.related-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.related-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.related-icon {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.related-title {
  display: flex;
  flex-direction: column;
}

.title-main {
  font-size: 14px;
  font-weight: 700;
  color: white;
}

.title-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 1px;
}

.related-content {
  padding: 16px 20px;
  max-height: 280px;
  overflow-y: auto;
}

.related-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  user-select: none;
}

.related-item:hover {
  background: white;
  border-color: #f59e0b;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.related-item:active {
  transform: translateX(2px) scale(0.98);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

.item-number {
  width: 24px;
  height: 24px;
  background: #f59e0b;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.item-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.item-tasks {
  display: flex;
  align-items: center;
}

.task-preview {
  font-size: 13px;
  color: #475569;
  line-height: 1.2;
}

.task-name {
  font-weight: 500;
}

.more-indicator {
  color: #94a3b8;
  font-size: 12px;
  margin-left: 4px;
}

.item-arrow {
  flex-shrink: 0;
  opacity: 0.5;
  transition: all 0.2s ease;
}

.related-item:hover .item-arrow {
  opacity: 1;
  transform: translateX(2px);
}

/* 빈 상태 카드 */
.no-related-card {
  background: #fafafa;
  border: 2px dashed #e2e8f0;
}

.no-related-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px;
  text-align: center;
}

.no-related-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.no-related-title {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
}

.no-related-sub {
  font-size: 12px;
  color: #94a3b8;
}

/* 상태 관리 카드 */
.status-management-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.status-title-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-icon {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-title {
  font-size: 14px;
  font-weight: 700;
  color: white;
}

.current-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.current-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.status-content {
  padding: 20px;
}

.status-change-section {
  margin-bottom: 20px;
}

.change-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.status-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.status-btn {
  height: 44px;
  min-width: 100px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.2s ease;
}

.status-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.date-reschedule-section {
  border-top: 2px solid #f1f5f9;
  padding-top: 16px;
  margin-top: 16px;
}

.reschedule-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.reschedule-title {
  font-size: 14px;
  font-weight: 600;
  color: #d97706;
}

.reschedule-input {
  margin-top: 8px;
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

/* 🚀 새로 추가: 추가 작업 버튼 스타일 */
.add-more-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.add-more-btn:hover {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
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
  .main-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .date-section {
    align-items: center;
  }

  .additional-info {
    flex-direction: column;
    gap: 12px;
  }

  .additional-info.single-item {
    flex-direction: row;
  }

  .additional-info.single-item .invoice-card {
    width: 100%;
    max-width: none;
  }

  .work-chips {
    flex-direction: column;
  }

  .work-chip {
    max-width: none;
  }

  .status-buttons {
    flex-direction: column;
  }

  .status-btn {
    width: 100%;
  }

  .related-item {
    padding: 8px;
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
