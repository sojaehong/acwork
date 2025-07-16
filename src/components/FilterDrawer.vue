<template>
  <v-slide-y-transition>
    <div v-show="modelValue" class="filter-drawer">
      <div class="filter-header">
        <h3 class="filter-title">
          <v-icon start>mdi-filter</v-icon>
          필터 설정
        </h3>
        <v-btn
          icon
          variant="text"
          size="small"
          @click="closeDrawer"
          aria-label="필터 닫기"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="filter-content">
        <!-- 날짜 범위 -->
        <div class="filter-section">
          <h4 class="filter-section-title">
            <v-icon start size="20">mdi-calendar-range</v-icon>
            날짜 범위
          </h4>
          <v-row dense>
            <v-col cols="6">
              <v-text-field
                :model-value="filters.startDate"
                type="date"
                label="시작일"
                variant="outlined"
                density="compact"
                @update:model-value="updateFilter('startDate', $event)"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                :model-value="filters.endDate"
                type="date"
                label="종료일"
                variant="outlined"
                density="compact"
                @update:model-value="updateFilter('endDate', $event)"
              />
            </v-col>
          </v-row>
        </div>

        <!-- 검색 -->
        <div class="filter-section">
          <h4 class="filter-section-title">
            <v-icon start size="20">mdi-magnify</v-icon>
            검색
          </h4>
          <v-text-field
            :model-value="filters.searchText"
            label="호수 또는 메모로 검색"
            variant="outlined"
            density="compact"
            clearable
            @update:model-value="updateFilter('searchText', $event)"
          >
            <template #prepend-inner>
              <v-icon>mdi-magnify</v-icon>
            </template>
          </v-text-field>
        </div>

        <!-- 필터 그룹들 -->
        <div
          v-for="(group, key) in filterGroups"
          :key="key"
          class="filter-section"
        >
          <h4 class="filter-section-title">
            <v-icon start size="20">{{ group.icon }}</v-icon>
            {{ group.label }}
          </h4>
          <div class="filter-chips">
            <v-chip
              v-for="opt in group.options"
              :key="opt"
              :color="group.active(opt) ? 'primary' : 'grey-lighten-2'"
              :variant="group.active(opt) ? 'flat' : 'outlined'"
              size="small"
              class="filter-chip"
              @click="handleToggleFilter(group.type, opt)"
              tabindex="0"
              role="button"
              :aria-label="`${group.label} ${opt} ${group.active(opt) ? '선택됨' : '선택 안됨'}`"
            >
              <v-icon v-if="group.active(opt)" start size="14">
                mdi-check
              </v-icon>
              {{ opt }}
            </v-chip>
          </div>
        </div>

        <!-- 필터 액션 버튼 -->
        <div class="filter-actions">
          <v-btn
            variant="outlined"
            color="grey"
            block
            @click="handleResetFilters"
            class="mb-3"
          >
            <v-icon start>mdi-refresh</v-icon>
            필터 초기화
          </v-btn>
          <v-btn color="primary" block @click="closeDrawer">
            <v-icon start>mdi-check</v-icon>
            필터 적용 완료
          </v-btn>
        </div>
      </div>
    </div>
  </v-slide-y-transition>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  filterGroups: {
    type: Object,
    required: true,
    default: () => ({})
  },
  filters: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const emit = defineEmits([
  'update:modelValue',
  'toggle-filter',
  'reset-filters',
  'apply-filters'
])

const closeDrawer = () => {
  emit('update:modelValue', false)
}

const handleToggleFilter = (type, value) => {
  emit('toggle-filter', type, value)
}

const handleResetFilters = () => {
  emit('reset-filters')
}

const updateFilter = (key, value) => {
  emit('apply-filters', { [key]: value })
}
</script>

<style scoped>
.filter-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  z-index: 2000;
  max-height: 80vh;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  contain: layout style;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.filter-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.filter-content {
  padding: 24px;
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 32px;
}

.filter-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  transition: all 0.3s ease;
  cursor: pointer;
  will-change: transform;
}

.filter-chip:hover {
  transform: translateY(-1px);
}

.filter-chip:focus {
  outline: 2px solid rgba(79, 70, 229, 0.5);
  outline-offset: 2px;
}

.filter-actions {
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

/* 스크롤바 스타일링 */
.filter-content::-webkit-scrollbar {
  width: 6px;
}

.filter-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.filter-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.filter-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .filter-header {
    padding: 20px;
  }

  .filter-content {
    padding: 20px;
  }

  .filter-section {
    margin-bottom: 24px;
  }
}

@media (max-width: 480px) {
  .filter-header {
    padding: 16px;
  }

  .filter-content {
    padding: 16px;
  }

  .filter-section-title {
    font-size: 14px;
  }

  .filter-chips {
    gap: 6px;
  }
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .filter-chip:hover {
    transform: none;
  }
}

/* 애니메이션 줄임 설정 */
@media (prefers-reduced-motion: reduce) {
  .filter-chip {
    transition: none;
  }
  
  .filter-chip:hover {
    transform: none;
  }
}

</style>