<template>
  <div class="date-section mb-10">
    <!-- 강화된 날짜 헤더 -->
    <div class="enhanced-date-header">
      <div class="date-header-main">
        <div class="date-icon">
          <v-icon color="white" size="24">mdi-calendar</v-icon>
        </div>
        <div class="date-info">
          <h3 class="date-title">{{ formattedDate }}</h3>
          <div class="date-meta">
            <span class="date-count">{{ items.length }}건의 작업</span>
            <span class="date-separator">•</span>
            <span class="date-badge">{{ ddayText }}</span>
          </div>
        </div>
      </div>
      <div class="date-line"></div>
    </div>

    <!-- 작업 카드들 컨테이너 -->
    <div class="schedule-cards-container">
      <div class="schedule-grid">
        <v-card
          v-for="item in items"
          :key="item.id"
          class="schedule-card"
          elevation="0"
          @click="handleItemClick(item.id)"
          tabindex="0"
          role="button"
          :aria-label="`${item.building} ${item.room}호 작업 상세보기`"
        >
          <div class="card-content-wrapper">
            <!-- 카드 헤더: 건물 정보 + 상태 -->
            <div class="card-header">
              <div class="building-info">
                <v-icon class="building-icon" color="primary">
                  mdi-office-building-outline
                </v-icon>
                <div class="building-text">
                  <h4 class="building-name">{{ item.building }}</h4>
                  <div class="unit-info">
                    <span v-if="item.unit">{{ item.unit }}동</span>
                    <span v-if="item.room" class="room-number">
                      {{ item.room }}호
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- 상태 뱃지들 -->
              <div class="status-badges">
                <v-chip
                  :color="getStatusColor(item)"
                  :size="badgeSize"
                  variant="flat"
                  class="status-chip"
                >
                  <v-icon :start="!isMobile" :size="iconSize">
                    {{ getStatusIcon(item) }}
                  </v-icon>
                  <span v-if="!isMobile">{{ getStatusText(item) }}</span>
                  <span v-else class="mobile-status-text">
                    {{ getShortStatus(getStatusText(item)) }}
                  </span>
                </v-chip>
                <v-chip
                  :color="item.invoice ? 'blue' : 'grey-lighten-2'"
                  :size="badgeSize"
                  variant="flat"
                  class="invoice-chip"
                >
                  <v-icon :start="!isMobile" :size="iconSize">
                    {{ item.invoice ? 'mdi-receipt' : 'mdi-receipt-outline' }}
                  </v-icon>
                  <span v-if="!isMobile">
                    {{ item.invoice ? '계산서' : '미발행' }}
                  </span>
                  <span v-else class="mobile-invoice-text">
                    {{ item.invoice ? '계산서' : '미발행' }}
                  </span>
                </v-chip>
              </div>
            </div>

            <v-divider class="my-3"></v-divider>

            <!-- 카드 본문: 작업 내용 + 메모 -->
            <div class="card-body">
              <!-- 작업 내용 -->
              <div class="info-row" v-if="item.tasks?.length">
                <v-icon class="info-icon" size="18">
                  mdi-format-list-checks
                </v-icon>
                <div class="task-chips">
                  <v-chip
                    v-for="(task, i) in item.tasks"
                    :key="`${task.name}-${i}`"
                    size="small"
                    variant="tonal"
                    color="secondary"
                    class="task-chip"
                  >
                    {{ task.name }} ({{ task.count }})
                  </v-chip>
                </div>
              </div>

              <!-- 메모 -->
              <div class="info-row" v-if="item.memo">
                <v-icon class="info-icon" size="18">
                  mdi-note-text-outline
                </v-icon>
                <p class="memo-text">{{ item.memo }}</p>
              </div>
            </div>
          </div>

          <!-- 카드 호버 인디케이터 -->
          <div class="card-hover-indicator">
            <v-icon>mdi-chevron-right</v-icon>
          </div>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getTodayDateKST } from '@/utils/date.js'

const props = defineProps({
  date: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    required: true,
    default: () => []
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  badgeSize: {
    type: String,
    default: 'small'
  },
  iconSize: {
    type: String,
    default: '14'
  }
})

const emit = defineEmits(['item-click'])

// 날짜 포맷팅
const formattedDate = computed(() => {
  try {
    const date = new Date(props.date)
    const day = date.toLocaleDateString('ko-KR', { weekday: 'short' })
    return `${props.date} (${day})`
  } catch (err) {
    return props.date
  }
})

// D-day 계산
const ddayText = computed(() => {
  try {
    const today = getTodayDateKST()
    const targetDate = new Date(props.date)
    const todayDate = new Date(today)
    const diffTime = targetDate - todayDate
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '내일'
    if (diffDays === -1) return '어제'
    if (diffDays > 0) return `D-${diffDays}`
    return `D+${Math.abs(diffDays)}`
  } catch (err) {
    return ''
  }
})

// 상태 관련 함수들
const getStatusColor = (item) => {
  try {
    const today = getTodayDateKST()
    if (item.status === '진행') {
      if (item.date === today) return 'orange'
      if (item.date > today) return 'purple'
    }
    switch (item.status) {
      case '완료': return 'green'
      case '보류': return 'red'
      default: return 'grey'
    }
  } catch (err) {
    return 'grey'
  }
}

const getStatusText = (item) => {
  try {
    const today = getTodayDateKST()
    if (item.status === '진행') {
      if (item.date === today) return '진행'
      if (item.date > today) return '예정'
    }
    return item.status
  } catch (err) {
    return item.status || '알 수 없음'
  }
}

const getStatusIcon = (item) => {
  try {
    const today = getTodayDateKST()
    if (item.status === '진행') {
      if (item.date === today) return 'mdi-play-circle'
      if (item.date > today) return 'mdi-clock-outline'
    }
    switch (item.status) {
      case '완료': return 'mdi-check-circle'
      case '보류': return 'mdi-pause-circle'
      default: return 'mdi-help-circle'
    }
  } catch (err) {
    return 'mdi-help-circle'
  }
}

const getShortStatus = (status) => {
  switch (status) {
    case '진행': return '진행'
    case '완료': return '완료'
    case '보류': return '보류'
    case '예정': return '예정'
    case '취소됨': return '취소'
    default: return status
  }
}

// 이벤트 핸들러
const handleItemClick = (id) => {
  emit('item-click', id)
}
</script>

<style scoped>
.date-section {
  margin-bottom: 40px;
  contain: layout style;
}

.enhanced-date-header {
  position: relative;
  margin-bottom: 32px;
}

.date-header-main {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  padding: 24px 32px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(79, 70, 229, 0.2);
  position: relative;
  z-index: 2;
}

.date-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.date-info {
  flex: 1;
  color: white;
}

.date-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.date-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.date-count {
  font-weight: 600;
}

.date-separator {
  opacity: 0.6;
}

.date-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 12px;
  backdrop-filter: blur(5px);
}

.date-line {
  position: absolute;
  top: 50%;
  left: 24px;
  right: 24px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.3), transparent);
  z-index: 1;
}

.schedule-cards-container {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.schedule-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  will-change: transform;
}

.schedule-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.15);
  border-color: #4f46e5;
}

.schedule-card:focus {
  outline: 3px solid rgba(79, 70, 229, 0.3);
  outline-offset: 2px;
}

.card-content-wrapper {
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  min-height: 44px;
}

.building-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.building-icon {
  font-size: 28px !important;
  flex-shrink: 0;
  margin-top: 2px;
}

.building-text {
  flex: 1;
  min-width: 0;
}

.building-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unit-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
  flex-wrap: wrap;
}

.room-number {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.status-badges {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex-shrink: 0;
  margin-top: 2px;
}

.status-chip,
.invoice-chip {
  font-weight: 600;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mobile-status-text,
.mobile-invoice-text {
  font-size: 11px;
  font-weight: 600;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-icon {
  color: #94a3b8;
  margin-top: 3px;
  flex-shrink: 0;
}

.task-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.task-chip {
  font-weight: 500;
}

.memo-text {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
  flex: 1;
  word-break: keep-all;
}

.card-hover-indicator {
  position: absolute;
  top: 50%;
  right: -20px;
  transform: translateY(-50%);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  color: white;
  background: #4f46e5;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.schedule-card:hover .card-hover-indicator {
  opacity: 1;
  right: 16px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .schedule-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .date-header-main {
    padding: 20px 24px;
    gap: 16px;
  }

  .date-icon {
    width: 48px;
    height: 48px;
  }

  .date-title {
    font-size: 20px;
  }

  .schedule-cards-container {
    padding: 20px;
  }

  .card-header {
    gap: 12px;
  }

  .status-badges {
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .date-header-main {
    padding: 16px 20px;
    gap: 12px;
  }

  .date-icon {
    width: 40px;
    height: 40px;
  }

  .date-title {
    font-size: 18px;
  }

  .building-name {
    font-size: 16px;
  }

  .schedule-card {
    padding: 16px;
  }

  .schedule-cards-container {
    padding: 16px;
  }

  .card-header {
    gap: 8px;
    min-height: 40px;
  }

  .building-info {
    gap: 10px;
  }

  .status-badges {
    gap: 3px;
    margin-top: 0;
  }

  .mobile-status-text,
  .mobile-invoice-text {
    font-size: 10px;
  }

  .card-hover-indicator {
    display: none;
  }
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .schedule-card:hover {
    transform: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .card-hover-indicator {
    display: none !important;
  }
}

/* 애니메이션 줄임 설정 */
@media (prefers-reduced-motion: reduce) {
  .schedule-card {
    transition: none;
  }
  
  .schedule-card:hover {
    transform: none;
  }
  
  .card-hover-indicator {
    transition: none;
  }
}
</style>