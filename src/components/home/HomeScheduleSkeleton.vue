<template>
  <div class="schedule-skeleton">
    <div v-for="i in 3" :key="i" class="skeleton-section">
      <div class="skeleton-section-header">
        <div class="skeleton-section-icon"></div>
        <div class="skeleton-section-title"></div>
        <div class="skeleton-section-count"></div>
      </div>
      <div class="skeleton-cards">
        <div v-for="j in 2" :key="j" class="skeleton-card">
          <div class="skeleton-card-header">
            <div class="skeleton-building-info">
              <div class="skeleton-building-icon"></div>
              <div class="skeleton-building-text">
                <div class="skeleton-building-name"></div>
                <div class="skeleton-room-number"></div>
              </div>
            </div>
            <div class="skeleton-badges">
              <div class="skeleton-badge"></div>
              <div class="skeleton-badge"></div>
            </div>
          </div>
          <div class="skeleton-card-body">
            <div class="skeleton-task-chips">
              <div class="skeleton-chip"></div>
              <div class="skeleton-chip"></div>
            </div>
            <div class="skeleton-memo"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule-skeleton {
  margin-top: 24px;
}

.skeleton-section {
  margin-bottom: 32px;
}

.skeleton-section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
}

.skeleton-section-icon {
  width: 32px;
  height: 32px;
  background: #e2e8f0;
  border-radius: 8px;
  animation: pulse 2s infinite;
}

.skeleton-section-title {
  height: 24px;
  background: #e2e8f0;
  border-radius: 6px;
  flex: 1;
  max-width: 200px;
  animation: pulse 2s infinite;
}

.skeleton-section-count {
  width: 40px;
  height: 24px;
  background: #e2e8f0;
  border-radius: 12px;
  animation: pulse 2s infinite;
}

.skeleton-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.skeleton-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.skeleton-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.skeleton-building-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.skeleton-building-icon {
  width: 40px;
  height: 40px;
  background: #e2e8f0;
  border-radius: 10px;
  animation: pulse 2s infinite;
}

.skeleton-building-text {
  flex: 1;
}

.skeleton-building-name {
  height: 20px;
  background: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 6px;
  width: 120px;
  animation: pulse 2s infinite;
}

.skeleton-room-number {
  height: 16px;
  background: #e2e8f0;
  border-radius: 4px;
  width: 80px;
  animation: pulse 2s infinite;
}

.skeleton-badges {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-badge {
  width: 80px;
  height: 24px;
  background: #e2e8f0;
  border-radius: 12px;
  animation: pulse 2s infinite;
}

.skeleton-card-body {
  border-top: 1px solid #f1f5f9;
  padding-top: 16px;
}

.skeleton-task-chips {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.skeleton-chip {
  width: 60px;
  height: 28px;
  background: #e2e8f0;
  border-radius: 14px;
  animation: pulse 2s infinite;
}

.skeleton-memo {
  height: 16px;
  background: #e2e8f0;
  border-radius: 4px;
  width: 100%;
  animation: pulse 2s infinite;
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
</style>
