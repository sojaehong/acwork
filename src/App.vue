<template>
  <v-app>
    <transition name="fade-slide" mode="out-in">
      <router-view :key="$route.fullPath" />
    </transition>
  </v-app>
</template>

<style>
/* 기본 fade-slide */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 모바일 최적화 fade-slide */
@media (max-width: 768px) {
  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: all 0.12s ease; /* 모바일은 120ms로 빠르게 */
  }
}

/* fade-stagger (리스트 출현용) */
.fade-stagger-enter-active {
  transition: all 0.2s ease;
}
.fade-stagger-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-stagger-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.fade-stagger-leave-active {
  transition: all 0.15s ease;
  opacity: 0;
  transform: translateY(8px);
}

/* 모바일 최적화 fade-stagger */
@media (max-width: 768px) {
  .fade-stagger-enter-active {
    transition: all 0.1s ease; /* 모바일은 100ms로 빠르게 */
  }
  .fade-stagger-leave-active {
    transition: all 0.08s ease; /* 모바일은 80ms로 빠르게 */
  }
}

/* 버튼 pressed 효과 */
.v-btn:active {
  transform: scale(0.97);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.1s ease;
}
</style>
