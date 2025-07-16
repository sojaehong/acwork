<template>
  <v-card class="stats-card" elevation="0">
    <div class="stats-header">
      <div class="stats-icon">
        <v-icon color="white">mdi-chart-line</v-icon>
      </div>
      <h3 class="stats-title">작업 현황</h3>
    </div>

    <div class="stats-grid">
      <div 
        v-for="stat in statItems"
        :key="stat.key"
        class="stat-item"
        :class="stat.colorClass"
      >
        <div class="stat-number" :class="stat.numberColorClass">
          {{ stat.value }}
        </div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      total: 0,
      active: 0,
      completed: 0,
      hold: 0
    })
  }
})

// 🚀 성능 최적화: 메모이제이션된 통계 아이템
const statItems = computed(() => [
  {
    key: 'total',
    value: props.stats.total,
    label: '총 작업',
    colorClass: '',
    numberColorClass: ''
  },
  {
    key: 'active',
    value: props.stats.active,
    label: '진행중',
    colorClass: 'stat-item--warning',
    numberColorClass: 'text-warning'
  },
  {
    key: 'completed',
    value: props.stats.completed,
    label: '완료',
    colorClass: 'stat-item--success',
    numberColorClass: 'text-success'
  },
  {
    key: 'hold',
    value: props.stats.hold,
    label: '보류',
    colorClass: 'stat-item--error',
    numberColorClass: 'text-error'
  }
])
</script>

<style scoped>
.stats-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  contain: layout style;
}

.stats-header {
  display: flex;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.stats-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.stats-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 24px;
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.3s ease;
  will-change: transform;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-item--warning:hover {
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2);
}

.stat-item--success:hover {
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2);
}

.stat-item--error:hover {
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
}

.text-warning {
  color: #f59e0b !important;
}

.text-success {
  color: #10b981 !important;
}

.text-error {
  color: #ef4444 !important;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 20px;
  }

  .stat-number {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stats-header {
    padding: 20px;
  }

  .stat-item {
    padding: 12px;
  }
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .stat-item:hover {
    transform: none;
    box-shadow: none;
  }
}

/* 애니메이션 줄임 설정 */
@media (prefers-reduced-motion: reduce) {
  .stat-item {
    transition: none;
  }
  
  .stat-item:hover {
    transform: none;
  }
}
</style>