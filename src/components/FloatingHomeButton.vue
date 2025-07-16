<template>
  <div class="floating-actions">
    <v-btn
      block
      size="large"
      variant="outlined"
      class="home-btn"
      @click="handleGoHome"
    >
      <v-icon start>mdi-home</v-icon>
      홈으로 돌아가기
    </v-btn>
  </div>
</template>

<script setup>
const emit = defineEmits(['go-home'])

const handleGoHome = () => {
  emit('go-home')
}
</script>

<style scoped>
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
  contain: layout style;
}

.home-btn {
  height: 56px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  will-change: transform;
}

.home-btn:hover,
.home-btn:focus {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .floating-actions {
    padding: 16px;
  }

  .home-btn {
    height: 52px;
  }
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .home-btn:hover {
    transform: none;
  }
}

/* 애니메이션 줄임 설정 */
@media (prefers-reduced-motion: reduce) {
  .home-btn {
    transition: none;
  }
  
  .home-btn:hover {
    transform: none;
  }
}
</style>