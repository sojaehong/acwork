<template>
  <v-card class="advanced-stats-card" elevation="0">
    <!-- 헤더 -->
    <div class="stats-header">
      <div class="header-left">
        <div class="stats-icon">
          <v-icon color="white">mdi-chart-pie</v-icon>
        </div>
        <div class="header-text">
          <h3 class="stats-title">작업 현황 대시보드</h3>
          <div class="stats-subtitle">실시간 프로젝트 모니터링</div>
        </div>
      </div>
      <div class="header-right">
        <v-chip
          :color="overallHealthColor"
          size="small"
          class="health-chip"
          :variant="overallHealthVariant"
        >
          <v-icon start size="14">{{ overallHealthIcon }}</v-icon>
          {{ overallHealthText }}
        </v-chip>
      </div>
    </div>

    <!-- 주요 메트릭 섹션 -->
    <div class="main-metrics">
      <div class="metric-row">
        <!-- 총 작업 -->
        <div class="metric-card total">
          <div class="metric-icon">
            <v-icon>mdi-format-list-bulleted</v-icon>
          </div>
          <div class="metric-content">
            <div class="metric-number">{{ stats.total || 0 }}</div>
            <div class="metric-label">총 작업</div>
          </div>
        </div>

        <!-- 진행률 -->
        <div class="metric-card progress">
          <div class="metric-icon">
            <v-icon>mdi-progress-clock</v-icon>
          </div>
          <div class="metric-content">
            <div class="metric-number">{{ stats.averageProgress || 0 }}%</div>
            <div class="metric-label">평균 진행률</div>
            <v-progress-linear
              :model-value="stats.averageProgress || 0"
              color="primary"
              height="4"
              rounded
              class="mt-1"
            />
          </div>
        </div>

        <!-- 효율성 -->
        <div class="metric-card efficiency">
          <div class="metric-icon">
            <v-icon>mdi-speedometer</v-icon>
          </div>
          <div class="metric-content">
            <div class="metric-number">
              {{ Math.round(stats.efficiency || 0) }}%
            </div>
            <div class="metric-label">완료율</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 상태별 통계 -->
    <div class="status-section">
      <h4 class="section-title">
        <v-icon start>mdi-flag-variant</v-icon>
        상태별 현황
      </h4>
      <div class="status-grid">
        <div
          v-for="status in statusItems"
          :key="status.key"
          class="status-item clickable"
          :class="`status-item--${status.color}`"
          @click="handleStatusClick(status.label)"
        >
          <div class="status-header">
            <v-icon :color="status.color" size="20">{{ status.icon }}</v-icon>
            <span class="status-count">{{ status.value }}</span>
          </div>
          <div class="status-label">{{ status.label }}</div>
          <div v-if="status.percentage > 0" class="status-percentage">
            {{ status.percentage }}%
          </div>
        </div>
      </div>
    </div>

    <!-- 긴급도별 통계 -->
    <div class="urgency-section">
      <h4 class="section-title">
        <v-icon start>mdi-clock-alert</v-icon>
        긴급도별 현황
      </h4>
      <div class="urgency-alerts">
        <div
          v-for="urgency in urgencyItems"
          :key="urgency.key"
          v-show="urgency.value > 0"
          class="urgency-alert clickable"
          :class="`urgency-alert--${urgency.color}`"
          @click="handleUrgencyClick(urgency.label)"
        >
          <v-icon :color="urgency.color" size="18">{{ urgency.icon }}</v-icon>
          <span class="urgency-text">{{ urgency.label }}</span>
          <v-chip :color="urgency.color" size="x-small" class="urgency-count">
            {{ urgency.value }}
          </v-chip>
        </div>
      </div>
    </div>

    <!-- 작업 통계 -->
    <div class="work-stats-section">
      <div class="section-header-with-toggle">
        <h4 class="section-title">
          <v-icon start>mdi-chart-bar</v-icon>
          작업 통계
        </h4>
        <v-btn
          size="small"
          variant="outlined"
          @click="showDetailedWorkStats = !showDetailedWorkStats"
          class="toggle-btn"
        >
          <v-icon start size="16">
            {{ showDetailedWorkStats ? 'mdi-eye-off' : 'mdi-eye' }}
          </v-icon>
          {{ showDetailedWorkStats ? '간략히' : '자세히' }}
        </v-btn>
      </div>

      <!-- 작업 종류별 통계 -->
      <div class="work-type-stats">
        <!-- 간략 보기 -->
        <div v-if="!showDetailedWorkStats" class="work-type-simple">
          <div
            v-for="workType in workTypeItems"
            :key="workType.name"
            class="work-type-simple-item clickable"
            @click="handleWorkTypeClick(workType.name)"
          >
            <v-icon
              :color="workType.color"
              size="16"
              class="work-type-simple-icon"
            >
              {{ workType.icon }}
            </v-icon>
            <span class="work-type-simple-name">{{ workType.name }}</span>
            <span class="work-type-simple-count">{{ workType.count }}</span>
          </div>
        </div>

        <!-- 자세히 보기 -->
        <div v-else class="work-type-detailed">
          <div class="stats-header-row">
            <span class="stats-category">작업 종류</span>
            <span class="stats-count">건수</span>
            <span class="stats-percentage">비율</span>
          </div>
          <div
            v-for="workType in workTypeItems"
            :key="workType.name"
            class="work-type-item clickable"
            @click="handleWorkTypeClick(workType.name)"
          >
            <div class="work-type-info">
              <v-icon :color="workType.color" size="20" class="work-type-icon">
                {{ workType.icon }}
              </v-icon>
              <span class="work-type-name">{{ workType.name }}</span>
            </div>
            <div class="work-type-count">{{ workType.count }}건</div>
            <div class="work-type-bar">
              <v-progress-linear
                :model-value="workType.percentage"
                :color="workType.color"
                height="6"
                rounded
              />
              <span class="percentage-text">{{ workType.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 건물별 작업 현황 -->
      <div class="building-stats" v-if="buildingItems.length > 0">
        <div class="subsection-header-with-toggle">
          <h5 class="subsection-title">
            <v-icon start size="16">mdi-office-building</v-icon>
            건물별 현황
          </h5>
          <v-btn
            size="x-small"
            variant="outlined"
            @click="showDetailedBuildingStats = !showDetailedBuildingStats"
            class="building-toggle-btn"
          >
            <v-icon start size="14">
              {{ showDetailedBuildingStats ? 'mdi-eye-off' : 'mdi-eye' }}
            </v-icon>
            {{ showDetailedBuildingStats ? '간략히' : '자세히' }}
          </v-btn>
        </div>

        <!-- 간략 보기 -->
        <div v-if="!showDetailedBuildingStats" class="building-simple">
          <div
            v-for="building in buildingItems"
            :key="building.name"
            class="building-simple-item clickable"
            @click="handleBuildingClick(building.name)"
          >
            <v-icon color="primary" size="14" class="building-simple-icon">
              mdi-office-building-outline
            </v-icon>
            <span class="building-simple-name">{{ building.name }}</span>
            <span class="building-simple-count">{{ building.count }}</span>
          </div>
        </div>

        <!-- 자세히 보기 -->
        <div v-else class="building-detailed">
          <div class="building-grid">
            <div
              v-for="building in buildingItems"
              :key="building.name"
              class="building-item clickable"
              @click="handleBuildingClick(building.name)"
            >
              <div class="building-header">
                <v-icon color="primary" size="18"
                  >mdi-office-building-outline</v-icon
                >
                <span class="building-name">{{ building.name }}</span>
              </div>
              <div class="building-count">{{ building.count }}건</div>
              <v-progress-linear
                :model-value="building.percentage"
                color="primary"
                height="4"
                rounded
                class="building-progress"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 시간별 요약 -->
    <div class="time-summary">
      <div class="time-item overdue" v-if="stats.overdue > 0">
        <v-icon color="error">mdi-alert-circle</v-icon>
        <span
          >기한 초과: <strong>{{ stats.overdue }}건</strong></span
        >
      </div>
      <div class="time-item today" v-if="stats.today > 0">
        <v-icon color="warning">mdi-calendar-today</v-icon>
        <span
          >오늘 작업: <strong>{{ stats.today }}건</strong></span
        >
      </div>
      <div class="time-item week" v-if="stats.thisWeek > 0">
        <v-icon color="info">mdi-calendar-week</v-icon>
        <span
          >이번 주: <strong>{{ stats.thisWeek }}건</strong></span
        >
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      total: 0,
      byStatus: {},
      byUrgency: {},
      byComplexity: {},
      byCategory: {},
      averageProgress: 0,
      overdue: 0,
      today: 0,
      thisWeek: 0,
      efficiency: 0,
      byWorkType: {},
      byBuilding: {},
    }),
  },
})

const emit = defineEmits([
  'filter-by-status',
  'filter-by-work-type',
  'filter-by-building',
  'filter-by-urgency',
])

// 작업 통계 상세 보기 토글
const showDetailedWorkStats = ref(false)

// 건물 현황 상세 보기 토글
const showDetailedBuildingStats = ref(false)

// 🚀 전체 건강도 계산
const overallHealth = computed(() => {
  const stats = props.stats
  const overdueRatio = stats.overdue / Math.max(stats.total, 1)
  const completionRatio = stats.efficiency / 100
  const avgProgress = stats.averageProgress / 100

  if (overdueRatio > 0.3 || completionRatio < 0.2) {
    return { level: 'critical', score: 1 }
  } else if (overdueRatio > 0.1 || completionRatio < 0.5 || avgProgress < 0.3) {
    return { level: 'warning', score: 2 }
  } else if (completionRatio > 0.8 && avgProgress > 0.7) {
    return { level: 'excellent', score: 4 }
  } else {
    return { level: 'good', score: 3 }
  }
})

const overallHealthColor = computed(() => {
  switch (overallHealth.value.level) {
    case 'critical':
      return 'error'
    case 'warning':
      return 'warning'
    case 'good':
      return 'success'
    case 'excellent':
      return 'primary'
    default:
      return 'grey'
  }
})

const overallHealthVariant = computed(() => {
  return overallHealth.value.level === 'critical' ? 'flat' : 'tonal'
})

const overallHealthIcon = computed(() => {
  switch (overallHealth.value.level) {
    case 'critical':
      return 'mdi-alert-circle'
    case 'warning':
      return 'mdi-alert'
    case 'good':
      return 'mdi-check-circle'
    case 'excellent':
      return 'mdi-star-circle'
    default:
      return 'mdi-help-circle'
  }
})

const overallHealthText = computed(() => {
  switch (overallHealth.value.level) {
    case 'critical':
      return '주의 필요'
    case 'warning':
      return '개선 권장'
    case 'good':
      return '양호'
    case 'excellent':
      return '우수'
    default:
      return '상태 확인'
  }
})

// 🚀 상태별 통계 아이템
const statusItems = computed(() => {
  const byStatus = props.stats.byStatus || {}
  const total = props.stats.total || 1

  const statusConfig = [
    {
      key: 'active',
      label: '진행중',
      color: 'primary',
      icon: 'mdi-play-circle',
      values: ['진행중'],
    },
    {
      key: 'scheduled',
      label: '예정됨',
      color: 'info',
      icon: 'mdi-clock-outline',
      values: ['예정됨'],
    },
    {
      key: 'completed',
      label: '완료',
      color: 'success',
      icon: 'mdi-check-circle',
      values: ['완료', '검토완료', '승인완료'],
    },
    {
      key: 'paused',
      label: '일시정지',
      color: 'warning',
      icon: 'mdi-pause-circle',
      values: ['일시정지'],
    },
    {
      key: 'delayed',
      label: '지연됨',
      color: 'error',
      icon: 'mdi-clock-alert',
      values: ['지연됨'],
    },
    {
      key: 'hold',
      label: '보류',
      color: 'orange',
      icon: 'mdi-pause',
      values: ['보류'],
    },
    {
      key: 'cancelled',
      label: '취소됨',
      color: 'grey',
      icon: 'mdi-close-circle',
      values: ['취소됨'],
    },
    {
      key: 'rework',
      label: '재작업',
      color: 'deep-orange',
      icon: 'mdi-refresh-circle',
      values: ['재작업'],
    },
  ]

  return statusConfig
    .map((config) => {
      const value = config.values.reduce(
        (sum, status) => sum + (byStatus[status] || 0),
        0
      )
      const percentage = Math.round((value / total) * 100)

      return {
        ...config,
        value,
        percentage,
      }
    })
    .filter((item) => item.value > 0)
})

// 🚀 긴급도별 통계 아이템
const urgencyItems = computed(() => {
  const byUrgency = props.stats.byUrgency || {}

  const urgencyConfig = [
    {
      key: 'overdue',
      label: '기한초과',
      color: 'error',
      icon: 'mdi-alert-circle',
    },
    {
      key: 'today',
      label: '오늘',
      color: 'warning',
      icon: 'mdi-calendar-today',
    },
    {
      key: 'tomorrow',
      label: '내일',
      color: 'orange',
      icon: 'mdi-calendar-clock',
    },
    { key: 'urgent', label: '긴급', color: 'deep-orange', icon: 'mdi-fire' },
    { key: 'soon', label: '곧', color: 'amber', icon: 'mdi-clock-fast' },
  ]

  return urgencyConfig
    .map((config) => ({
      ...config,
      value: byUrgency[config.label] || 0,
    }))
    .filter((item) => item.value > 0)
})

// 🚀 작업 종류별 통계 아이템
const workTypeItems = computed(() => {
  const workTypeStats = props.stats.byWorkType || {}
  const total =
    Object.values(workTypeStats).reduce((sum, count) => sum + count, 0) || 1

  // 작업 종류별 아이콘과 색상 매핑
  const workTypeConfig = {
    에어컨청소: { icon: 'mdi-air-conditioner', color: 'blue' },
    필터교체: { icon: 'mdi-air-filter', color: 'green' },
    점검: { icon: 'mdi-clipboard-check', color: 'orange' },
    수리: { icon: 'mdi-wrench', color: 'red' },
    설치: { icon: 'mdi-hammer-screwdriver', color: 'purple' },
    정비: { icon: 'mdi-cog', color: 'brown' },
    교체: { icon: 'mdi-swap-horizontal', color: 'teal' },
    청소: { icon: 'mdi-spray-bottle', color: 'indigo' },
    default: { icon: 'mdi-clipboard-list', color: 'grey' },
  }

  return Object.entries(workTypeStats)
    .map(([name, count]) => {
      const config = workTypeConfig[name] || workTypeConfig.default
      const percentage = Math.round((count / total) * 100)

      return {
        name,
        count,
        percentage,
        icon: config.icon,
        color: config.color,
      }
    })
    .sort((a, b) => b.count - a.count) // 건수 많은 순으로 정렬
})

// 🚀 건물별 작업 현황 아이템
const buildingItems = computed(() => {
  const buildingStats = props.stats.byBuilding || {}
  const total =
    Object.values(buildingStats).reduce((sum, count) => sum + count, 0) || 1

  return Object.entries(buildingStats)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count) // 건수 많은 순으로 정렬
})

// 🚀 클릭 핸들러 함수들
const handleStatusClick = (statusLabel) => {
  // 표시 라벨을 실제 데이터베이스 값으로 매핑
  const statusMapping = {
    진행중: '진행',
    완료: '완료',
    예정됨: '예정',
    일시정지: '일시정지',
    지연됨: '지연',
    보류: '보류',
    취소됨: '취소됨',
    재작업: '재작업',
    검토완료: '검토완료',
    승인완료: '승인완료',
    대기중: '대기',
    승인대기: '승인대기',
  }

  const actualStatus = statusMapping[statusLabel] || statusLabel
  emit('filter-by-status', actualStatus)
}

const handleWorkTypeClick = (workTypeName) => {
  emit('filter-by-work-type', workTypeName)
}

const handleBuildingClick = (buildingName) => {
  emit('filter-by-building', buildingName)
}

const handleUrgencyClick = (urgencyLabel) => {
  emit('filter-by-urgency', urgencyLabel)
}
</script>

<style scoped>
/* 🎨 고도화된 통계 카드 스타일 */
.advanced-stats-card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

/* 헤더 스타일 */
.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.stats-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.3;
}

.header-left {
  display: flex;
  align-items: center;
  z-index: 1;
}

.header-right {
  z-index: 1;
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  backdrop-filter: blur(10px);
}

.header-text {
  display: flex;
  flex-direction: column;
}

.stats-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: white;
  line-height: 1.2;
}

.stats-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
}

.health-chip {
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 주요 메트릭 섹션 */
.main-metrics {
  padding: 32px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.metric-card {
  display: flex;
  align-items: center;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #64748b;
}

.metric-content {
  flex: 1;
}

.metric-number {
  font-size: 32px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 섹션 공통 스타일 */
.status-section,
.urgency-section,
.workload-section {
  padding: 24px 32px;
  border-top: 1px solid #e2e8f0;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 상태별 통계 */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.status-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.status-item:hover {
  transform: translateY(-1px);
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-item.clickable {
  cursor: pointer;
}

.status-item.clickable:hover {
  border-color: #4f46e5;
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.15);
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.status-count {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.status-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.status-percentage {
  font-size: 11px;
  color: #94a3b8;
}

/* 긴급도 알림 */
.urgency-alerts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.urgency-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border-left: 4px solid transparent;
  transition: all 0.3s ease;
}

.urgency-alert.clickable {
  cursor: pointer;
}

.urgency-alert.clickable:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.urgency-alert--error {
  border-left-color: #ef4444;
  background: linear-gradient(90deg, #fef2f2 0%, #f8fafc 100%);
}

.urgency-alert--warning {
  border-left-color: #f59e0b;
  background: linear-gradient(90deg, #fffbeb 0%, #f8fafc 100%);
}

.urgency-alert--orange {
  border-left-color: #f97316;
  background: linear-gradient(90deg, #fff7ed 0%, #f8fafc 100%);
}

.urgency-alert--deep-orange {
  border-left-color: #ea580c;
  background: linear-gradient(90deg, #fff7ed 0%, #f8fafc 100%);
}

.urgency-alert--amber {
  border-left-color: #d97706;
  background: linear-gradient(90deg, #fffbeb 0%, #f8fafc 100%);
}

.urgency-text {
  flex: 1;
  font-weight: 600;
  color: #374151;
}

.urgency-count {
  font-weight: 700;
}

/* 작업 통계 */
.work-stats-section {
  padding: 24px 32px;
  border-top: 1px solid #e2e8f0;
}

.section-header-with-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toggle-btn {
  font-size: 12px;
  height: 32px;
  min-width: 80px;
}

.work-type-stats {
  margin-bottom: 32px;
}

/* 간략 보기 스타일 */
.work-type-simple {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.work-type-simple-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.work-type-simple-item:hover {
  background: white;
  border-color: #4f46e5;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
  transform: translateY(-1px);
}

.work-type-simple-icon {
  background: rgba(255, 255, 255, 0.8);
  padding: 4px;
  border-radius: 50%;
}

.work-type-simple-name {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.work-type-simple-count {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  background: rgba(79, 70, 229, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
}

.stats-header-row {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  font-weight: 700;
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.work-type-item {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
}

.work-type-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #e2e8f0;
}

.work-type-item.clickable {
  cursor: pointer;
}

.work-type-item.clickable:hover {
  border-color: #4f46e5;
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.15);
}

.work-type-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.work-type-icon {
  background: #f8fafc;
  padding: 8px;
  border-radius: 8px;
}

.work-type-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.work-type-count {
  font-weight: 700;
  color: #1e293b;
  font-size: 16px;
  text-align: center;
}

.work-type-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.work-type-bar .v-progress-linear {
  flex: 1;
}

.percentage-text {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  min-width: 35px;
  text-align: right;
}

/* 건물별 통계 */
.building-stats {
  margin-top: 24px;
}

.subsection-header-with-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.subsection-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.building-toggle-btn {
  font-size: 11px;
  height: 28px;
  min-width: 60px;
}

/* 건물 간략 보기 스타일 */
.building-simple {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.building-simple-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.building-simple-item:hover {
  background: white;
  border-color: #4f46e5;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
  transform: translateY(-1px);
}

.building-simple-icon {
  background: rgba(79, 70, 229, 0.1);
  padding: 2px;
  border-radius: 50%;
}

.building-simple-name {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.building-simple-count {
  font-size: 11px;
  font-weight: 700;
  color: #1e293b;
  background: rgba(79, 70, 229, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.building-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.building-item {
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
}

.building-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.building-item.clickable {
  cursor: pointer;
}

.building-item.clickable:hover {
  border-color: #4f46e5;
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.15);
  border: 1px solid #4f46e5;
}

.building-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.building-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.building-count {
  font-weight: 700;
  color: #1e293b;
  font-size: 18px;
  margin-bottom: 8px;
  text-align: center;
}

.building-progress {
  margin-top: 8px;
}

/* 시간별 요약 */
.time-summary {
  padding: 24px 32px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .metric-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .status-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .stats-header {
    padding: 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-right {
    align-self: flex-end;
  }

  .main-metrics {
    padding: 24px;
  }

  .metric-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .status-section,
  .urgency-section,
  .work-stats-section {
    padding: 20px 24px;
  }

  .time-summary {
    padding: 20px 24px;
    flex-direction: column;
  }

  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-header-row {
    padding: 10px 12px;
    font-size: 11px;
  }

  .work-type-item {
    padding: 12px;
    grid-template-columns: 2fr 80px 1.5fr;
  }

  .work-type-name {
    font-size: 13px;
  }

  .work-type-count {
    font-size: 14px;
  }

  .building-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  .building-item {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .stats-header {
    padding: 16px;
  }

  .stats-title {
    font-size: 16px;
  }

  .stats-subtitle {
    font-size: 12px;
  }

  .stats-icon {
    width: 40px;
    height: 40px;
    margin-right: 12px;
  }

  .main-metrics {
    padding: 16px;
  }

  .metric-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .metric-card {
    padding: 12px;
    flex-direction: column;
    text-align: center;
  }

  .metric-icon {
    width: 36px;
    height: 36px;
    margin-right: 0;
    margin-bottom: 8px;
  }

  .metric-number {
    font-size: 18px;
    margin-bottom: 2px;
  }

  .metric-label {
    font-size: 10px;
  }

  .status-section,
  .urgency-section,
  .work-stats-section {
    padding: 16px;
  }

  .section-header-with-toggle {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .toggle-btn {
    font-size: 11px;
    height: 28px;
    min-width: 70px;
  }

  .work-type-simple {
    gap: 6px;
  }

  .work-type-simple-item {
    padding: 6px 10px;
  }

  .work-type-simple-name {
    font-size: 11px;
  }

  .work-type-simple-count {
    font-size: 10px;
    padding: 1px 6px;
  }

  .section-title {
    font-size: 14px;
    margin-bottom: 12px;
  }

  .time-summary {
    padding: 16px;
  }

  .status-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .status-item {
    padding: 8px;
  }

  .status-count {
    font-size: 16px;
  }

  .status-label {
    font-size: 10px;
  }

  .status-percentage {
    font-size: 9px;
  }

  .stats-header-row {
    grid-template-columns: 2fr 1fr 1.5fr;
    padding: 8px 10px;
    font-size: 10px;
    gap: 4px;
  }

  .work-type-item {
    grid-template-columns: 2fr 1fr 1.5fr;
    gap: 8px;
    padding: 10px;
  }

  .work-type-icon {
    padding: 4px;
  }

  .work-type-name {
    font-size: 11px;
  }

  .work-type-count {
    font-size: 12px;
  }

  .work-type-bar {
    flex-direction: row;
    gap: 6px;
  }

  .percentage-text {
    font-size: 10px;
    min-width: 25px;
  }

  .subsection-header-with-toggle {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .subsection-title {
    font-size: 12px;
  }

  .building-toggle-btn {
    font-size: 10px;
    height: 24px;
    min-width: 50px;
  }

  .building-simple {
    gap: 4px;
  }

  .building-simple-item {
    padding: 4px 8px;
    gap: 4px;
  }

  .building-simple-name {
    font-size: 10px;
  }

  .building-simple-count {
    font-size: 9px;
    padding: 1px 4px;
  }

  .building-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .building-item {
    padding: 10px;
  }

  .building-name {
    font-size: 11px;
  }

  .building-count {
    font-size: 14px;
  }

  .urgency-alert {
    padding: 10px;
    gap: 8px;
  }

  .urgency-text {
    font-size: 12px;
  }

  .time-item {
    padding: 8px 10px;
    font-size: 12px;
  }
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .metric-card:hover,
  .status-item:hover,
  .work-type-item:hover,
  .building-item:hover {
    transform: none;
    box-shadow: initial;
  }
}

/* 애니메이션 줄임 설정 */
@media (prefers-reduced-motion: reduce) {
  .metric-card,
  .status-item,
  .urgency-alert,
  .work-type-item,
  .building-item {
    transition: none;
  }

  .metric-card:hover,
  .status-item:hover,
  .work-type-item:hover,
  .building-item:hover {
    transform: none;
  }
}

/* 다크모드 준비 */
@media (prefers-color-scheme: dark) {
  .advanced-stats-card {
    background: #1e293b;
    border-color: #334155;
  }

  .main-metrics {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  }

  .metric-card,
  .work-type-item,
  .building-item {
    background: #334155;
    border-color: #475569;
  }

  .metric-number,
  .status-count,
  .work-type-count,
  .building-count {
    color: #f1f5f9;
  }

  .metric-label,
  .status-label,
  .work-type-name,
  .building-name {
    color: #94a3b8;
  }
}
</style>
