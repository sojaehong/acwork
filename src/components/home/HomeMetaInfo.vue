<template>
  <div 
    class="meta-info-section" 
    @click="$emit('edit-meta')"
    tabindex="0"
    role="button"
    aria-label="메타 정보 편집"
    @keydown.enter="$emit('edit-meta')"
    @keydown.space.prevent="$emit('edit-meta')"
  >
    <!-- 메타 정보 로딩 중일 때 스켈레톤 -->
    <div v-if="isLoading" class="meta-skeleton">
      <div class="meta-grid">
        <div v-for="i in 3" :key="i" class="skeleton-item">
          <div class="skeleton-icon"></div>
          <div class="skeleton-content">
            <div class="skeleton-label"></div>
            <div class="skeleton-value"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 실제 메타 정보 -->
    <div v-else class="meta-grid">
      <div class="meta-item">
        <div class="meta-icon">
          <v-icon color="primary">mdi-clock-outline</v-icon>
        </div>
        <div class="meta-content">
          <div class="meta-label">시작 시간</div>
          <div class="meta-value">{{ scheduleMeta?.startTime || '설정되지 않음' }}</div>
        </div>
      </div>

      <div class="meta-item">
        <div class="meta-icon">
          <v-icon color="success">mdi-account-group</v-icon>
        </div>
        <div class="meta-content">
          <div class="meta-label">작업 인원</div>
          <div class="meta-value">
            <template v-if="scheduleMeta?.workerNames?.length">
              <v-chip
                v-for="(user, i) in scheduleMeta.workerNames"
                :key="`worker-${i}-${user}`"
                :color="user === currentUserName ? 'primary' : 'grey-lighten-2'"
                size="small"
                class="ma-1"
                variant="flat"
              >
                <v-icon start size="16">mdi-account</v-icon>
                {{ user }}
              </v-chip>
            </template>
            <span v-else class="text-grey-darken-1">배정되지 않음</span>
          </div>
        </div>
      </div>

      <div class="meta-item">
        <div class="meta-icon">
          <v-icon color="info">mdi-bullhorn</v-icon>
        </div>
        <div class="meta-content">
          <div class="meta-label">공지사항</div>
          <div class="meta-value">{{ scheduleMeta?.notice || '공지사항이 없습니다' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  scheduleMeta: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  currentUserName: {
    type: String,
    default: ''
  }
})

defineEmits(['edit-meta'])
</script>

<style scoped>
.meta-info-section {
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 0 0 20px 20px;
}

.meta-info-section:hover {
  background: #f8fafc;
}

.meta-info-section:focus {
  outline: 3px solid rgba(79, 70, 229, 0.3);
  outline-offset: 2px;
  background: #f8fafc;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.meta-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
}

.meta-content {
  flex: 1;
  min-width: 0;
}

.meta-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 4px;
}

.meta-value {
  font-size: 1rem;
  color: #1e293b;
  font-weight: 600;
  word-break: break-word;
}

/* 스켈레톤 로딩 스타일 */
.meta-skeleton .meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.skeleton-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
}

.skeleton-icon {
  width: 48px;
  height: 48px;
  background: #e2e8f0;
  border-radius: 12px;
  animation: pulse 2s infinite;
}

.skeleton-content {
  flex: 1;
}

.skeleton-label {
  height: 16px;
  background: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 8px;
  width: 80px;
  animation: pulse 2s infinite;
}

.skeleton-value {
  height: 20px;
  background: #e2e8f0;
  border-radius: 4px;
  width: 140px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>