<template>
  <v-app>
    <router-view />

    <v-snackbar
      v-model="uiStore.snackbar.show"
      :color="uiStore.snackbar.color"
      :timeout="uiStore.snackbar.timeout"
      location="top right"
      variant="flat"
    >
      {{ uiStore.snackbar.message }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="uiStore.hideSnackbar()">
          닫기
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
</script>

<style>
.responsive-padding {
  padding: 16px;
}

@media (max-width: 600px) {
  .responsive-padding {
    padding: 12px;
  }
}

.responsive-title {
  font-size: 18px;
  font-weight: bold;
}

@media (max-width: 600px) {
  .responsive-title {
    font-size: 16px;
  }
}

.responsive-btn {
  height: 48px;
  font-size: 16px;
}

@media (max-width: 600px) {
  .responsive-btn {
    height: 44px;
    font-size: 15px;
  }
}

.responsive-card {
  padding: 16px;
}

@media (max-width: 600px) {
  .responsive-card {
    padding: 12px;
  }
}
</style>
