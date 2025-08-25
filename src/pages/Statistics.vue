<template>
  <v-app>
    <!-- 🎨 새로운 현대적 헤더 -->
    <v-app-bar :elevation="0" class="custom-header" height="80">
      <div class="d-flex align-center justify-space-between w-100 px-6">
        <div class="d-flex align-center">
          <v-btn
            icon
            size="large"
            class="back-btn mr-3"
            @click="goBack"
            aria-label="뒤로가기"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>

          <div class="header-icon-wrapper">
            <v-icon size="32">mdi-chart-multiple</v-icon>
          </div>
          <div class="ml-3">
            <h2 class="header-title">데이터 인사이트</h2>
            <div class="header-subtitle">실시간 비즈니스 분석 대시보드</div>
          </div>
        </div>

        <div class="d-flex align-center">
          <v-chip
            color="rgba(255,255,255,0.2)"
            variant="tonal"
            size="small"
            class="date-chip mr-3"
            prepend-icon="mdi-calendar-range"
          >
            {{ dateRangeText }}
          </v-chip>

          <v-btn
            icon
            size="large"
            class="refresh-btn"
            @click="refreshData"
            :loading="isLoading"
            aria-label="새로고침"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </div>
    </v-app-bar>

    <v-main class="dashboard-main">
      <div class="dashboard-container">
        <!-- 🚨 에러 상태 -->
        <v-alert
          v-if="error"
          type="error"
          class="error-alert"
          prominent
          closable
          @click:close="clearError"
        >
          <template v-slot:prepend>
            <v-icon>mdi-alert-circle</v-icon>
          </template>
          {{ error }}
        </v-alert>

        <!-- 📊 메인 대시보드 -->
        <div v-if="!isLoading" class="dashboard-content">
          <!-- 🔢 KPI 카드 섹션 -->
          <div class="kpi-section">
            <div class="section-header">
              <h2 class="section-title">핵심 지표</h2>
              <p class="section-subtitle">주요 성과 지표 한눈에 보기</p>
            </div>

            <div class="kpi-grid">
              <div
                v-for="(kpi, index) in kpiMetrics"
                :key="kpi.key"
                class="kpi-card"
                :class="`kpi-${kpi.key}`"
                :style="{ animationDelay: `${index * 0.1}s` }"
              >
                <div class="kpi-icon" :style="{ background: kpi.gradient }">
                  <v-icon :color="kpi.iconColor" size="32">{{
                    kpi.icon
                  }}</v-icon>
                </div>

                <div class="kpi-content">
                  <div class="kpi-value" :style="{ color: kpi.valueColor }">
                    {{ kpi.value }}
                  </div>
                  <div class="kpi-label">{{ kpi.label }}</div>
                  <div class="kpi-trend" v-if="kpi.trend">
                    <v-icon :color="kpi.trend.color" size="16" class="mr-1">
                      {{ kpi.trend.icon }}
                    </v-icon>
                    <span :style="{ color: kpi.trend.color }">{{
                      kpi.trend.text
                    }}</span>
                  </div>
                </div>

                <div class="kpi-chart" v-if="kpi.chartData">
                  <div class="mini-chart">
                    <div
                      v-for="(bar, i) in kpi.chartData"
                      :key="i"
                      class="mini-bar"
                      :style="{
                        height: `${bar}%`,
                        backgroundColor: kpi.valueColor,
                        animationDelay: `${index * 0.1 + i * 0.05}s`,
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 📈 인터랙티브 차트 섹션 -->
          <div class="charts-section">
            <div class="section-header">
              <h2 class="section-title">상세 분석</h2>
              <p class="section-subtitle">데이터 트렌드와 분포 분석</p>
            </div>

            <div class="charts-grid">
              <!-- 작업 상태 분포 (도넛 차트 스타일) -->
              <div class="chart-card modern-chart">
                <div class="chart-header">
                  <div class="chart-title-group">
                    <v-icon color="primary" class="mr-2"
                      >mdi-chart-donut</v-icon
                    >
                    <h3 class="chart-title">작업 상태 분포</h3>
                  </div>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="toggleChartView('status')"
                  >
                    <v-icon size="18">mdi-eye</v-icon>
                  </v-btn>
                </div>

                <div class="chart-content">
                  <div class="donut-chart-container">
                    <div class="donut-chart">
                      <div class="donut-center">
                        <div class="donut-total">{{ stats.total }}</div>
                        <div class="donut-label">전체 작업</div>
                      </div>
                      <svg class="donut-svg" viewBox="0 0 100 100">
                        <circle
                          v-for="(segment, index) in donutSegments"
                          :key="segment.status"
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          :stroke="segment.color"
                          stroke-width="8"
                          :stroke-dasharray="segment.dashArray"
                          :stroke-dashoffset="segment.dashOffset"
                          :style="{ animationDelay: `${index * 0.2}s` }"
                          class="donut-segment"
                        />
                      </svg>
                    </div>

                    <div class="donut-legend">
                      <div
                        v-for="(item, index) in statusLegend"
                        :key="item.status"
                        class="legend-item"
                        :style="{ animationDelay: `${index * 0.1}s` }"
                        @click="filterByStatus(item.status)"
                      >
                        <div
                          class="legend-color"
                          :style="{ backgroundColor: item.color }"
                        ></div>
                        <div class="legend-text">
                          <div class="legend-label">{{ item.status }}</div>
                          <div class="legend-value">
                            {{ item.count }}건 ({{ item.percentage }}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 월별 추이 (라인 차트 스타일) -->
              <div class="chart-card modern-chart">
                <div class="chart-header">
                  <div class="chart-title-group">
                    <v-icon color="success" class="mr-2">mdi-chart-line</v-icon>
                    <h3 class="chart-title">월별 작업 추이</h3>
                  </div>
                  <div class="chart-controls">
                    <v-btn-toggle
                      v-model="trendPeriod"
                      size="x-small"
                      variant="outlined"
                      color="success"
                    >
                      <v-btn value="6m">6개월</v-btn>
                      <v-btn value="12m">1년</v-btn>
                    </v-btn-toggle>
                  </div>
                </div>

                <div class="chart-content">
                  <div class="trend-chart">
                    <div class="trend-grid">
                      <div v-for="i in 5" :key="i" class="grid-line"></div>
                    </div>

                    <div class="trend-bars">
                      <div
                        v-for="(month, index) in monthlyData"
                        :key="month.month"
                        class="trend-bar-container"
                        @mouseenter="hoveredMonth = month"
                        @mouseleave="hoveredMonth = null"
                      >
                        <div class="trend-bar-wrapper">
                          <div
                            class="trend-bar"
                            :style="{
                              height: `${getMonthlyBarHeight(month.count)}%`,
                              animationDelay: `${index * 0.1}s`,
                            }"
                          ></div>
                          <div
                            v-if="hoveredMonth === month"
                            class="trend-tooltip"
                          >
                            <div class="tooltip-value">{{ month.count }}건</div>
                            <div class="tooltip-label">{{ month.label }}</div>
                          </div>
                        </div>
                        <div class="trend-label">{{ month.label }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 건물별 현황 (수평 바 차트) -->
              <div class="chart-card modern-chart">
                <div class="chart-header">
                  <div class="chart-title-group">
                    <v-icon color="info" class="mr-2"
                      >mdi-office-building</v-icon
                    >
                    <h3 class="chart-title">건물별 작업 현황</h3>
                  </div>
                  <v-chip size="small" color="info" variant="tonal">
                    {{ Object.keys(stats.byBuilding).length }}개 건물
                  </v-chip>
                </div>

                <div class="chart-content">
                  <div class="horizontal-bars">
                    <div
                      v-for="(building, index) in topBuildings"
                      :key="building.name"
                      class="bar-item"
                      :style="{ animationDelay: `${index * 0.1}s` }"
                      @click="filterByBuilding(building.name)"
                    >
                      <div class="bar-info">
                        <div class="bar-label">{{ building.name }}</div>
                        <div class="bar-value">{{ building.count }}건</div>
                      </div>
                      <div class="bar-track">
                        <div
                          class="bar-fill"
                          :style="{
                            width: `${building.percentage}%`,
                            background: `linear-gradient(90deg, ${building.color}AA, ${building.color})`,
                            animationDelay: `${index * 0.1 + 0.3}s`,
                          }"
                        ></div>
                      </div>
                      <div class="bar-percentage">
                        {{ building.percentage }}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 작업 종류 분포 (태그 클라우드 스타일) -->
              <div class="chart-card modern-chart">
                <div class="chart-header">
                  <div class="chart-title-group">
                    <v-icon color="warning" class="mr-2">mdi-wrench</v-icon>
                    <h3 class="chart-title">작업 종류 분포</h3>
                  </div>
                  <v-chip size="small" color="warning" variant="tonal">
                    {{ Object.keys(stats.byWorkType).length }}개 유형
                  </v-chip>
                </div>

                <div class="chart-content">
                  <div class="work-type-cloud">
                    <div
                      v-for="(workType, index) in workTypeCloud"
                      :key="workType.name"
                      class="work-type-tag"
                      :style="{
                        fontSize: `${workType.size}px`,
                        color: workType.color,
                        animationDelay: `${index * 0.05}s`,
                      }"
                      @click="filterByWorkType(workType.name)"
                    >
                      {{ workType.name }}
                      <span class="work-type-count"
                        >({{ workType.count }})</span
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- 효율성 지표 (게이지 스타일) -->
              <div class="chart-card modern-chart">
                <div class="chart-header">
                  <div class="chart-title-group">
                    <v-icon color="success" class="mr-2"
                      >mdi-speedometer</v-icon
                    >
                    <h3 class="chart-title">효율성 지표</h3>
                  </div>
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="success"
                    @click="showEfficiencyDetails = !showEfficiencyDetails"
                  >
                    상세보기
                  </v-btn>
                </div>

                <div class="chart-content">
                  <div class="efficiency-gauges">
                    <div class="gauge-container">
                      <div class="gauge-item">
                        <div class="gauge">
                          <div class="gauge-track"></div>
                          <div
                            class="gauge-fill"
                            :style="{
                              transform: `rotate(${(stats.efficiency / 100) * 180}deg)`,
                              animationDelay: '0.5s',
                            }"
                          ></div>
                          <div class="gauge-center">
                            <div class="gauge-value">
                              {{ stats.efficiency.toFixed(1) }}%
                            </div>
                            <div class="gauge-label">완료율</div>
                          </div>
                        </div>
                      </div>

                      <div class="gauge-item">
                        <div class="gauge">
                          <div class="gauge-track"></div>
                          <div
                            class="gauge-fill secondary"
                            :style="{
                              transform: `rotate(${(stats.averageProgress / 100) * 180}deg)`,
                              animationDelay: '0.7s',
                            }"
                          ></div>
                          <div class="gauge-center">
                            <div class="gauge-value">
                              {{ stats.averageProgress }}%
                            </div>
                            <div class="gauge-label">평균 진행률</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="showEfficiencyDetails"
                      class="efficiency-details"
                    >
                      <div class="detail-row">
                        <span class="detail-label">일 평균 작업량</span>
                        <span class="detail-value"
                          >{{ dailyAverage.toFixed(1) }}건/일</span
                        >
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">주 평균 작업량</span>
                        <span class="detail-value"
                          >{{ weeklyAverage.toFixed(1) }}건/주</span
                        >
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">복잡도 지수</span>
                        <span class="detail-value">{{
                          complexityIndex.toFixed(1)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 긴급도 분석 (알림 스타일) -->
              <div class="chart-card modern-chart urgent-card">
                <div class="chart-header">
                  <div class="chart-title-group">
                    <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
                    <h3 class="chart-title">긴급도 분석</h3>
                  </div>
                  <v-chip
                    v-if="stats.overdue + stats.today > 0"
                    size="small"
                    color="error"
                    variant="flat"
                    class="urgent-badge"
                  >
                    <v-icon start size="12">mdi-fire</v-icon>
                    {{ stats.overdue + stats.today }}건 긴급
                  </v-chip>
                </div>

                <div class="chart-content">
                  <div class="urgency-items">
                    <div
                      v-for="(urgency, index) in urgencyItems"
                      :key="urgency.type"
                      class="urgency-item"
                      :class="urgency.class"
                      :style="{ animationDelay: `${index * 0.1}s` }"
                      @click="filterByUrgency(urgency.type)"
                    >
                      <div class="urgency-icon">
                        <v-icon :color="urgency.color" size="20">{{
                          urgency.icon
                        }}</v-icon>
                      </div>
                      <div class="urgency-content">
                        <div class="urgency-label">{{ urgency.label }}</div>
                        <div class="urgency-count">{{ urgency.count }}건</div>
                      </div>
                      <div
                        class="urgency-indicator"
                        :style="{ backgroundColor: urgency.color }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 📋 액션 가능한 인사이트 -->
          <div class="insights-section">
            <div class="section-header">
              <h2 class="section-title">실행 가능한 인사이트</h2>
              <p class="section-subtitle">데이터 기반 의사결정 가이드</p>
            </div>

            <div class="insights-grid">
              <div
                v-for="(insight, index) in actionableInsights"
                :key="insight.id"
                class="insight-card"
                :class="insight.priority"
                :style="{ animationDelay: `${index * 0.1}s` }"
              >
                <div class="insight-header">
                  <v-icon :color="insight.color" class="insight-icon">{{
                    insight.icon
                  }}</v-icon>
                  <div class="insight-priority">{{ insight.priorityText }}</div>
                </div>
                <div class="insight-content">
                  <h4 class="insight-title">{{ insight.title }}</h4>
                  <p class="insight-description">{{ insight.description }}</p>
                </div>
                <div class="insight-action">
                  <v-btn
                    :color="insight.color"
                    variant="tonal"
                    size="small"
                    @click="executeInsight(insight)"
                  >
                    {{ insight.actionText }}
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 🌀 모던 로딩 상태 -->
        <div v-else class="loading-container">
          <div class="loading-content">
            <div class="loading-spinner">
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
            </div>
            <h3 class="loading-title">데이터 분석 중...</h3>
            <p class="loading-subtitle">최신 인사이트를 준비하고 있습니다</p>
          </div>

          <div class="loading-skeleton">
            <div class="skeleton-kpis">
              <div v-for="i in 4" :key="i" class="skeleton-kpi"></div>
            </div>
            <div class="skeleton-charts">
              <div v-for="i in 6" :key="i" class="skeleton-chart"></div>
            </div>
          </div>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'
import { calculateAdvancedStats } from '@/utils/statusUtils'

const router = useRouter()
const scheduleStore = useScheduleStore()
const userStore = useUserStore()

// 🎯 상태 관리
const isLoading = ref(true)
const error = ref('')
const trendPeriod = ref('12m')
const hoveredMonth = ref(null)
const showEfficiencyDetails = ref(false)

// 🎨 현대적 색상 팔레트
const colorPalette = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  orange: '#f97316',
  rose: '#f43f5e',
}

// 📊 통계 데이터 계산
const stats = computed(() => {
  const schedules = scheduleStore.schedules
  return calculateAdvancedStats(schedules)
})

// 🔢 KPI 메트릭 계산
const kpiMetrics = computed(() => [
  {
    key: 'total',
    label: '전체 작업',
    value: stats.value.total.toLocaleString(),
    icon: 'mdi-calendar-multiple',
    iconColor: 'white',
    valueColor: colorPalette.primary,
    gradient: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.purple})`,
    trend: {
      icon: 'mdi-trending-up',
      text: '+12% 이번달',
      color: colorPalette.success,
    },
    chartData: [65, 59, 80, 81, 56, 78, 65, 72],
  },
  {
    key: 'efficiency',
    label: '완료 효율성',
    value: `${stats.value.efficiency.toFixed(1)}%`,
    icon: 'mdi-chart-line-variant',
    iconColor: 'white',
    valueColor: colorPalette.success,
    gradient: `linear-gradient(135deg, ${colorPalette.success}, ${colorPalette.teal})`,
    trend: {
      icon:
        stats.value.efficiency > 75
          ? 'mdi-trending-up'
          : 'mdi-trending-neutral',
      text: stats.value.efficiency > 75 ? '우수' : '보통',
      color:
        stats.value.efficiency > 75
          ? colorPalette.success
          : colorPalette.warning,
    },
    chartData: [45, 52, 38, 65, 78, 82, 85, 78],
  },
  {
    key: 'progress',
    label: '평균 진행률',
    value: `${stats.value.averageProgress}%`,
    icon: 'mdi-progress-clock',
    iconColor: 'white',
    valueColor: colorPalette.warning,
    gradient: `linear-gradient(135deg, ${colorPalette.warning}, ${colorPalette.orange})`,
    trend: {
      icon: 'mdi-trending-up',
      text: '+5% 지난주',
      color: colorPalette.success,
    },
    chartData: [30, 45, 56, 62, 58, 65, 72, 68],
  },
  {
    key: 'urgent',
    label: '긴급 작업',
    value: stats.value.overdue + stats.value.today,
    icon: 'mdi-alert-circle',
    iconColor: 'white',
    valueColor: colorPalette.error,
    gradient: `linear-gradient(135deg, ${colorPalette.error}, ${colorPalette.rose})`,
    trend: {
      icon: stats.value.overdue > 0 ? 'mdi-alert' : 'mdi-check-circle',
      text: stats.value.overdue > 0 ? '주의 필요' : '관리 양호',
      color:
        stats.value.overdue > 0 ? colorPalette.error : colorPalette.success,
    },
    chartData: [15, 12, 8, 18, 22, 16, 14, 10],
  },
])

// 🍩 도넛 차트 데이터
const donutSegments = computed(() => {
  const total = stats.value.total
  if (total === 0) return []

  const statusColors = {
    완료: colorPalette.success,
    진행중: colorPalette.primary,
    예정됨: colorPalette.info,
    보류: colorPalette.warning,
    취소됨: colorPalette.error,
  }

  let currentOffset = 0
  return Object.entries(stats.value.byStatus).map(([status, count]) => {
    const percentage = (count / total) * 100
    const dashArray = `${percentage * 2.51} ${251.2 - percentage * 2.51}`
    const dashOffset = -currentOffset * 2.51
    currentOffset += percentage

    return {
      status,
      count,
      percentage: Math.round(percentage),
      color: statusColors[status] || colorPalette.info,
      dashArray,
      dashOffset,
    }
  })
})

const statusLegend = computed(() => {
  return donutSegments.value.map((segment) => ({
    status: segment.status,
    count: segment.count,
    percentage: segment.percentage,
    color: segment.color,
  }))
})

// 📈 월별 데이터
const monthlyData = computed(() => {
  const schedules = scheduleStore.schedules
  const monthCounts = {}

  schedules.forEach((schedule) => {
    const date = new Date(schedule.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
  })

  const now = new Date()
  const monthsToShow = trendPeriod.value === '6m' ? 6 : 12
  const months = []

  for (let i = monthsToShow - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months.push({
      month: monthKey,
      label: `${date.getMonth() + 1}월`,
      count: monthCounts[monthKey] || 0,
      fullDate: date,
    })
  }

  return months
})

// 🏢 상위 건물 데이터
const topBuildings = computed(() => {
  const buildings = stats.value.byBuilding
  const total = Object.values(buildings).reduce((sum, count) => sum + count, 0)
  const colors = [
    colorPalette.primary,
    colorPalette.success,
    colorPalette.warning,
    colorPalette.info,
    colorPalette.purple,
  ]

  return Object.entries(buildings)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count], index) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
      color: colors[index % colors.length],
    }))
})

// 🏷️ 작업 종류 태그 클라우드
const workTypeCloud = computed(() => {
  const workTypes = stats.value.byWorkType
  const maxCount = Math.max(...Object.values(workTypes))
  const colors = [
    colorPalette.primary,
    colorPalette.success,
    colorPalette.warning,
    colorPalette.info,
    colorPalette.purple,
    colorPalette.teal,
  ]

  return Object.entries(workTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([name, count], index) => ({
      name,
      count,
      size: Math.max(12, Math.min(24, (count / maxCount) * 20 + 12)),
      color: colors[index % colors.length],
    }))
})

// 🚨 긴급도 아이템
const urgencyItems = computed(() => [
  {
    type: 'overdue',
    label: '기한 초과',
    count: stats.value.overdue,
    icon: 'mdi-clock-alert',
    color: colorPalette.error,
    class: 'critical',
  },
  {
    type: 'today',
    label: '오늘 마감',
    count: stats.value.today,
    icon: 'mdi-calendar-today',
    color: colorPalette.warning,
    class: 'urgent',
  },
  {
    type: 'thisWeek',
    label: '이번 주',
    count: stats.value.thisWeek,
    icon: 'mdi-calendar-week',
    color: colorPalette.info,
    class: 'normal',
  },
  {
    type: 'recent',
    label: '최근 30일',
    count: recentMonthCount.value,
    icon: 'mdi-calendar-month',
    color: colorPalette.success,
    class: 'info',
  },
])

// 💡 실행 가능한 인사이트
const actionableInsights = computed(() => {
  const insights = []

  if (stats.value.overdue > 0) {
    insights.push({
      id: 'overdue',
      title: '기한 초과 작업 처리 필요',
      description: `${stats.value.overdue}건의 작업이 기한을 초과했습니다. 즉시 확인이 필요합니다.`,
      priority: 'high',
      priorityText: '높음',
      color: colorPalette.error,
      icon: 'mdi-alert-circle',
      actionText: '확인하기',
    })
  }

  if (stats.value.efficiency < 70) {
    insights.push({
      id: 'efficiency',
      title: '완료율 개선 기회',
      description: `현재 완료율이 ${stats.value.efficiency.toFixed(1)}%입니다. 70% 이상 달성을 목표로 개선해보세요.`,
      priority: 'medium',
      priorityText: '보통',
      color: colorPalette.warning,
      icon: 'mdi-trending-up',
      actionText: '개선 방안',
    })
  }

  if (stats.value.today > 5) {
    insights.push({
      id: 'today',
      title: '오늘 집중 필요',
      description: `오늘 ${stats.value.today}건의 작업이 예정되어 있습니다. 우선순위를 점검해보세요.`,
      priority: 'medium',
      priorityText: '보통',
      color: colorPalette.info,
      icon: 'mdi-calendar-today',
      actionText: '일정 확인',
    })
  }

  const topBuilding = Object.entries(stats.value.byBuilding).sort(
    ([, a], [, b]) => b - a
  )[0]
  if (topBuilding && topBuilding[1] > stats.value.total * 0.3) {
    insights.push({
      id: 'building',
      title: '작업 집중도 분석',
      description: `${topBuilding[0]} 건물에 전체 작업의 ${Math.round((topBuilding[1] / stats.value.total) * 100)}%가 집중되어 있습니다.`,
      priority: 'low',
      priorityText: '낮음',
      color: colorPalette.success,
      icon: 'mdi-office-building',
      actionText: '분석 보기',
      buildingName: topBuilding[0], // 건물 이름 추가
    })
  }

  return insights
})

// 🧮 계산된 값들
const dailyAverage = computed(() => {
  const totalDays = 365
  return stats.value.total / totalDays
})

const weeklyAverage = computed(() => {
  const totalWeeks = 52
  return stats.value.total / totalWeeks
})

const complexityIndex = computed(() => {
  const complexCounts = stats.value.byComplexity
  const simple = complexCounts['단순'] || 0
  const medium = complexCounts['보통'] || 0
  const complex = complexCounts['복잡'] || 0
  return (
    (simple * 1 + medium * 2 + complex * 3) / Math.max(stats.value.total, 1)
  )
})

const recentMonthCount = computed(() => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return scheduleStore.schedules.filter((schedule) => {
    const scheduleDate = new Date(schedule.date)
    return scheduleDate >= thirtyDaysAgo
  }).length
})

const dateRangeText = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}년 누적`
})

// 🛠️ 유틸리티 함수들
const getMonthlyBarHeight = (count) => {
  const maxCount = Math.max(...monthlyData.value.map((m) => m.count))
  return maxCount > 0 ? Math.max(8, (count / maxCount) * 100) : 8
}

// highlightSegment는 filterByStatus로 대체됨

const toggleChartView = (chartType) => {
  // 차트 뷰 토글 로직
  console.log('Toggling chart view:', chartType)
}

// 🔍 필터링 함수들
const filterByStatus = (status) => {
  // 상태별 필터링
  router.push(`/schedules?status=${encodeURIComponent(status)}`)
}

const filterByBuilding = (building) => {
  // 건물별 필터링
  router.push(`/schedules?building=${encodeURIComponent(building)}`)
}

const filterByWorkType = (workType) => {
  // 작업 종류별 필터링
  router.push(`/schedules?workType=${encodeURIComponent(workType)}`)
}

const filterByUrgency = (urgency) => {
  // 긴급도별 필터링
  router.push(`/schedules?urgency=${urgency}`)
}

const executeInsight = (insight) => {
  // 인사이트 실행 로직
  switch (insight.id) {
    case 'overdue':
      router.push('/schedules?urgency=overdue')
      break
    case 'today':
      router.push('/schedules?urgency=today')
      break
    case 'building':
      // 해당 건물로 필터링된 작업 목록 페이지로 이동
      router.push(
        `/schedules?building=${encodeURIComponent(insight.buildingName)}`
      )
      break
    case 'efficiency':
      // 효율성 개선 가이드 표시 - 완료된 작업만 보기
      router.push('/schedules?status=완료')
      break
    default:
      console.log('Executing insight:', insight.id)
  }
}

// 🔄 데이터 새로고침
const refreshData = async () => {
  isLoading.value = true
  try {
    await scheduleStore.fetchAllSchedules()
  } catch (err) {
    error.value = '데이터를 불러오는 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}

// 🎯 이벤트 핸들러
const goBack = () => {
  router.go(-1)
}

const clearError = () => {
  error.value = ''
}

// 🚀 라이프사이클
onMounted(async () => {
  try {
    const authResult = await userStore.initializeAuth(router)
    if (!authResult.success) {
      error.value = authResult.error
      return
    }
    await refreshData()
  } catch (err) {
    error.value = '초기화 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
})

// 👀 트렌드 기간 변경 감시
watch(trendPeriod, () => {
  // 트렌드 기간 변경시 데이터 재계산
})
</script>

<style scoped>
/* 🎨 현대적 기본 스타일 */
* {
  box-sizing: border-box;
}

/* 📱 헤더 스타일 */
.custom-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2) !important;
}

.v-app-bar.custom-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
}

.v-app-bar.custom-header .v-toolbar__content {
  background: transparent !important;
}

.back-btn,
.refresh-btn {
  background: rgba(100, 116, 139, 0.1) !important;
  color: #64748b !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
}

.back-btn:hover,
.refresh-btn:hover,
.back-btn:focus,
.refresh-btn:focus {
  background: rgba(100, 116, 139, 0.2) !important;
  transform: translateY(-1px);
}

.header-icon-wrapper {
  width: 48px !important;
  height: 48px !important;
  border-radius: 12px !important;
  background: rgba(100, 116, 139, 0.15) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  backdrop-filter: blur(10px) !important;
}

.header-icon-wrapper .v-icon {
  color: #64748b !important;
}

.header-title {
  color: #475569 !important;
  font-weight: 700 !important;
  font-size: 24px !important;
  margin: 0 !important;
}

.header-subtitle {
  color: rgba(71, 85, 105, 0.7) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
}

.date-chip {
  background: rgba(100, 116, 139, 0.1) !important;
  color: #64748b !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(100, 116, 139, 0.2) !important;
}

/* 🌍 메인 컨테이너 */
.dashboard-main {
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

.dashboard-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 32px;
}

.error-alert {
  margin-bottom: 32px;
  border-radius: 16px !important;
}

/* 📊 섹션 스타일 */
.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-title {
  font-size: 32px;
  font-weight: 800;
  color: #1a202c;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.section-subtitle {
  font-size: 16px;
  color: #64748b;
  font-weight: 500;
  margin: 0;
}

/* 🔢 KPI 카드 그리드 */
.kpi-section {
  margin-bottom: 64px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.kpi-card {
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  gap: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.kpi-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
}

.kpi-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-content {
  flex: 1;
}

.kpi-value {
  font-size: 36px;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 8px;
}

.kpi-label {
  font-size: 16px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
}

.kpi-trend {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
}

.kpi-chart {
  width: 80px;
  height: 40px;
}

.mini-chart {
  display: flex;
  align-items: end;
  gap: 2px;
  height: 100%;
}

.mini-bar {
  flex: 1;
  border-radius: 2px;
  opacity: 0.7;
  animation: growUp 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  transform: scaleY(0);
}

/* 📈 차트 섹션 */
.charts-section {
  margin-bottom: 64px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 32px;
}

.chart-card {
  background: white;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.chart-title-group {
  display: flex;
  align-items: center;
}

.chart-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.chart-content {
  padding: 24px 32px 32px;
}

/* 🍩 도넛 차트 */
.donut-chart-container {
  display: flex;
  align-items: center;
  gap: 32px;
}

.donut-chart {
  position: relative;
  width: 200px;
  height: 200px;
  flex-shrink: 0;
}

.donut-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.donut-segment {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  animation: drawCircle 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.donut-total {
  font-size: 36px;
  font-weight: 900;
  color: #1a202c;
  line-height: 1;
}

.donut-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
  margin-top: 4px;
}

.donut-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInRight 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  transform: translateX(20px);
}

.legend-item:hover {
  background: #f8fafc;
  transform: translateX(4px);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-text {
  flex: 1;
}

.legend-label {
  font-weight: 600;
  color: #1a202c;
  font-size: 15px;
}

.legend-value {
  font-size: 13px;
  color: #64748b;
}

/* 📊 트렌드 차트 */
.trend-chart {
  position: relative;
  height: 200px;
}

.trend-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.grid-line {
  height: 1px;
  background: #f1f5f9;
}

.trend-bars {
  display: flex;
  align-items: end;
  gap: 8px;
  height: 100%;
  padding-bottom: 40px;
}

.trend-bar-container {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.trend-bar-wrapper {
  position: relative;
  flex: 1;
  width: 100%;
  display: flex;
  align-items: end;
}

.trend-bar {
  width: 100%;
  background: linear-gradient(to top, #10b981, #34d399);
  border-radius: 4px 4px 0 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: growUp 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  transform: scaleY(0);
  transform-origin: bottom;
}

.trend-bar:hover {
  background: linear-gradient(to top, #059669, #10b981);
}

.trend-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #1a202c;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.trend-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #1a202c;
}

.trend-label {
  margin-top: 12px;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

/* 📊 수평 바 차트 */
.horizontal-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  transform: translateX(-20px);
}

.bar-item:hover {
  background: rgba(0, 0, 0, 0.02);
  transform: translateX(4px);
}

.bar-info {
  min-width: 120px;
  text-align: right;
}

.bar-label {
  font-weight: 600;
  color: #1a202c;
  font-size: 14px;
}

.bar-value {
  font-size: 12px;
  color: #64748b;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  animation: fillBar 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  width: 0%;
}

.bar-percentage {
  min-width: 48px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

/* 🏷️ 작업 종류 태그 클라우드 */
.work-type-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 20px;
}

.work-type-tag {
  font-weight: 700;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid currentColor;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInScale 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  transform: scale(0.8);
}

.work-type-tag:hover {
  transform: scale(1.1);
  background: currentColor;
  color: white !important;
}

.work-type-count {
  font-size: 0.8em;
  opacity: 0.7;
}

/* ⚡ 효율성 게이지 */
.efficiency-gauges {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.gauge-container {
  display: flex;
  justify-content: space-around;
  gap: 32px;
}

.gauge-item {
  text-align: center;
}

.gauge {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
}

.gauge-track {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 8px solid #f1f5f9;
  border-radius: 50%;
  border-bottom-color: transparent;
  border-left-color: transparent;
}

.gauge-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 8px solid #10b981;
  border-radius: 50%;
  border-bottom-color: transparent;
  border-left-color: transparent;
  transform-origin: center;
  transition: transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.gauge-fill.secondary {
  border-color: #f59e0b;
}

.gauge-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.gauge-value {
  font-size: 20px;
  font-weight: 900;
  color: #1a202c;
  line-height: 1;
}

.gauge-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  margin-top: 4px;
}

.efficiency-details {
  background: #f8fafc;
  border-radius: 16px;
  padding: 24px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  font-weight: 700;
  color: #1a202c;
}

/* 🚨 긴급도 카드 */
.urgent-card {
  border-left: 4px solid #ef4444;
}

.urgent-badge {
  animation: pulse 2s infinite;
}

.urgency-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.urgency-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  transform: translateX(-20px);
  position: relative;
}

.urgency-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.urgency-item.critical {
  background: rgba(239, 68, 68, 0.05);
}

.urgency-item.urgent {
  background: rgba(245, 158, 11, 0.05);
}

.urgency-item.normal {
  background: rgba(59, 130, 246, 0.05);
}

.urgency-item.info {
  background: rgba(16, 185, 129, 0.05);
}

.urgency-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.urgency-content {
  flex: 1;
}

.urgency-label {
  font-weight: 600;
  color: #1a202c;
  font-size: 15px;
}

.urgency-count {
  font-size: 24px;
  font-weight: 900;
  margin-top: 4px;
}

.urgency-indicator {
  width: 4px;
  height: 40px;
  border-radius: 2px;
  position: absolute;
  right: 16px;
}

/* 💡 인사이트 섹션 */
.insights-section {
  margin-bottom: 64px;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.insight-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.insight-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.insight-card.high {
  border-left: 4px solid #ef4444;
}

.insight-card.medium {
  border-left: 4px solid #f59e0b;
}

.insight-card.low {
  border-left: 4px solid #10b981;
}

.insight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.insight-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.insight-priority {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
}

.insight-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 8px 0;
}

.insight-description {
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.insight-action {
  text-align: right;
}

/* 🌀 로딩 상태 */
.loading-container {
  text-align: center;
  padding: 80px 20px;
}

.loading-content {
  margin-bottom: 60px;
}

.loading-spinner {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 32px;
}

.spinner-ring {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 64px;
  height: 64px;
  margin: 8px;
  border: 6px solid #667eea;
  border-radius: 50%;
  animation: spinnerRing 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #667eea transparent transparent transparent;
}

.spinner-ring:nth-child(1) {
  animation-delay: -0.45s;
}
.spinner-ring:nth-child(2) {
  animation-delay: -0.3s;
}
.spinner-ring:nth-child(3) {
  animation-delay: -0.15s;
}

.loading-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 8px 0;
}

.loading-subtitle {
  color: #64748b;
  font-size: 16px;
  margin: 0;
}

.loading-skeleton {
  max-width: 1200px;
  margin: 0 auto;
}

.skeleton-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.skeleton-kpi {
  height: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 20px;
}

.skeleton-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 32px;
}

.skeleton-chart {
  height: 300px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 24px;
}

/* 🎬 애니메이션 */
@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInScale {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes growUp {
  to {
    transform: scaleY(1);
  }
}

@keyframes fillBar {
  to {
    width: var(--target-width, 100%);
  }
}

@keyframes drawCircle {
  from {
    stroke-dashoffset: 251.2;
  }
  to {
    stroke-dashoffset: var(--final-offset);
  }
}

@keyframes spinnerRing {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 📱 반응형 디자인 */
@media (max-width: 1200px) {
  .dashboard-container {
    padding: 24px;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .donut-chart-container {
    flex-direction: column;
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .header-title {
    font-size: 24px;
  }

  .section-title {
    font-size: 28px;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .kpi-card {
    padding: 24px;
    flex-direction: column;
    text-align: center;
  }

  .gauge-container {
    flex-direction: column;
    gap: 24px;
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }

  .chart-header {
    padding: 20px 24px 12px;
  }

  .chart-content {
    padding: 20px 24px 24px;
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    padding: 12px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-icon {
    width: 40px;
    height: 40px;
  }

  .header-title {
    font-size: 20px;
  }

  .kpi-card {
    padding: 20px;
  }

  .kpi-value {
    font-size: 28px;
  }
}

/* 🎯 접근성 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

*:focus-visible {
  outline: 3px solid rgba(102, 126, 234, 0.5);
  outline-offset: 2px;
  border-radius: 4px;
}

/* 🎨 다크 모드 준비 */
@media (prefers-color-scheme: dark) {
  /* 다크 모드 스타일은 필요시 추가 */
}
</style>
