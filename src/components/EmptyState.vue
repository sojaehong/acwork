<template>
  <div class="empty-state">
    <div class="empty-icon">
      <v-icon size="80" color="grey-lighten-2">{{
        icon || 'mdi-clipboard-text-off'
      }}</v-icon>
    </div>
    <h3 class="empty-title">{{ title || '등록된 작업이 없습니다' }}</h3>
    <p class="empty-description">
      {{ subtitle || '새 작업을 등록하여 시작해보세요!' }}
    </p>
    <v-btn
      color="primary"
      size="large"
      @click="handleAddTask"
      class="mt-4 add-task-btn"
      :aria-label="buttonText || '첫 작업 등록하기'"
    >
      <v-icon start>mdi-plus</v-icon>
      {{ buttonText || '첫 작업 등록하기' }}
    </v-btn>
  </div>
</template>

<script setup>
// Props 정의
const props = defineProps({
  icon: {
    type: String,
    default: 'mdi-clipboard-text-off',
  },
  title: {
    type: String,
    default: '등록된 작업이 없습니다',
  },
  subtitle: {
    type: String,
    default: '새 작업을 등록하여 시작해보세요!',
  },
  buttonText: {
    type: String,
    default: '첫 작업 등록하기',
  },
})

// 🚀 emit 정의 수정 - 더 범용적인 이벤트명 사용
const emit = defineEmits(['button-click', 'add-first-task'])

// 🚀 이벤트 핸들러 함수
const handleAddTask = () => {
  // 두 이벤트 모두 emit하여 호환성 유지
  emit('button-click')
  emit('add-first-task')
}
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  contain: layout style;
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

.add-task-btn {
  transition: all 0.3s ease;
  will-change: transform;
}

.add-task-btn:hover {
  transform: translateY(-2px);
}

.add-task-btn:focus {
  outline: 2px solid rgba(79, 70, 229, 0.5);
  outline-offset: 2px;
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .add-task-btn:hover {
    transform: none;
  }
}

/* 모바일 대응 */
@media (max-width: 600px) {
  .empty-state {
    padding: 40px 16px;
  }

  .empty-title {
    font-size: 20px;
  }

  .empty-description {
    font-size: 14px;
  }
}

/* 애니메이션 줄임 설정 */
@media (prefers-reduced-motion: reduce) {
  .add-task-btn {
    transition: none;
  }

  .add-task-btn:hover {
    transform: none;
  }
}
</style>
