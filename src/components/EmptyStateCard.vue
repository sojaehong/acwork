<template>
  <div class="empty-state">
    <div class="empty-icon">
      <v-icon size="80" color="grey-lighten-2">mdi-calendar-remove</v-icon>
    </div>
    <h3 class="empty-title">
      {{
        hasActiveFilters
          ? '필터 조건에 맞는 작업이 없습니다'
          : '등록된 작업이 없습니다'
      }}
    </h3>
    <p class="empty-description">
      {{
        hasActiveFilters
          ? '필터를 조정하거나 초기화해보세요.'
          : '새 작업을 등록하여 시작해보세요!'
      }}
    </p>
    <v-btn
      v-if="hasActiveFilters"
      color="primary"
      @click="handleResetFilters"
      class="mt-4"
    >
      <v-icon start>mdi-filter-off</v-icon>
      필터 초기화
    </v-btn>
  </div>
</template>

<script setup>
const props = defineProps({
  hasActiveFilters: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['reset-filters'])

const handleResetFilters = () => {
  emit('reset-filters')
}
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  contain: layout style;
}

.empty-icon {
  margin-bottom: 24px;
}

.empty-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.empty-description {
  color: #64748b;
  font-size: 16px;
  margin-bottom: 0;
}

/* 반응형 디자인 */
@media (max-width: 600px) {
  .empty-state {
    padding: 40px 16px;
  }

  .empty-title {
    font-size: 20px;
  }

  .empty-description {
    font-size: 14px;
  }
}
</style>
