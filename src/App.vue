<template>
  <v-app>
    <transition name="fade-fast" mode="out-in">
      <router-view />
    </transition>
  </v-app>
</template>

<style>
/* 빠른 fade-slide (페이지 전환용) */
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: all 0.15s ease-in-out;
}
.fade-fast-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.fade-fast-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.fade-fast-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.fade-fast-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

/* 리스트 등장 fade-stagger */
.fade-stagger-enter-active {
  transition: all 0.1s ease-out;
}
.fade-stagger-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.fade-stagger-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.fade-stagger-leave-active {
  transition: all 0.08s ease-in;
  opacity: 0;
  transform: translateY(5px);
}

/* 버튼 pressed 효과 */
.v-btn:active {
  transform: scale(0.97);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.05s ease;
}
</style>
