<template>
  <!-- 👥 작업자 필터 카드 -->
  <v-card class="worker-filter-card mb-8" elevation="0">
    <div class="card-header">
      <div class="header-icon">
        <v-icon color="primary">mdi-account-group</v-icon>
      </div>
      <h3 class="card-title">작업자 필터</h3>
      <v-chip color="info" size="small" class="ml-2">
        {{ selectedWorkers.length }}/{{ workers.length }}명
      </v-chip>
      <v-spacer />
      <div class="filter-actions">
        <v-btn
          size="small"
          variant="outlined"
          @click="$emit('selectAll')"
          :disabled="loading"
        >
          전체선택
        </v-btn>
        <v-btn
          size="small"
          variant="outlined"
          @click="$emit('deselectAll')"
          :disabled="loading"
          class="ml-2"
        >
          전체해제
        </v-btn>
      </div>
    </div>

    <!-- 🦴 작업자 선택 스켈레톤 -->
    <div v-if="loading" class="worker-skeleton-container">
      <v-skeleton-loader
        v-for="i in 6"
        :key="`skeleton-${i}`"
        type="list-item-avatar"
        class="worker-skeleton"
      />
    </div>

    <!-- 작업자 체크박스 그리드 -->
    <div v-else class="worker-checkbox-grid">
      <v-checkbox
        v-for="worker in workers"
        :key="worker.id"
        :model-value="selectedWorkers.includes(worker.id)"
        @update:model-value="(checked) => $emit('toggleWorker', worker.id, checked)"
        :color="getWorkerColor(worker.id)"
        class="worker-checkbox"
        hide-details
      >
        <template #label>
          <div class="worker-label">
            <div 
              class="worker-color-indicator"
              :style="{ backgroundColor: getWorkerColor(worker.id) }"
            ></div>
            <span class="worker-name">{{ worker.name }}</span>
            <v-chip
              :color="getWorkerColor(worker.id)"
              size="x-small"
              variant="outlined"
              class="ml-2"
            >
              {{ getWorkerScheduleCount(worker.id) }}건
            </v-chip>
          </div>
        </template>
      </v-checkbox>
    </div>
  </v-card>
</template>

<script setup>

const props = defineProps({
  workers: {
    type: Array,
    default: () => []
  },
  selectedWorkers: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  getWorkerColor: {
    type: Function,
    required: true
  },
  getWorkerScheduleCount: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['selectAll', 'deselectAll', 'toggleWorker'])
</script>

<style scoped>
/* 👥 작업자 필터 카드 */
.worker-filter-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.filter-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.worker-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
  padding: 24px;
}

.worker-checkbox {
  border-radius: 12px;
  padding: 8px 12px;
  transition: all 0.2s ease;
  background: rgba(0, 0, 0, 0.02);
}

.worker-checkbox:hover {
  background: rgba(0, 0, 0, 0.05);
}

.worker-label {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  font-weight: 500;
}

.worker-color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.worker-name {
  flex: 1;
  font-size: 14px;
}

.worker-skeleton-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 6px;
  padding: 20px;
}

.worker-skeleton {
  height: 60px;
  border-radius: 16px;
}

/* 🎯 반응형 디자인 */
@media (max-width: 768px) {
  .worker-checkbox-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 6px;
    padding: 20px;
  }

  .worker-skeleton-container {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 6px;
    padding: 20px;
  }

  .filter-actions {
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .worker-checkbox-grid {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .worker-skeleton-container {
    grid-template-columns: 1fr;
    padding: 16px;
  }
}
</style>