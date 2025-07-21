<template>
  <div class="date-navigation">
    <v-btn 
      icon 
      size="large" 
      variant="text"
      class="date-nav-btn"
      @click="$emit('change-date', -1)"
      :disabled="isChangingDate"
      aria-label="이전 날짜"
    >
      <v-icon size="28">mdi-chevron-left</v-icon>
    </v-btn>
    
    <div class="date-display">
      <h2 class="date-title">{{ displayDate }}</h2>
      <div class="date-badge">{{ ddayText }}</div>
    </div>
    
    <v-btn 
      icon 
      size="large" 
      variant="text"
      class="date-nav-btn"
      @click="$emit('change-date', 1)"
      :disabled="isChangingDate"
      aria-label="다음 날짜"
    >
      <v-icon size="28">mdi-chevron-right</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { format, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'

const props = defineProps({
  selectedDate: {
    type: Date,
    required: true
  },
  isChangingDate: {
    type: Boolean,
    default: false
  }
})

defineEmits(['change-date'])

const displayDate = computed(() => {
  return format(props.selectedDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })
})

const ddayText = computed(() => {
  const today = new Date()
  const diff = differenceInDays(props.selectedDate, today)
  
  if (diff === 0) return '오늘'
  if (diff === 1) return '내일'
  if (diff === -1) return '어제'
  if (diff > 0) return `D-${diff}`
  return `D+${Math.abs(diff)}`
})
</script>

<style scoped>
.date-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.date-nav-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
}

.date-nav-btn:hover,
.date-nav-btn:focus {
  background: rgba(255, 255, 255, 0.2) !important;
  transform: translateY(-1px);
}

.date-nav-btn:disabled {
  background: rgba(255, 255, 255, 0.05) !important;
  opacity: 0.5;
  transform: none !important;
}

.date-nav-btn .v-icon {
  color: white !important;
}

.date-display {
  text-align: center;
}

.date-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.date-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 8px;
  display: inline-block;
}

/* 모바일 반응형 스타일 */
@media (max-width: 768px) {
  .date-navigation {
    padding: 16px 12px;
  }
  
  .date-nav-btn {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
    border-radius: 8px !important;
  }
  
  .date-nav-btn .v-icon {
    font-size: 20px !important;
  }
  
  .date-title {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.2;
  }
  
  .date-badge {
    padding: 2px 8px;
    border-radius: 8px;
    font-size: 10px;
    margin-top: 4px;
  }
}
</style>