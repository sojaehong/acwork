<template>
  <div class="floating-actions">
    <!-- 활성 필터 칩들 -->
    <div
      v-if="hasActiveFilters && activeFilterChips.length > 0"
      class="filter-chips-section"
    >
      <div class="filter-chips-container">
        <v-chip
          v-for="filter in activeFilterChips"
          :key="filter.key"
          :color="filter.color"
          size="small"
          closable
          variant="tonal"
          class="filter-chip"
          @click:close="handleRemoveFilter(filter.type, filter.value)"
        >
          <v-icon start size="14">{{ filter.icon }}</v-icon>
          {{ filter.label }}
        </v-chip>
      </div>
    </div>

    <!-- 버튼 그룹 -->
    <div class="button-group">
      <!-- 필터 초기화 버튼 -->
      <v-btn
        v-if="hasActiveFilters"
        size="large"
        variant="outlined"
        class="reset-btn"
        @click="handleResetFilters"
      >
        <v-icon start>mdi-filter-remove</v-icon>
        필터 초기화
      </v-btn>

      <!-- 홈 버튼 -->
      <v-btn
        size="large"
        variant="outlined"
        class="home-btn"
        :class="{ 'full-width': !hasActiveFilters }"
        @click="handleGoHome"
      >
        <v-icon start>mdi-home</v-icon>
        홈으로 돌아가기
      </v-btn>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  hasActiveFilters: {
    type: Boolean,
    default: false,
  },
  activeFilterChips: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['go-home', 'reset-filters', 'remove-filter'])

const handleGoHome = () => {
  emit('go-home')
}

const handleResetFilters = () => {
  emit('reset-filters')
}

const handleRemoveFilter = (type, value) => {
  emit('remove-filter', type, value)
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
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 필터 칩 섹션 */
.filter-chips-section {
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 16px;
}

.filter-chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 120px;
  overflow-y: auto;
}

.filter-chip {
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.button-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.home-btn,
.reset-btn {
  height: 56px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  will-change: transform;
  flex: 1;
}

.home-btn.full-width {
  flex: 1;
}

.reset-btn {
  border-color: #fca5a5;
  color: #dc2626;
  background: #fef2f2;
}

.reset-btn:hover,
.reset-btn:focus {
  background: #fee2e2;
  border-color: #f87171;
  transform: translateY(-2px);
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
    gap: 12px;
  }

  .filter-chips-section {
    padding-bottom: 12px;
  }

  .filter-chips-container {
    gap: 6px;
    max-height: 80px;
  }

  .filter-chip {
    font-size: 11px;
  }

  .button-group {
    gap: 8px;
  }

  .home-btn,
  .reset-btn {
    height: 52px;
    font-size: 14px;
  }
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .home-btn:hover,
  .reset-btn:hover,
  .filter-chip:hover {
    transform: none;
  }
}

/* 애니메이션 줄임 설정 */
@media (prefers-reduced-motion: reduce) {
  .home-btn,
  .reset-btn,
  .filter-chip {
    transition: none;
  }

  .home-btn:hover,
  .reset-btn:hover,
  .filter-chip:hover {
    transform: none;
  }
}
</style>
