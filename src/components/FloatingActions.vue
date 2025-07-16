<template>
  <div class="floating-actions">
    <!-- 문서 관련 버튼 -->
    <div class="action-group">
      <div class="action-group-label">문서 관리</div>
      <div class="action-buttons">
        <v-btn 
          class="action-btn document-btn"
          @click="handleGoToEstimate"
          aria-label="견적서 작성"
        >
          <v-icon start>mdi-file-document-outline</v-icon>
          견적서
        </v-btn>
        <v-btn 
          class="action-btn document-btn"
          @click="handleGoToStatement"
          aria-label="거래명세서 작성"
        >
          <v-icon start>mdi-receipt</v-icon>
          거래명세서
        </v-btn>
      </div>
    </div>

    <!-- 주요 기능 버튼 -->
    <div class="action-group">
      <div class="action-group-label">주요 기능</div>
      <div class="action-buttons">
        <v-btn 
          class="action-btn feature-btn"
          color="info"
          @click="handleGoToWorker"
          aria-label="작업자별 보기"
        >
          <v-icon start>mdi-account-hard-hat</v-icon>
          작업자별
        </v-btn>
        <v-btn 
          class="action-btn feature-btn"
          color="success"
          @click="handleGoToPayroll"
          aria-label="정산 보기"
        >
          <v-icon start>mdi-calculator</v-icon>
          정산
        </v-btn>
        <v-btn 
          class="action-btn feature-btn primary-btn"
          color="primary"
          @click="handleGoToAdd"
          aria-label="새 작업 등록"
        >
          <v-icon start>mdi-plus-circle</v-icon>
          작업등록
        </v-btn>
      </div>
    </div>

    <!-- 전체 보기 버튼 -->
    <v-btn 
      class="view-all-btn"
      block
      size="large"
      variant="outlined"
      @click="handleGoToAll"
      aria-label="전체 작업 일정 보기"
    >
      <v-icon start>mdi-calendar-month</v-icon>
      전체 작업 일정 보기
    </v-btn>
  </div>
</template>

<script setup>
// 🚀 emit 정의 및 핸들러 함수들
const emit = defineEmits([
  'go-to-estimate',
  'go-to-statement',  
  'go-to-worker',
  'go-to-payroll',
  'go-to-add',
  'go-to-all'
])

// 🚀 이벤트 핸들러 함수들
const handleGoToEstimate = () => emit('go-to-estimate')
const handleGoToStatement = () => emit('go-to-statement')
const handleGoToWorker = () => emit('go-to-worker')
const handleGoToPayroll = () => emit('go-to-payroll')
const handleGoToAdd = () => emit('go-to-add')
const handleGoToAll = () => emit('go-to-all')
</script>

<style scoped>
/* 🎯 플로팅 액션 버튼 – 모바일/웹 동일 정렬 대응 */
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
}

.action-group {
  margin-bottom: 16px;
}

.action-group:last-child {
  margin-bottom: 0;
}

.action-group-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-buttons {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  gap: 8px;
}

.action-btn {
  flex: 1 1 0;
  min-width: 0;
  height: 48px;
  font-size: 14px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
  will-change: transform;
}

.action-btn:focus {
  outline: 2px solid rgba(79, 70, 229, 0.5);
  outline-offset: 2px;
}

.document-btn {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.document-btn:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

.feature-btn {
  font-weight: 600;
}

.primary-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
  color: white;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

.view-all-btn {
  margin-top: 12px;
  height: 56px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  will-change: transform;
}

.view-all-btn:hover,
.view-all-btn:focus {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

/* 🎯 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .action-btn:hover,
  .primary-btn:hover,
  .view-all-btn:hover {
    transform: none;
  }
}

/* ✅ 모바일 대응 (정렬 유지) */
@media (max-width: 600px) {
  .floating-actions {
    padding: 16px;
  }

  .action-btn {
    height: 44px;
    font-size: 13px;
    padding: 0 8px;
  }

  .view-all-btn {
    height: 48px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .action-btn {
    height: 40px;
    font-size: 12px;
    padding: 0 6px;
  }

  .action-group-label {
    font-size: 11px;
  }
}

/* 애니메이션 줄임 설정 */
@media (prefers-reduced-motion: reduce) {
  .action-btn,
  .view-all-btn {
    transition: none;
  }
  
  .action-btn:hover,
  .view-all-btn:hover {
    transform: none;
  }
}
</style>