import { memoize } from './debounce'
import { getTodayDateKST } from './date'

// 오늘 날짜 캐싱 (KST 기준)
const getTodayKST = memoize(() => {
  return getTodayDateKST()
})

// 상태 정보 계산을 메모이제이션
const getStatusInfo = memoize((status, date) => {
  const todayStr = getTodayKST()
  
  // displayStatus: '예정' 적용 로직
  let displayStatus = status
  if (status === '진행' && date > todayStr) {
    displayStatus = '예정'
  }

  // 상태별 색상
  const colorMap = {
    '완료': 'success',
    '보류': 'error', 
    '진행': 'warning',
    '예정': 'purple',
    '취소됨': 'grey'
  }

  // 상태별 아이콘
  const iconMap = {
    '완료': 'mdi-check-circle',
    '보류': 'mdi-pause-circle',
    '진행': 'mdi-play-circle',
    '예정': 'mdi-clock-outline',
    '취소됨': 'mdi-close-circle'
  }

  // 모바일용 짧은 상태 텍스트
  const shortStatusMap = {
    '완료': '완료',
    '보류': '보류',
    '진행': '진행',
    '예정': '예정',
    '취소됨': '취소'
  }

  return {
    displayStatus,
    color: colorMap[displayStatus] || 'grey',
    icon: iconMap[displayStatus] || 'mdi-help-circle',
    shortStatus: shortStatusMap[displayStatus] || displayStatus,
    statusClass: `status-${displayStatus}`
  }
}, (status, date) => `${status}-${date}`)

// 작업 카테고리 분류를 위한 유틸리티
export const categorizeSchedules = memoize((schedules) => {
  const categories = {
    progress: [],
    completed: [],
    pending: [],
    cancelled: [],
    all: schedules
  }
  
  schedules.forEach(schedule => {
    const statusInfo = getStatusInfo(schedule.status, schedule.date)
    
    switch (statusInfo.displayStatus) {
      case '진행':
      case '예정':
        categories.progress.push({
          ...schedule,
          statusInfo
        })
        break
      case '완료':
        categories.completed.push({
          ...schedule,
          statusInfo
        })
        break
      case '보류':
        categories.pending.push({
          ...schedule,
          statusInfo
        })
        break
      case '취소됨':
        categories.cancelled.push({
          ...schedule,
          statusInfo
        })
        break
    }
  })
  
  return categories
}, (schedules) => schedules.map(s => `${s.id}-${s.status}-${s.date}`).join(','))

export { getStatusInfo, getTodayKST }