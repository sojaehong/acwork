import { memoize } from './debounce'
import { getTodayDateKST } from './date'

// 🚀 고도화된 작업 상태 관리 유틸리티

// 세분화된 작업 상태 정의
export const WORK_STATUS = {
  // 진행 상태
  SCHEDULED: 'scheduled',    // 예정됨
  IN_PROGRESS: 'in_progress', // 진행중
  PAUSED: 'paused',         // 일시정지
  DELAYED: 'delayed',       // 지연됨
  
  // 완료 상태
  COMPLETED: 'completed',   // 완료
  REVIEWED: 'reviewed',     // 검토완료
  APPROVED: 'approved',     // 승인완료
  
  // 보류/취소 상태
  ON_HOLD: 'on_hold',      // 보류
  CANCELLED: 'cancelled',   // 취소됨
  REWORK: 'rework',        // 재작업
  
  // 기타 상태
  WAITING: 'waiting',      // 대기중
  PENDING_APPROVAL: 'pending_approval' // 승인대기
}

// 기존 상태를 새로운 상태로 매핑
export const STATUS_MAPPING = {
  '진행': WORK_STATUS.IN_PROGRESS,
  '완료': WORK_STATUS.COMPLETED,
  '보류': WORK_STATUS.ON_HOLD,
  '취소됨': WORK_STATUS.CANCELLED,
  '예정': WORK_STATUS.SCHEDULED,
  '지연': WORK_STATUS.DELAYED,
  '대기': WORK_STATUS.WAITING,
  '검토완료': WORK_STATUS.REVIEWED,
  '승인완료': WORK_STATUS.APPROVED,
  '재작업': WORK_STATUS.REWORK,
  '일시정지': WORK_STATUS.PAUSED,
  '승인대기': WORK_STATUS.PENDING_APPROVAL
}

// 상태별 표시 정보
export const STATUS_CONFIG = {
  [WORK_STATUS.SCHEDULED]: {
    label: '예정됨',
    color: 'info',
    icon: 'mdi-clock-outline',
    priority: 1,
    category: 'upcoming',
    variant: 'tonal'
  },
  [WORK_STATUS.IN_PROGRESS]: {
    label: '진행중',
    color: 'primary',
    icon: 'mdi-play-circle',
    priority: 2,
    category: 'active',
    variant: 'flat'
  },
  [WORK_STATUS.PAUSED]: {
    label: '일시정지',
    color: 'warning',
    icon: 'mdi-pause-circle',
    priority: 3,
    category: 'paused',
    variant: 'tonal'
  },
  [WORK_STATUS.DELAYED]: {
    label: '지연됨',
    color: 'error',
    icon: 'mdi-clock-alert',
    priority: 4,
    category: 'delayed',
    variant: 'flat'
  },
  [WORK_STATUS.COMPLETED]: {
    label: '완료',
    color: 'success',
    icon: 'mdi-check-circle',
    priority: 5,
    category: 'completed',
    variant: 'flat'
  },
  [WORK_STATUS.REVIEWED]: {
    label: '검토완료',
    color: 'success',
    icon: 'mdi-eye-check',
    priority: 6,
    category: 'completed',
    variant: 'outlined'
  },
  [WORK_STATUS.APPROVED]: {
    label: '승인완료',
    color: 'success',
    icon: 'mdi-check-all',
    priority: 7,
    category: 'completed',
    variant: 'elevated'
  },
  [WORK_STATUS.ON_HOLD]: {
    label: '보류',
    color: 'orange',
    icon: 'mdi-pause',
    priority: 8,
    category: 'hold',
    variant: 'tonal'
  },
  [WORK_STATUS.CANCELLED]: {
    label: '취소됨',
    color: 'error',
    icon: 'mdi-close-circle',
    priority: 9,
    category: 'cancelled',
    variant: 'outlined'
  },
  [WORK_STATUS.REWORK]: {
    label: '재작업',
    color: 'deep-orange',
    icon: 'mdi-refresh-circle',
    priority: 10,
    category: 'rework',
    variant: 'flat'
  },
  [WORK_STATUS.WAITING]: {
    label: '대기중',
    color: 'grey',
    icon: 'mdi-timer-sand',
    priority: 11,
    category: 'waiting',
    variant: 'tonal'
  },
  [WORK_STATUS.PENDING_APPROVAL]: {
    label: '승인대기',
    color: 'amber',
    icon: 'mdi-clock-check',
    priority: 12,
    category: 'pending',
    variant: 'tonal'
  }
}

// 오늘 날짜 캐싱 (KST 기준)
const getTodayKST = memoize(() => {
  return getTodayDateKST()
})

// 🚀 고도화된 상태 정보 계산
const getStatusInfo = memoize((status, date) => {
  const todayStr = getTodayKST()
  
  // displayStatus: '예정' 적용 로직
  let displayStatus = status
  if (status === '진행' && date > todayStr) {
    displayStatus = '예정'
  }

  // 새로운 상태 시스템 사용
  const mappedStatus = STATUS_MAPPING[displayStatus] || displayStatus
  const config = STATUS_CONFIG[mappedStatus]
  
  if (config) {
    return {
      displayStatus,
      originalStatus: status,
      mappedStatus,
      color: config.color,
      icon: config.icon,
      shortStatus: config.label,
      statusClass: `status-${mappedStatus}`,
      priority: config.priority,
      category: config.category,
      variant: config.variant
    }
  }

  // 기존 로직 (호환성)
  const colorMap = {
    '완료': 'success',
    '보류': 'error', 
    '진행': 'warning',
    '예정': 'purple',
    '취소됨': 'grey'
  }

  const iconMap = {
    '완료': 'mdi-check-circle',
    '보류': 'mdi-pause-circle',
    '진행': 'mdi-play-circle',
    '예정': 'mdi-clock-outline',
    '취소됨': 'mdi-close-circle'
  }

  return {
    displayStatus,
    originalStatus: status,
    color: colorMap[displayStatus] || 'grey',
    icon: iconMap[displayStatus] || 'mdi-help-circle',
    shortStatus: displayStatus,
    statusClass: `status-${displayStatus}`,
    priority: 999,
    category: 'unknown',
    variant: 'outlined'
  }
}, (status, date) => `${status}-${date}`)

// 🚀 진행률 계산
export function calculateProgress(schedule) {
  if (!schedule.tasks || schedule.tasks.length === 0) return 0
  
  const statusInfo = getStatusInfo(schedule.status, schedule.date)
  const status = statusInfo.mappedStatus || statusInfo.displayStatus
  
  // 상태별 기본 진행률
  const progressMap = {
    [WORK_STATUS.SCHEDULED]: 0,
    [WORK_STATUS.IN_PROGRESS]: 50,
    [WORK_STATUS.PAUSED]: 30,
    [WORK_STATUS.DELAYED]: 20,
    [WORK_STATUS.COMPLETED]: 100,
    [WORK_STATUS.REVIEWED]: 95,
    [WORK_STATUS.APPROVED]: 100,
    [WORK_STATUS.ON_HOLD]: 25,
    [WORK_STATUS.CANCELLED]: 0,
    [WORK_STATUS.REWORK]: 10,
    [WORK_STATUS.WAITING]: 5,
    [WORK_STATUS.PENDING_APPROVAL]: 80,
    
    // 기존 상태 호환성
    '예정': 0,
    '진행': 50,
    '완료': 100,
    '보류': 25,
    '취소됨': 0
  }
  
  return progressMap[status] || 0
}

// 🚀 작업 긴급도 계산
export function calculateUrgency(schedule) {
  const today = new Date()
  const workDate = new Date(schedule.date + 'T00:00:00+09:00')
  const diffDays = Math.ceil((workDate - today) / (1000 * 60 * 60 * 24))
  
  const statusInfo = getStatusInfo(schedule.status, schedule.date)
  
  // 완료된 작업은 긴급도 없음
  if (statusInfo.category === 'completed') return 'none'
  
  if (diffDays < 0) return 'overdue' // 기한 초과
  if (diffDays === 0) return 'today' // 오늘
  if (diffDays === 1) return 'tomorrow' // 내일
  if (diffDays <= 3) return 'urgent' // 긴급
  if (diffDays <= 7) return 'soon' // 곧
  return 'normal' // 보통
}

// 긴급도별 설정
export const URGENCY_CONFIG = {
  overdue: {
    label: '기한초과',
    color: 'error',
    icon: 'mdi-alert-circle',
    priority: 1,
    variant: 'flat'
  },
  today: {
    label: '오늘',
    color: 'warning',
    icon: 'mdi-calendar-today',
    priority: 2,
    variant: 'flat'
  },
  tomorrow: {
    label: '내일',
    color: 'orange',
    icon: 'mdi-calendar-clock',
    priority: 3,
    variant: 'tonal'
  },
  urgent: {
    label: '긴급',
    color: 'deep-orange',
    icon: 'mdi-fire',
    priority: 4,
    variant: 'tonal'
  },
  soon: {
    label: '곧',
    color: 'amber',
    icon: 'mdi-clock-fast',
    priority: 5,
    variant: 'outlined'
  },
  normal: {
    label: '보통',
    color: 'grey',
    icon: 'mdi-clock',
    priority: 6,
    variant: 'text'
  },
  none: {
    label: '',
    color: 'transparent',
    icon: '',
    priority: 7,
    variant: 'text'
  }
}

// 🚀 작업 복잡도 계산
export function calculateComplexity(schedule) {
  const taskCount = schedule.tasks?.length || 0
  const hasInvoice = Boolean(schedule.invoice)
  const memoLength = schedule.memo?.length || 0
  
  let complexity = 0
  
  // 작업 수에 따른 복잡도
  if (taskCount === 0) complexity += 1
  else if (taskCount <= 2) complexity += 2
  else if (taskCount <= 4) complexity += 3
  else complexity += 4
  
  // 세금계산서 여부
  if (hasInvoice) complexity += 1
  
  // 메모 길이
  if (memoLength > 100) complexity += 1
  
  // 복잡도 분류
  if (complexity <= 2) return 'simple'
  if (complexity <= 4) return 'medium'
  return 'complex'
}

// 복잡도별 설정
export const COMPLEXITY_CONFIG = {
  simple: {
    label: '단순',
    color: 'success',
    icon: 'mdi-circle',
    level: 1
  },
  medium: {
    label: '보통',
    color: 'warning',
    icon: 'mdi-circle-double',
    level: 2
  },
  complex: {
    label: '복잡',
    color: 'error',
    icon: 'mdi-circle-multiple',
    level: 3
  }
}

// 🚀 통합 작업 정보 계산
export function enrichScheduleData(schedule) {
  const statusInfo = getStatusInfo(schedule.status, schedule.date)
  const urgency = calculateUrgency(schedule)
  const urgencyConfig = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.normal
  const progress = calculateProgress(schedule)
  const complexity = calculateComplexity(schedule)
  const complexityConfig = COMPLEXITY_CONFIG[complexity] || COMPLEXITY_CONFIG.medium
  
  return {
    ...schedule,
    statusInfo,
    urgency,
    urgencyInfo: urgencyConfig,
    progress,
    complexity,
    complexityInfo: complexityConfig,
    enriched: true
  }
}

// 🚀 고급 통계 계산
export function calculateAdvancedStats(schedules) {
  const enriched = schedules.map(enrichScheduleData)
  
  const stats = {
    total: enriched.length,
    byStatus: {},
    byUrgency: {},
    byComplexity: {},
    byCategory: {
      upcoming: 0,
      active: 0,
      paused: 0,
      delayed: 0,
      completed: 0,
      hold: 0,
      cancelled: 0,
      rework: 0,
      waiting: 0,
      pending: 0
    },
    averageProgress: 0,
    overdue: 0,
    today: 0,
    thisWeek: 0,
    efficiency: 0,
    byWorkType: {},
    byBuilding: {}
  }
  
  // 디버깅: 전체 작업 데이터 구조 확인
  if (enriched.length > 0 && enriched[0]?.tasks?.[0]) {
    const sampleTask = enriched[0].tasks[0]
    console.log('작업 통계 계산 시작:', {
      totalSchedules: enriched.length,
      sampleTask: {
        name: sampleTask.name,
        count: sampleTask.count,
        countType: typeof sampleTask.count,
        countValue: sampleTask.count,
        parsedCount: parseInt(sampleTask.count),
        numberCount: Number(sampleTask.count)
      }
    })
  }
  
  let totalProgress = 0
  const today = new Date()
  const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  enriched.forEach(schedule => {
    // 상태별 집계
    const statusLabel = schedule.statusInfo.shortStatus
    stats.byStatus[statusLabel] = (stats.byStatus[statusLabel] || 0) + 1
    
    // 카테고리별 집계
    if (stats.byCategory[schedule.statusInfo.category] !== undefined) {
      stats.byCategory[schedule.statusInfo.category]++
    }
    
    // 긴급도별 집계
    const urgencyLabel = schedule.urgencyInfo.label
    if (urgencyLabel) {
      stats.byUrgency[urgencyLabel] = (stats.byUrgency[urgencyLabel] || 0) + 1
    }
    
    // 복잡도별 집계
    const complexityLabel = schedule.complexityInfo.label
    stats.byComplexity[complexityLabel] = (stats.byComplexity[complexityLabel] || 0) + 1
    
    // 진행률 합계
    totalProgress += schedule.progress
    
    // 특수 상태 계산
    if (schedule.urgency === 'overdue') stats.overdue++
    if (schedule.urgency === 'today') stats.today++
    
    // 이번 주 작업
    const workDate = new Date(schedule.date + 'T00:00:00+09:00')
    if (workDate <= weekLater && workDate >= today) {
      stats.thisWeek++
    }
    
    // 작업 종류별 집계
    if (schedule.tasks && schedule.tasks.length > 0) {
      schedule.tasks.forEach(task => {
        const taskName = task.name || '기타'
        
        // 더 안전한 count 파싱
        let taskCount = 1
        if (task.count !== undefined && task.count !== null && task.count !== '') {
          // 문자열이면서 숫자로 변환 가능한 경우
          if (typeof task.count === 'string') {
            const trimmed = task.count.trim()
            if (/^\d+$/.test(trimmed)) {
              taskCount = parseInt(trimmed, 10)
            } else {
              console.warn('문자열 count 파싱 실패:', {
                schedule: schedule.id,
                taskName,
                originalCount: task.count,
                type: typeof task.count
              })
            }
          } 
          // 숫자인 경우
          else if (typeof task.count === 'number' && !isNaN(task.count)) {
            taskCount = Math.floor(task.count)
          }
        }
        
        // 안전성 검증
        if (taskCount <= 0) {
          taskCount = 1
        } else if (taskCount > 100) {
          console.warn(`비정상적으로 큰 작업 카운트 (제한됨):`, {
            schedule: schedule.id,
            building: schedule.building,
            taskName,
            originalCount: task.count,
            parsedCount: taskCount
          })
          taskCount = Math.min(taskCount, 10)
        }
        
        stats.byWorkType[taskName] = (stats.byWorkType[taskName] || 0) + taskCount
      })
    }

    // 건물별 집계
    if (schedule.building) {
      stats.byBuilding[schedule.building] = (stats.byBuilding[schedule.building] || 0) + 1
    }
  })
  
  stats.averageProgress = enriched.length > 0 ? Math.round(totalProgress / enriched.length) : 0
  stats.efficiency = stats.byCategory.completed / Math.max(stats.total, 1) * 100
  
  // 디버깅: 최종 통계 결과 확인
  console.log('작업 통계 계산 완료:', {
    byWorkType: stats.byWorkType,
    totalItems: stats.total
  })
  
  return stats
}

// 작업 카테고리 분류를 위한 유틸리티 (기존 + 개선)
export const categorizeSchedules = memoize((schedules) => {
  const enriched = schedules.map(enrichScheduleData)
  
  const categories = {
    // 기존 카테고리
    progress: [],
    completed: [],
    pending: [],
    cancelled: [],
    all: enriched,
    
    // 새로운 세분화된 카테고리
    upcoming: [],
    active: [],
    paused: [],
    delayed: [],
    hold: [],
    rework: [],
    waiting: [],
    overdue: [],
    today: [],
    thisWeek: []
  }
  
  const today = new Date()
  const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  enriched.forEach(schedule => {
    const category = schedule.statusInfo.category
    
    // 새로운 카테고리 분류
    if (categories[category]) {
      categories[category].push(schedule)
    }
    
    // 기존 카테고리 분류 (호환성)
    switch (schedule.statusInfo.displayStatus) {
      case '진행':
      case '예정':
        categories.progress.push(schedule)
        break
      case '완료':
        categories.completed.push(schedule)
        break
      case '보류':
        categories.pending.push(schedule)
        break
      case '취소됨':
        categories.cancelled.push(schedule)
        break
    }
    
    // 시간 기반 분류
    if (schedule.urgency === 'overdue') categories.overdue.push(schedule)
    if (schedule.urgency === 'today') categories.today.push(schedule)
    
    const workDate = new Date(schedule.date + 'T00:00:00+09:00')
    if (workDate <= weekLater && workDate >= today) {
      categories.thisWeek.push(schedule)
    }
  })
  
  return categories
}, (schedules) => schedules.map(s => `${s.id}-${s.status}-${s.date}`).join(','))

export { getStatusInfo, getTodayKST }