<template>
  <v-app>
    <transition name="fade-slide" mode="out-in">
      <router-view :key="$route.fullPath" />
    </transition>
  </v-app>
</template>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
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

/* 버튼 pressed 효과 */
.v-btn:active {
  transform: scale(0.97);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: all 0.1s ease;
}

/* fade-stagger */
.fade-stagger-enter-active {
  transition: all 0.3s ease;
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
  transition: all 0.2s ease;
  opacity: 0;
  transform: translateY(8px);
}
</style>
