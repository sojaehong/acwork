<template>
  <v-card
    class="task-card"
    :class="statusClass"
    elevation="0"
    @click="$emit('click')"
  >
    <div class="card-content-wrapper">
      <!-- 카드 헤더: 건물 정보 + 상태 -->
      <div class="card-header">
        <div class="building-info">
          <v-icon class="building-icon" color="primary"
            >mdi-office-building-outline</v-icon
          >
          <div class="building-text">
            <h4 class="building-name">{{ item.building }}</h4>
            <div class="unit-info">
              <span v-if="item.unit">{{ item.unit }}동</span>
              <span v-if="item.room" class="room-number"
                >{{ item.room }}호</span
              >
            </div>
          </div>
        </div>

        <!-- 상태 뱃지들 - 항상 오른쪽에 가로로 배치 -->
        <div class="status-badges">
          <!-- 긴급도 뱃지 -->
          <v-chip
            v-if="urgencyInfo.label && urgencyInfo.priority <= 4"
            :color="urgencyInfo.color"
            :size="props.badgeSize"
            :variant="urgencyInfo.variant"
            class="urgency-chip"
          >
            <v-icon :start="!props.isMobile" :size="props.iconSize">{{
              urgencyInfo.icon
            }}</v-icon>
            <span v-if="!props.isMobile">{{ urgencyInfo.label }}</span>
            <span v-else class="mobile-urgency-text">{{
              urgencyInfo.label
            }}</span>
          </v-chip>

          <!-- 상태 뱃지 -->
          <v-chip
            :color="statusInfo.color"
            :size="props.badgeSize"
            :variant="statusInfo.variant || 'flat'"
            class="status-chip"
          >
            <v-icon :start="!props.isMobile" :size="props.iconSize">{{
              statusInfo.icon
            }}</v-icon>
            <span v-if="!props.isMobile">{{ statusInfo.shortStatus }}</span>
            <span v-else class="mobile-status-text">{{
              statusInfo.shortStatus
            }}</span>
          </v-chip>

          <!-- 복잡도 뱃지 -->
          <v-chip
            v-if="complexityInfo.level > 1"
            :color="complexityInfo.color"
            :size="props.badgeSize"
            variant="outlined"
            class="complexity-chip"
          >
            <v-icon :start="!props.isMobile" :size="props.iconSize">{{
              complexityInfo.icon
            }}</v-icon>
            <span v-if="!props.isMobile">{{ complexityInfo.label }}</span>
          </v-chip>

          <!-- 세금계산서 뱃지 -->
          <v-chip
            :color="item.invoice ? 'blue' : 'grey-lighten-2'"
            :size="props.badgeSize"
            variant="flat"
            class="invoice-chip"
          >
            <v-icon :start="!props.isMobile" :size="props.iconSize">{{
              item.invoice ? 'mdi-receipt' : 'mdi-receipt-outline'
            }}</v-icon>
            <span v-if="!props.isMobile">{{
              item.invoice ? '계산서' : '미발행'
            }}</span>
            <span v-else class="mobile-invoice-text">{{
              item.invoice ? '계산서' : '미발행'
            }}</span>
          </v-chip>
        </div>
      </div>

      <v-divider class="my-3"></v-divider>

      <!-- 카드 본문: 작업 내용 + 메모 -->
      <div class="card-body">
        <!-- 작업 내용 -->
        <div class="info-row" v-if="item.tasks && item.tasks.length">
          <v-icon class="info-icon" size="18">mdi-format-list-checks</v-icon>
          <div class="task-chips">
            <v-chip
              v-for="(task, i) in item.tasks"
              :key="`${task.name}-${task.count}-${i}`"
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
          <v-icon class="info-icon" size="18">mdi-note-text-outline</v-icon>
          <p class="memo-text">{{ item.memo }}</p>
        </div>
      </div>
    </div>

    <!-- 호버 인디케이터 -->
    <div class="hover-indicator">
      <v-icon>mdi-chevron-right</v-icon>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import {
  enrichScheduleData,
  calculateProgress,
  calculateUrgency,
  calculateComplexity,
  URGENCY_CONFIG,
  COMPLEXITY_CONFIG,
} from '@/utils/statusUtils'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  // 🚀 최적화: 외부에서 반응형 상태를 주입받아 성능 향상
  isMobile: {
    type: Boolean,
    default: false,
  },
  badgeSize: {
    type: String,
    default: 'small',
  },
  iconSize: {
    type: String,
    default: '14',
  },
})

defineEmits(['click'])

// 🚀 통합 작업 정보 계산
const enrichedItem = computed(() => {
  try {
    return enrichScheduleData(props.item)
  } catch (err) {
    console.error('작업 정보 계산 오류:', err)
    // fallback
    return {
      ...props.item,
      statusInfo: {
        displayStatus: props.item.status,
        color: 'grey',
        icon: 'mdi-help-circle',
        shortStatus: props.item.status,
        statusClass: 'status-unknown',
        variant: 'outlined',
      },
      urgencyInfo: {
        label: '',
        priority: 7,
        color: 'transparent',
        icon: '',
        variant: 'text',
      },
      progress: 0,
      complexityInfo: {
        label: '보통',
        color: 'warning',
        icon: 'mdi-circle-double',
        level: 2,
      },
    }
  }
})

// 🚀 개별 정보 추출
const statusInfo = computed(() => enrichedItem.value.statusInfo)
const urgencyInfo = computed(() => enrichedItem.value.urgencyInfo)
const complexityInfo = computed(() => enrichedItem.value.complexityInfo)

// 🚀 카드 스타일 클래스
const statusClass = computed(() => {
  const classes = [statusInfo.value.statusClass]

  // 긴급도에 따른 추가 클래스
  if (urgencyInfo.value.priority <= 2) {
    classes.push('card-urgent')
  } else if (urgencyInfo.value.priority <= 4) {
    classes.push('card-soon')
  }

  return classes.join(' ')
})
</script>

<style scoped>
.task-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
}

.task-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.15);
  border-color: #4f46e5;
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
  min-height: 44px; /* 최소 높이 보장 */
}

.building-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0; /* flex 아이템 축소 허용 */
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

/* 상태 뱃지들 - 항상 가로로 나란히 오른쪽 끝에 */
.status-badges {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  flex-shrink: 0; /* 절대 축소되지 않음 */
  margin-top: 2px;
  flex-wrap: wrap;
}

.status-chip,
.invoice-chip,
.urgency-chip,
.complexity-chip {
  font-weight: 600;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.urgency-chip {
  animation: urgent-pulse 2s infinite;
}

@keyframes urgent-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.mobile-status-text,
.mobile-invoice-text,
.mobile-urgency-text {
  font-size: 11px;
  font-weight: 600;
}

/* 카드 긴급도별 스타일 */
.card-urgent {
  border-left: 4px solid #ef4444;
  background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
}

.card-urgent:hover {
  box-shadow: 0 12px 24px rgba(239, 68, 68, 0.2);
}

.card-soon {
  border-left: 4px solid #f59e0b;
  background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
}

.card-soon:hover {
  box-shadow: 0 12px 24px rgba(245, 158, 11, 0.2);
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

.hover-indicator {
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

.task-card:hover .hover-indicator {
  opacity: 1;
  right: 16px;
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .task-card:hover {
    transform: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .hover-indicator {
    display: none !important;
  }
}

/* 태블릿 크기 (768px 이하) */
@media (max-width: 768px) {
  .task-card {
    padding: 16px;
  }

  .building-name {
    font-size: 16px;
  }

  .card-header {
    gap: 12px;
  }

  .status-badges {
    gap: 3px;
  }

  .hover-indicator {
    display: none;
  }

  /* 긴급 애니메이션 줄이기 */
  .urgency-chip {
    animation: none;
  }
}

/* 모바일 크기 (480px 이하) */
@media (max-width: 480px) {
  .task-card {
    padding: 14px;
  }

  .building-name {
    font-size: 15px;
  }

  .building-icon {
    font-size: 24px !important;
  }

  .card-header {
    gap: 8px;
    min-height: 40px;
  }

  .building-info {
    gap: 10px;
  }

  .status-badges {
    gap: 2px;
    margin-top: 0;
  }

  .unit-info {
    font-size: 13px;
  }

  .room-number {
    font-size: 12px;
    padding: 1px 6px;
  }

  .mobile-status-text,
  .mobile-invoice-text,
  .mobile-urgency-text {
    font-size: 10px;
  }
}

/* 아주 작은 화면 (360px 이하) */
@media (max-width: 360px) {
  .building-name {
    font-size: 14px;
  }

  .status-badges {
    gap: 2px;
  }

  .mobile-status-text,
  .mobile-invoice-text,
  .mobile-urgency-text {
    font-size: 9px;
  }

  .task-chip {
    font-size: 11px;
  }

  .memo-text {
    font-size: 13px;
  }
}
</style>
