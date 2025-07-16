<template>
  <div class="task-section">
    <div class="section-header">
      <div :class="['section-icon', sectionType]">
        <v-icon color="white">{{ icon }}</v-icon>
      </div>
      <h3 class="section-title">{{ title }}</h3>
      <v-chip :color="color" size="small" class="ml-2">
        {{ schedules.length }}개
      </v-chip>
    </div>
    
    <!-- 🚀 성능 최적화: transition-group with key 최적화 -->
    <transition-group 
      name="task-fade" 
      tag="div" 
      appear
      class="task-container"
    >
      <TaskCard
        v-for="item in schedules"
        :key="`task-${item.id}-${item.status}`"
        :item="item"
        class="task-card-wrapper"
        tabindex="0"
        role="button"
        :aria-label="`${item.building} ${item.room}호 작업 상세보기`"
        @click="handleItemClick(item.id)"
        @keydown.enter="handleItemClick(item.id)"
        @keydown.space.prevent="handleItemClick(item.id)"
      />
    </transition-group>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

// 🚀 성능 최적화: TaskCard 지연 로딩
const TaskCard = defineAsyncComponent(() => import('@/components/TaskCard.vue'))

// Props 정의
defineProps({
  schedules: {
    type: Array,
    required: true,
    default: () => []
  },
  sectionType: {
    type: String,
    required: true,
    validator: (value) => ['active', 'completed', 'hold'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  }
})

// 이벤트 정의
const emit = defineEmits(['item-click'])

// 🚀 성능 최적화: 이벤트 핸들러 최적화
const handleItemClick = (id) => {
  emit('item-click', id)
}
</script>

<style scoped>
.task-section {
  contain: layout style;
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.section-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.section-icon.active {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.section-icon.completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.section-icon.hold {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.task-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card-wrapper {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  will-change: transform;
}

.task-card-wrapper:hover {
  transform: translateY(-2px);
}

.task-card-wrapper:focus {
  outline: 3px solid rgba(79, 70, 229, 0.3);
  outline-offset: 2px;
}

/* 🚀 성능 최적화된 애니메이션 */
.task-fade-enter-active {
  transition: all 0.4s ease;
}

.task-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.task-fade-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.task-fade-leave-active {
  transition: all 0.3s ease;
}

.task-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.task-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .task-card-wrapper:hover {
    transform: none;
  }
}

/* 애니메이션 줄임 설정 */
@media (prefers-reduced-motion: reduce) {
  .task-card-wrapper,
  .task-fade-enter-active,
  .task-fade-leave-active {
    transition: none;
  }
  
  .task-card-wrapper:hover {
    transform: none;
  }
}
</style>