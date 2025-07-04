<template>
  <v-card
    class="mb-3 task-card"
    :class="statusClass"
    hover
    elevation="2"
    @click="$emit('click')"
  >
    <!-- 상태 chip / 세금계산서 chip 우측 -->
    <div class="d-flex justify-space-between align-center mb-2 px-4 pt-4">
   <div class="text-subtitle-1 font-weight-medium">
  🏢 <span>{{ item.building }}</span>
   <span v-if="item.unit">&nbsp;{{ item.unit }}동</span>
  <span v-if="item.room">&nbsp;{{ item.room }}호</span>
</div>
      <div>
        <v-chip :color="statusColor" size="small" class="me-1" text-color="white">
          {{ displayStatus }}
        </v-chip>
        <v-chip :color="item.invoice ? 'blue' : 'grey'" size="small" text-color="white">
          세금계산서 {{ item.invoice ? 'O' : 'X' }}
        </v-chip>
      </div>
    </div>

    <!-- 작업내용 -->
    <v-card-text class="pb-1 px-4">
      <div class="text-body-2 text-grey-darken-2 mb-2">
        <span class="font-weight-medium">🛠️ 작업 내용:</span>
        <template v-if="item.tasks && item.tasks.length">
          <v-chip
            v-for="(task, i) in item.tasks"
            :key="`${task.name}-${task.count}-${i}`"
            size="small"
            class="me-1 mt-1"
            color="secondary"
            variant="tonal"
          >
            {{ task.name }} ({{ task.count }} )
          </v-chip>
        </template>
        <span v-else class="text-grey">없음</span>
      </div>
    </v-card-text>

    <!-- 메모 -->
    <v-card-text v-if="item.memo" class="px-4 pt-0 pb-4 text-caption text-grey">
      ✏️ {{ item.memo }}
    </v-card-text>
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

// 상태별 색상 적용 (예정 포함, 취소됨 추가)
const statusColor = computed(() => {
  switch (displayStatus.value) {
    case '완료': return 'green'
    case '보류': return 'red'
    case '진행': return 'orange'
    case '예정': return 'purple'
    case '취소됨': return 'grey'
    default: return 'grey'
  }
})

// 상태별 border-left color class 적용 (취소됨 추가)
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
</script>

<style scoped>
.task-card {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  border-left: 6px solid #2196f3; /* 기본 진행 색상 */
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px); /* 살짝 뜨는 효과 */
}

.status-active {
  border-left-color: #2196f3; /* 진행 */
}

.status-complete {
  border-left-color: #4caf50; /* 완료 */
}

.status-hold {
  border-left-color: #fb8c00; /* 보류 */
}

.status-planned {
  border-left-color: #9c27b0; /* 예정 → purple 계열 */
}

.status-canceled {
  border-left-color: #bdbdbd; /* 취소됨 → light grey */
}

.status-default {
  border-left-color: #9e9e9e; /* 기본 */
}
</style>
