<template>
  <v-card
    class="task-card"
    :class="statusClass"
    elevation="0"
    @click="$emit('click')"
  >
    <!-- 카드 헤더 -->
    <div class="card-header">
      <div class="building-info">
        <h4 class="building-name">
          <v-icon size="16" color="primary" class="mr-1">mdi-office-building</v-icon>
          {{ item.building }}
        </h4>
        <div class="unit-info">
          <span v-if="item.unit" class="unit-badge">{{ item.unit }}동</span>
          <span v-if="item.room" class="room-badge">{{ item.room }}호</span>
        </div>
      </div>
      
      <div class="status-badges">
        <v-chip 
          :color="statusColor" 
          size="small" 
          variant="flat"
          class="status-chip"
        >
          <v-icon start size="14">{{ statusIcon }}</v-icon>
          {{ displayStatus }}
        </v-chip>
        <v-chip 
          :color="item.invoice ? 'blue' : 'grey-lighten-2'" 
          size="small" 
          variant="flat"
          class="invoice-chip"
        >
          <v-icon start size="14">{{ item.invoice ? 'mdi-receipt' : 'mdi-receipt-outline' }}</v-icon>
          {{ item.invoice ? '계산서' : '미발행' }}
        </v-chip>
      </div>
    </div>

    <!-- 작업 내용 섹션 -->
    <div class="task-section" v-if="item.tasks && item.tasks.length">
      <div class="section-label">
        <v-icon size="16" color="grey-darken-1">mdi-wrench</v-icon>
        <span>작업 내용</span>
      </div>
      <div class="task-chips">
        <v-chip
          v-for="(task, i) in item.tasks"
          :key="`${task.name}-${task.count}-${i}`"
          size="small"
          variant="tonal"
          color="secondary"
          class="task-chip"
        >
          <v-icon start size="12">mdi-tools</v-icon>
          {{ task.name }} ({{ task.count }})
        </v-chip>
      </div>
    </div>

    <!-- 작업 내용이 없는 경우 -->
    <div v-else class="task-section">
      <div class="section-label">
        <v-icon size="16" color="grey-darken-1">mdi-wrench</v-icon>
        <span>작업 내용</span>
      </div>
      <div class="empty-task">
        <v-icon size="16" color="grey-lighten-1">mdi-minus</v-icon>
        <span>등록된 작업이 없습니다</span>
      </div>
    </div>

    <!-- 메모 섹션 -->
    <div v-if="item.memo" class="memo-section">
      <div class="section-label">
        <v-icon size="16" color="grey-darken-1">mdi-note-text</v-icon>
        <span>메모</span>
      </div>
      <div class="memo-content">{{ item.memo }}</div>
    </div>

    <!-- 상태 인디케이터 바 -->
    <div class="status-indicator" :class="statusIndicatorClass"></div>

    <!-- 호버 인디케이터 -->
    <div class="hover-indicator">
      <v-icon color="primary">mdi-chevron-right</v-icon>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

// 한국 KST 기준 오늘 날짜 계산
function getTodayKST() {
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000
  const kst = new Date(now.getTime() + kstOffset)
  return kst.toISOString().split('T')[0]
}

const todayStr = getTodayKST()

// displayStatus: '예정' 적용 로직 포함
const displayStatus = computed(() => {
  if (props.item.status === '진행' && props.item.date > todayStr) {
    return '예정'
  }
  return props.item.status
})

// 상태별 색상 적용
const statusColor = computed(() => {
  switch (displayStatus.value) {
    case '완료': return 'success'
    case '보류': return 'error'
    case '진행': return 'warning'
    case '예정': return 'purple'
    case '취소됨': return 'grey'
    default: return 'grey'
  }
})

// 상태별 아이콘
const statusIcon = computed(() => {
  switch (displayStatus.value) {
    case '완료': return 'mdi-check-circle'
    case '보류': return 'mdi-pause-circle'
    case '진행': return 'mdi-play-circle'
    case '예정': return 'mdi-clock-outline'
    case '취소됨': return 'mdi-cancel'
    default: return 'mdi-help-circle'
  }
})

// 상태별 카드 클래스
const statusClass = computed(() => {
  switch (displayStatus.value) {
    case '완료': return 'status-complete'
    case '보류': return 'status-hold'
    case '진행': return 'status-active'
    case '예정': return 'status-planned'
    case '취소됨': return 'status-canceled'
    default: return 'status-default'
  }
})

// 상태 인디케이터 클래스
const statusIndicatorClass = computed(() => {
  switch (displayStatus.value) {
    case '완료': return 'indicator-complete'
    case '보류': return 'indicator-hold'
    case '진행': return 'indicator-active'
    case '예정': return 'indicator-planned'
    case '취소됨': return 'indicator-canceled'
    default: return 'indicator-default'
  }
})
</script>

<style scoped>
.task-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.task-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #4f46e5;
}

/* 카드 헤더 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.building-info {
  flex: 1;
}

.building-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
}

.unit-info {
  display: flex;
  gap: 8px;
}

.unit-badge, .room-badge {
  background: #f1f5f9;
  color: #475569;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.room-badge {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.status-badges {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.status-chip, .invoice-chip {
  font-weight: 600;
  min-width: 80px;
  justify-content: center;
}

/* 섹션 공통 스타일 */
.task-section, .memo-section {
  margin-bottom: 16px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

/* 작업 내용 */
.task-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.task-chip {
  font-weight: 500;
  transition: all 0.2s ease;
}

.task-chip:hover {
  transform: scale(1.05);
}

.empty-task {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 14px;
  font-style: italic;
}

/* 메모 섹션 */
.memo-content {
  font-size: 14px;
  color: #475569;
  font-style: italic;
  line-height: 1.5;
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #cbd5e1;
}

/* 상태 인디케이터 바 */
.status-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  border-radius: 0 2px 2px 0;
}

.indicator-active {
  background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
}

.indicator-complete {
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
}

.indicator-hold {
  background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
}

.indicator-planned {
  background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%);
}

.indicator-canceled {
  background: linear-gradient(180deg, #9ca3af 0%, #6b7280 100%);
}

.indicator-default {
  background: linear-gradient(180deg, #64748b 0%, #475569 100%);
}

/* 호버 인디케이터 */
.hover-indicator {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  opacity: 0;
  transition: all 0.3s ease;
}

.task-card:hover .hover-indicator {
  opacity: 1;
  transform: translateY(-50%) translateX(4px);
}

/* 상태별 카드 스타일 */
.status-active {
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 5%, #ffffff 15%);
}

.status-complete {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 5%, #ffffff 15%);
}

.status-hold {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 5%, #ffffff 15%);
}

.status-planned {
  background: linear-gradient(135deg, #faf5ff 0%, #e9d5ff 5%, #ffffff 15%);
}

.status-canceled {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 5%, #ffffff 15%);
}

.status-default {
  background: white;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .task-card {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .status-badges {
    flex-direction: row;
    gap: 8px;
    align-items: flex-start;
  }
  
  .building-name {
    font-size: 16px;
  }
  
  .hover-indicator {
    display: none;
  }
}

@media (max-width: 480px) {
  .task-card {
    padding: 14px;
    margin-bottom: 10px;
  }
  
  .building-name {
    font-size: 15px;
  }
  
  .unit-info {
    flex-wrap: wrap;
  }
  
  .task-chips {
    gap: 4px;
  }
  
  .memo-content {
    padding: 10px;
    font-size: 13px;
  }
}
</style>