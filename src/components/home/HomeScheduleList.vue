<template>
  <div class="home-schedule-list">
    <!-- 실제 작업 목록 -->
    <template v-if="categorizedSchedules.all.length">
      
      <!-- 진행 중인 작업 -->
      <TaskSection
        v-if="categorizedSchedules.progress.length"
        :schedules="categorizedSchedules.progress"
        section-type="active"
        title="진행 중인 작업"
        icon="mdi-play-circle"
        color="warning"
        @item-click="handleItemClick"
      />

      <!-- 완료된 작업 -->
      <TaskSection
        v-if="categorizedSchedules.completed.length"
        :schedules="categorizedSchedules.completed"
        section-type="completed"
        title="완료된 작업"
        icon="mdi-check-circle"
        color="success"
        @item-click="handleItemClick"
      />

      <!-- 보류된 작업 -->
      <TaskSection
        v-if="categorizedSchedules.pending.length"
        :schedules="categorizedSchedules.pending"
        section-type="hold"
        title="보류된 작업"
        icon="mdi-pause-circle"
        color="orange"
        @item-click="handleItemClick"
      />

      <!-- 취소된 작업 -->
      <TaskSection
        v-if="categorizedSchedules.cancelled.length"
        :schedules="categorizedSchedules.cancelled"
        section-type="cancelled"
        title="취소된 작업"
        icon="mdi-cancel"
        color="grey"
        @item-click="handleItemClick"
      />
    </template>

    <!-- 작업이 없을 때 -->
    <EmptyState 
      v-else
      icon="mdi-calendar-blank"
      title="등록된 작업이 없습니다"
      subtitle="새로운 작업을 추가해보세요!"
      button-text="작업 추가"
      @button-click="$emit('add-schedule')"
    />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'

// 비동기 컴포넌트 로딩으로 성능 최적화
const TaskSection = defineAsyncComponent(() => import('@/components/TaskSection.vue'))
const EmptyState = defineAsyncComponent(() => import('@/components/EmptyState.vue'))

const props = defineProps({
  schedules: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['item-click', 'add-schedule'])

// 상태별 작업 분류를 메모이제이션으로 최적화
const categorizedSchedules = computed(() => {
  const categories = {
    progress: [],
    completed: [],
    pending: [],
    cancelled: [],
    all: props.schedules
  }
  
  // 한 번의 순회로 모든 분류 처리 - 더 정확한 상태 매핑
  props.schedules.forEach(schedule => {
    const status = schedule.status
    switch (status) {
      case '진행':
        categories.progress.push(schedule)
        break
      case '완료':
        categories.completed.push(schedule)
        break
      case '보류':
        categories.pending.push(schedule)
        break
      case '취소됨':
        categories.cancelled.push(schedule)
        break
      default:
        // 기타 상태는 진행 중으로 처리
        categories.progress.push(schedule)
    }
  })
  
  return categories
})

const handleItemClick = (item) => {
  emit('item-click', item)
}
</script>

<style scoped>
.home-schedule-list {
  margin-top: 24px;
}
</style>