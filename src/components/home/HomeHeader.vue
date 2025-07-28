<template>
  <v-app-bar :elevation="0" class="custom-header" height="80">
    <div class="d-flex align-center justify-space-between w-100 px-4">
      <div class="d-flex align-center">
        <div class="header-icon-wrapper">
          <v-icon size="32" color="white">mdi-wrench</v-icon>
        </div>
        <div class="ml-3">
          <h1 class="header-title">공조+</h1>
          <div class="header-subtitle">스마트 작업 관리</div>
        </div>
      </div>

      <div class="d-flex align-center">
        <div v-if="userStore.userId" class="user-info-chip">
          <v-avatar size="36" class="mr-2">
            <v-icon color="primary">mdi-account</v-icon>
          </v-avatar>
          <span class="user-name">{{ userStore.userName }}님</span>
        </div>
        <v-btn
          icon
          size="large"
          class="logout-btn ml-2"
          @click="handleLogout"
          aria-label="로그아웃"
        >
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </div>
    </div>
  </v-app-bar>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 8px;
  backdrop-filter: blur(10px);
}

.header-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.header-subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
}

.user-info-chip {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 4px 12px 4px 4px;
  display: flex;
  align-items: center;
  backdrop-filter: blur(10px);
}

.user-name {
  font-weight: 500;
  font-size: 0.9rem;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
}
</style>
