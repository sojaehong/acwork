<template>
  <!-- 📅 달력 뷰 -->
  <v-card class="calendar-card" elevation="0">
    <div class="calendar-header">
      <div class="calendar-header-content">
        <div class="calendar-icon">
          <v-icon color="primary">mdi-calendar-month</v-icon>
        </div>
        <h3 class="calendar-title">팀 일정표</h3>
        <v-spacer />
        <div class="calendar-controls">
          <v-btn
            icon
            size="small"
            variant="text"
            @click="$emit('previousMonth')"
          >
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>
          <div class="current-month">{{ currentMonthText }}</div>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="$emit('nextMonth')"
          >
            <v-icon>mdi-chevron-right</v-icon>
          </v-btn>
          <v-btn
            size="small"
            variant="outlined"
            class="ml-2"
            @click="$emit('goToToday')"
          >
            오늘
          </v-btn>
        </div>
      </div>
    </div>

    <div class="calendar-content">
      <!-- 요일 헤더 -->
      <div class="calendar-weekdays">
        <div
          v-for="day in weekdays"
          :key="day"
          class="weekday-header"
          :class="{ weekend: day === '일' || day === '토' }"
        >
          {{ day }}
        </div>
      </div>

      <!-- 달력 날짜 그리드 -->
      <div class="calendar-grid">
        <div
          v-for="(date, index) in calendarDates"
          :key="index"
          class="calendar-date"
          :class="{
            'other-month': !date.isCurrentMonth,
            'today': date.isToday,
            'has-schedule': date.workerLines.length > 0,
            'weekend': date.isWeekend
          }"
          @click="$emit('dateClick', date)"
        >
          <div class="date-number">{{ date.day }}</div>
          
          <!-- 작업자별 라인 시스템 -->
          <div v-if="date.workerLines.length > 0" class="worker-lines">
            <div
              v-for="(line, lineIndex) in date.workerLines"
              :key="`line-${lineIndex}`"
              class="worker-line"
              :style="{ top: `${line.lineIndex * 26}px` }"
            >
              <div
                v-if="line.event"
                class="schedule-event-bar"
                :class="{
                  'event-start': line.event.isStart,
                  'event-end': line.event.isEnd,
                  'event-continue': line.event.isContinue,
                  'event-middle': !line.event.isStart && !line.event.isEnd
                }"
                :style="{ 
                  '--event-color': getWorkerColor(line.workerId),
                  width: `${line.event.width}%`,
                  left: `${line.event.left}%`
                }"
                @click.stop="$emit('scheduleClick', line.event.schedule)"
              >
                <div v-if="line.event.isStart" class="event-content">
                  <span class="event-title">{{ getWorkerName(line.workerId) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 더보기 표시 -->
          <div
            v-if="date.overflowCount > 0"
            class="schedule-more"
            @click.stop="$emit('dateClick', date)"
          >
            +{{ date.overflowCount }}개 더
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentDate: {
    type: Date,
    required: true
  },
  calendarDates: {
    type: Array,
    default: () => []
  },
  getWorkerColor: {
    type: Function,
    required: true
  },
  getScheduleWorkerNames: {
    type: Function,
    required: true
  },
  getWorkerName: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['previousMonth', 'nextMonth', 'goToToday', 'dateClick', 'scheduleClick'])

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

const currentMonthText = computed(() => {
  return props.currentDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long'
  })
})
</script>

<style scoped>
/* 📅 달력 뷰 스타일 */
.calendar-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.calendar-header {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  padding: 24px;
}

.calendar-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.calendar-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-month {
  font-size: 16px;
  font-weight: 600;
  color: white;
  min-width: 120px;
  text-align: center;
}

.calendar-controls .v-btn {
  color: rgba(255, 255, 255, 0.9) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

.calendar-content {
  padding: 0;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.weekday-header {
  padding: 16px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  color: #64748b;
}

.weekday-header.weekend {
  color: #ef4444;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8fafc;
  gap: 1px;
}

.calendar-date {
  min-height: 150px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: white;
  border: none;
}

.calendar-date:hover {
  background: #fafbfc;
}

.calendar-date.other-month {
  background: #f9fafb;
  color: #9ca3af;
}

.calendar-date.today {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #60a5fa;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.calendar-date.has-schedule {
  background: linear-gradient(135deg, #fefcfb 0%, #fef7ed 100%);
  border-color: #fed7aa;
}

.calendar-date.weekend {
  background: #fefcfb;
}

.calendar-date.weekend.other-month {
  background: #f7f6f5;
}

.date-number {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #1e293b;
  transition: all 0.2s ease;
}

.calendar-date.other-month .date-number {
  color: #9ca3af;
}

.calendar-date.today .date-number {
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
}

.calendar-date.weekend .date-number {
  color: #ef4444;
}

/* 📅 달력 이벤트 스타일 - 구글 캘린더 스타일 */
.worker-lines {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: visible;
  margin-top: 8px;
}

.worker-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 24px;
  z-index: 1;
}


/* 연속된 일정 스타일 - 완전히 이어진 연결감 */
.schedule-event-bar.event-start {
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.schedule-event-bar.event-end {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}

.schedule-event-bar.event-middle {
  border-radius: 0;
}

.schedule-event-bar.event-start.event-end {
  border-radius: 12px;
}

/* 완전히 연결된 라인을 위한 절대 위치 */
.worker-line {
  position: absolute;
  left: -8px;
  right: -8px;
  height: 24px;
  z-index: 10;
}

.schedule-event-bar {
  position: absolute;
  height: 22px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.3;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: var(--event-color, #3B82F6);
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 12px;
  min-height: 22px;
}

.event-content {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  height: 100%;
}

.event-title {
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  line-height: 1;
  flex: 1;
}

.schedule-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
  padding: 2px;
}

.schedule-event {
  position: relative;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.3;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  border: none;
  background: var(--event-color, #3B82F6);
  overflow: hidden;
}

/* 호버 효과 */
.schedule-event-bar:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25), 0 3px 6px rgba(0, 0, 0, 0.15);
  z-index: 20;
  filter: brightness(1.1);
}

.schedule-event-bar:active {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
}

.schedule-event::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.schedule-event:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12);
}

.schedule-event:hover::before {
  opacity: 1;
}

.schedule-event:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
}

.event-time {
  font-weight: 600;
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-bottom: 1px;
}

.event-workers {
  font-size: 9px;
  font-weight: 400;
  opacity: 0.95;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.schedule-more {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  text-align: center;
  padding: 4px 6px;
  cursor: pointer;
  background: #f9fafb;
  border-radius: 4px;
  margin-top: 4px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  position: relative;
  z-index: 3;
}

.schedule-more:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
  color: #374151;
  border-color: #d1d5db;
}

/* 📅 달력 반응형 */
@media (max-width: 1024px) {
  .calendar-date {
    min-height: 130px;
  }
  
  .worker-lines {
    height: 100px;
  }
  
  .schedule-event-bar {
    height: 20px;
    font-size: 11px;
    padding: 0 6px;
  }
  
  .event-title {
    font-size: 12px;
  }
  
  .calendar-controls {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .current-month {
    min-width: 100px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .calendar-header {
    padding: 20px;
  }
  
  .calendar-header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .calendar-controls {
    align-self: stretch;
    justify-content: center;
  }
  
  .calendar-date {
    min-height: 110px;
    padding: 6px;
  }
  
  .worker-lines {
    height: 85px;
    margin-top: 4px;
  }
  
  .worker-line {
    height: 20px;
  }
  
  .schedule-event-bar {
    height: 18px;
    font-size: 10px;
    padding: 0 4px;
  }
  
  .event-title {
    font-size: 11px;
  }

  .schedule-more {
    padding: 4px 6px;
    font-size: 9px;
    margin-top: 4px;
  }

  .date-number {
    font-size: 12px;
  }
  
  .weekday-header {
    padding: 12px 4px;
    font-size: 12px;
  }

  .calendar-date.today .date-number {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
}
</style>