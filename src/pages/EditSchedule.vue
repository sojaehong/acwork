<template>
  <v-app>
    <!-- 🎨 일관된 헤더 디자인 -->
    <v-app-bar :elevation="0" class="custom-header" height="80">
      <div class="d-flex align-center justify-space-between w-100 px-4">
        <div class="d-flex align-center">
          <v-btn icon size="large" class="back-btn mr-3" @click="goBack">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div class="header-icon-wrapper">
            <v-icon size="32">mdi-pencil</v-icon>
          </div>
          <div class="ml-3">
            <h2 class="header-title">작업 수정</h2>
            <div class="header-subtitle">작업 정보를 업데이트하세요</div>
          </div>
        </div>

        <div class="d-flex align-center">
          <!-- 저장 상태 표시 -->
          <v-chip v-if="hasChanges" color="warning" size="small" class="mr-2">
            <v-icon start size="14">mdi-circle-edit-outline</v-icon>
            수정됨
          </v-chip>
        </div>
      </div>
    </v-app-bar>

    <v-main class="main-content">
      <v-container
        class="pa-6"
        style="padding-bottom: 140px !important; max-width: 1000px"
      >
        <!-- 📅 날짜 선택 카드 -->
        <v-card class="form-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-calendar</v-icon>
            </div>
            <h3 class="card-title">날짜 선택</h3>
            <v-chip color="info" size="small" class="ml-2">필수</v-chip>
          </div>

          <div class="card-content">
            <div class="date-picker-wrapper">
              <flat-pickr
                v-model="form.date"
                :config="dateConfig"
                class="date-input"
                placeholder="작업 날짜를 선택하세요"
              />
            </div>
          </div>
        </v-card>

        <!-- 🏢 건물 선택 카드 -->
        <v-card class="form-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-office-building</v-icon>
            </div>
            <h3 class="card-title">건물 선택</h3>
            <v-chip color="info" size="small" class="ml-2">필수</v-chip>
          </div>

          <div class="card-content">
            <div class="option-grid">
              <v-btn
                v-for="b in buildings"
                :key="b"
                :variant="form.building === b ? 'flat' : 'outlined'"
                :color="form.building === b ? 'primary' : 'grey'"
                class="option-btn"
                @click="form.building = b"
              >
                <v-icon start v-if="form.building === b">mdi-check</v-icon>
                {{ b }}
              </v-btn>
            </div>

            <v-expand-transition>
              <div v-if="form.building === '기타'" class="mt-4">
                <v-text-field
                  v-model="form.buildingEtc"
                  label="건물명을 직접 입력하세요"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-office-building-outline"
                />
              </div>
            </v-expand-transition>
          </div>
        </v-card>

        <!-- 🏬 동 선택 카드 -->
        <v-card class="form-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-home-city</v-icon>
            </div>
            <h3 class="card-title">동 선택</h3>
            <v-chip color="warning" size="small" class="ml-2">선택사항</v-chip>
          </div>

          <div class="card-content">
            <div class="option-grid">
              <v-btn
                v-for="u in units"
                :key="u"
                :variant="form.unit === u ? 'flat' : 'outlined'"
                :color="form.unit === u ? 'primary' : 'grey'"
                class="option-btn"
                @click="form.unit = u"
              >
                <v-icon start v-if="form.unit === u">mdi-check</v-icon>
                {{ u }}
              </v-btn>
            </div>

            <v-expand-transition>
              <div v-if="form.unit === '기타'" class="mt-4">
                <v-text-field
                  v-model="form.unitEtc"
                  label="동을 직접 입력하세요"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-home-city-outline"
                />
              </div>
            </v-expand-transition>
          </div>
        </v-card>

        <!-- 🏠 호수 입력 카드 -->
        <v-card class="form-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-home</v-icon>
            </div>
            <h3 class="card-title">호수 입력</h3>
            <v-chip color="warning" size="small" class="ml-2">선택사항</v-chip>
          </div>

          <div class="card-content">
            <v-text-field
              v-model="form.room"
              label="호수를 입력하세요 (예: 101, 201A)"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-home-outline"
            />
          </div>
        </v-card>

        <!-- 💪 작업 내용 카드 -->
        <v-card class="form-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-wrench</v-icon>
            </div>
            <h3 class="card-title">작업 내용 및 수량</h3>
            <v-chip
              :color="form.tasks.length > 0 ? 'success' : 'warning'"
              size="small"
              class="ml-2"
            >
              {{ form.tasks.length }}개
            </v-chip>
          </div>

          <div class="card-content">
            <transition-group name="task-fade" tag="div">
              <div
                v-for="(task, index) in form.tasks"
                :key="task.id"
                class="task-item"
              >
                <!-- 작업 번호 -->
                <div class="task-number">{{ index + 1 }}</div>

                <!-- 작업 종류 선택 -->
                <div class="task-type-section">
                  <label class="task-label">작업 종류</label>
                  <div class="task-type-grid">
                    <v-btn
                      v-for="t in types"
                      :key="t"
                      :variant="task.name === t ? 'flat' : 'outlined'"
                      :color="task.name === t ? 'secondary' : 'grey'"
                      size="small"
                      class="type-btn"
                      @click="task.name = t"
                    >
                      <v-icon start v-if="task.name === t" size="14"
                        >mdi-check</v-icon
                      >
                      {{ t }}
                    </v-btn>
                  </div>
                </div>

                <!-- 기타 입력 -->
                <v-expand-transition>
                  <div v-if="task.name === '기타'" class="task-etc-section">
                    <v-text-field
                      v-model="task.etc"
                      label="작업명을 직접 입력하세요"
                      variant="outlined"
                      density="compact"
                      prepend-inner-icon="mdi-pencil"
                    />
                  </div>
                </v-expand-transition>

                <!-- 수량 입력 -->
                <div class="task-count-section">
                  <label class="task-label">수량</label>
                  <v-text-field
                    v-model.number="task.count"
                    type="number"
                    min="1"
                    variant="outlined"
                    density="compact"
                    style="max-width: 120px"
                    prepend-inner-icon="mdi-counter"
                  />
                </div>

                <!-- 삭제 버튼 -->
                <v-btn
                  icon
                  variant="text"
                  color="error"
                  size="small"
                  class="task-delete-btn"
                  @click="removeTask(task.id)"
                  :disabled="form.tasks.length === 1"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </transition-group>

            <!-- 작업 추가 버튼 -->
            <v-btn
              color="success"
              variant="outlined"
              block
              class="mt-4 add-task-btn"
              @click="addTask"
            >
              <v-icon start>mdi-plus</v-icon>
              작업 추가하기
            </v-btn>
          </div>
        </v-card>

        <!-- 📌 작업 상태 카드 -->
        <v-card class="form-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-flag</v-icon>
            </div>
            <h3 class="card-title">작업 상태</h3>
            <v-chip color="info" size="small" class="ml-2">필수</v-chip>
          </div>

          <div class="card-content">
            <div class="status-grid">
              <v-btn
                v-for="s in statuses"
                :key="s"
                :variant="form.status === s ? 'flat' : 'outlined'"
                :color="getStatusColor(s, form.status === s)"
                class="status-btn"
                @click="form.status = s"
              >
                <v-icon start>{{ getStatusIcon(s) }}</v-icon>
                {{ s }}
              </v-btn>
            </div>
          </div>
        </v-card>

        <!-- 🧾 세금계산서 카드 -->
        <v-card class="form-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-receipt</v-icon>
            </div>
            <h3 class="card-title">세금계산서 발행</h3>
          </div>

          <div class="card-content">
            <div class="invoice-grid">
              <v-btn
                :variant="form.invoice === 'Y' ? 'flat' : 'outlined'"
                :color="form.invoice === 'Y' ? 'blue' : 'grey'"
                class="invoice-btn"
                @click="form.invoice = 'Y'"
              >
                <v-icon start>mdi-check-circle</v-icon>
                발행함 (O)
              </v-btn>
              <v-btn
                :variant="form.invoice === 'N' ? 'flat' : 'outlined'"
                :color="form.invoice === 'N' ? 'red' : 'grey'"
                class="invoice-btn"
                @click="form.invoice = 'N'"
              >
                <v-icon start>mdi-close-circle</v-icon>
                발행안함 (X)
              </v-btn>
            </div>
          </div>
        </v-card>

        <!-- 📝 메모 카드 -->
        <v-card class="form-card mb-6" elevation="0">
          <div class="card-header">
            <div class="header-icon">
              <v-icon color="primary">mdi-note-text</v-icon>
            </div>
            <h3 class="card-title">메모</h3>
            <v-chip color="grey" size="small" class="ml-2">선택사항</v-chip>
          </div>

          <div class="card-content">
            <v-textarea
              v-model="form.memo"
              variant="outlined"
              rows="4"
              auto-grow
              label="추가 메모나 특이사항을 입력하세요"
              prepend-inner-icon="mdi-pencil"
            />
          </div>
        </v-card>
      </v-container>

      <!-- 🎯 하단 액션 버튼 -->
      <div class="floating-actions">
        <v-row dense>
          <v-col cols="6">
            <v-btn
              variant="outlined"
              size="large"
              block
              class="action-btn cancel-btn"
              @click="goBack"
            >
              <v-icon start>mdi-arrow-left</v-icon>
              돌아가기
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              color="primary"
              size="large"
              block
              class="action-btn save-btn"
              :loading="scheduleStore.isLoading"
              @click="submit"
            >
              <v-icon start>mdi-content-save</v-icon>
              수정 완료
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Korean } from 'flatpickr/dist/l10n/ko.js'
import { useRoute, useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import { useUiStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'

const router = useRouter()
const route = useRoute()
const scheduleStore = useScheduleStore()
const uiStore = useUiStore()
const { selectedSchedule } = storeToRefs(scheduleStore)

const buildings = [
  '테라타워1',
  '테라타워2',
  'SKV1',
  '현대지식산업',
  '현대비지니스파크',
  '대명벨리온',
  '에코 송파',
  '기타',
]
const units = ['A', 'B', 'C', 'D', '기타']
const types = ['설치', '수리', '점검', '청소', '기타']
const statuses = ['진행', '완료', '보류']

const form = ref({
  building: '',
  buildingEtc: '',
  unit: '',
  unitEtc: '',
  room: '',
  tasks: [{ id: Date.now() + Math.random(), name: '', count: 1, etc: '' }],
  status: '진행',
  date: '',
  memo: '',
  invoice: 'N',
})

const original = ref({})

const dateConfig = {
  locale: Korean,
  dateFormat: 'Y-m-d',
  disableMobile: true,
  allowInput: true,
}

// 변경사항 감지
const hasChanges = computed(() => {
  if (!original.value.id) return false

  const currentData = {
    building:
      form.value.building === '기타'
        ? form.value.buildingEtc
        : form.value.building,
    unit: form.value.unit === '기타' ? form.value.unitEtc : form.value.unit,
    room: form.value.room,
    status: form.value.status,
    date: form.value.date,
    memo: form.value.memo,
    invoice: form.value.invoice === 'Y',
  }

  return (
    JSON.stringify(currentData) !==
    JSON.stringify({
      building: original.value.building,
      unit: original.value.unit,
      room: original.value.room,
      status: original.value.status,
      date: original.value.date,
      memo: original.value.memo,
      invoice: original.value.invoice,
    })
  )
})

const getStatusColor = (status, isSelected) => {
  if (!isSelected) return 'grey'
  switch (status) {
    case '진행':
      return 'warning'
    case '완료':
      return 'success'
    case '보류':
      return 'error'
    default:
      return 'grey'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case '진행':
      return 'mdi-play-circle'
    case '완료':
      return 'mdi-check-circle'
    case '보류':
      return 'mdi-pause-circle'
    default:
      return 'mdi-help-circle'
  }
}

function initializeForm(source) {
  if (!source) return
  original.value = JSON.parse(JSON.stringify(source)) // Deep copy for comparison
  form.value = {
    building: buildings.includes(source.building) ? source.building : '기타',
    buildingEtc: buildings.includes(source.building) ? '' : source.building,
    unit: units.includes(source.unit) ? source.unit : '기타',
    unitEtc: units.includes(source.unit) ? '' : source.unit,
    room: source.room,
    tasks: (source.tasks || []).map((t) => ({
      id: Date.now() + Math.random(),
      name: types.includes(t.name) ? t.name : '기타',
      etc: types.includes(t.name) ? '' : t.name,
      count: t.count || 1,
    })),
    status: source.status,
    date: source.date,
    memo: source.memo,
    invoice: source.invoice ? 'Y' : 'N',
  }
}

onMounted(async () => {
  const id = route.params.id
  const scheduleFromStore = scheduleStore.getScheduleById(id)
  if (scheduleFromStore) {
    initializeForm(scheduleFromStore)
  } else {
    await scheduleStore.fetchScheduleById(id)
    // After fetching, the selectedSchedule ref will be updated.
  }
})

// Watch for changes in the store's selectedSchedule
watch(selectedSchedule, (newSchedule) => {
  if (newSchedule && newSchedule.id === route.params.id) {
    initializeForm(newSchedule)
  }
})

function addTask() {
  form.value.tasks.push({
    id: Date.now() + Math.random(),
    name: '',
    count: 1,
    etc: '',
  })
}

function removeTask(id) {
  if (form.value.tasks.length === 1) {
    uiStore.showSnackbar('최소 1개의 작업은 입력해야 합니다.', 'error')
    return
  }
  form.value.tasks = form.value.tasks.filter((t) => t.id !== id)
}

function goBack() {
  router.back()
}

async function submit() {
  if (!form.value.building || !form.value.status || !form.value.date) {
    uiStore.showSnackbar('필수 항목을 모두 입력해주세요.', 'error')
    return
  }

  const cleanedTasks = form.value.tasks
    .filter((task) => task.name)
    .map((task) => ({
      name: task.name === '기타' ? task.etc : task.name,
      count: task.count,
    }))

  const data = {
    id: route.params.id,
    building:
      form.value.building === '기타'
        ? form.value.buildingEtc
        : form.value.building,
    unit: form.value.unit === '기타' ? form.value.unitEtc : form.value.unit,
    room: form.value.room,
    tasks: cleanedTasks,
    status: form.value.status,
    date: form.value.date,
    memo: form.value.memo,
    invoice: form.value.invoice === 'Y',
  }

  try {
    await scheduleStore.updateSchedule(data)
    uiStore.showSnackbar('작업이 성공적으로 수정되었습니다!', 'success')
    const originalFrom = route.query.originalFrom || 'schedules'
    router.push(`/schedule/${route.params.id}?from=${originalFrom}`)
  } catch (err) {
    uiStore.showSnackbar('수정 중 오류가 발생했습니다.', 'error')
  }
}
</script>

<style scoped>
/* Styles remain the same */
/* 🎨 헤더 스타일 - 일관성 유지 */
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

.back-btn {
  background: rgba(100, 116, 139, 0.1) !important;
  color: #64748b !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
}

.back-btn:hover,
.back-btn:focus {
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

/* 🌀 메인 컨텐츠 */
.main-content {
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

/* 📋 폼 카드 */
.form-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.form-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.card-content {
  padding: 24px;
}

/* 📅 날짜 입력 */
.date-picker-wrapper {
  position: relative;
}

.date-input {
  width: 100%;
  padding: 16px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  background: white;
  transition: all 0.3s ease;
}

.date-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  outline: none;
}

/* 🎛️ 옵션 그리드 */
.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.option-btn {
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
}

.option-btn:hover {
  transform: translateY(-2px);
}

/* 💪 작업 아이템 */
.task-item {
  background: #f8fafc;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  border: 2px solid #e2e8f0;
  position: relative;
  transition: all 0.3s ease;
}

.task-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.task-number {
  position: absolute;
  top: -8px;
  left: 16px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.task-type-section,
.task-etc-section,
.task-count-section {
  margin-bottom: 16px;
}

.task-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.task-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
}

.type-btn {
  height: 40px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
}

.task-delete-btn {
  position: absolute;
  top: 16px;
  right: 16px;
}

.add-task-btn {
  height: 56px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  border: 2px dashed #cbd5e1;
  transition: all 0.3s ease;
}

.add-task-btn:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

/* 📌 상태 그리드 */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.status-btn {
  height: 56px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
}

.status-btn:hover {
  transform: translateY(-2px);
}

/* 🧾 세금계산서 그리드 */
.invoice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.invoice-btn {
  height: 56px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
}

/* 🎯 플로팅 액션 버튼 */
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
}

.action-btn {
  height: 56px;
  border-radius: 16px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.cancel-btn {
  border: 2px solid #e2e8f0;
}

.cancel-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.save-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.save-btn:hover {
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

/* 🎨 애니메이션 */
.task-fade-enter-active {
  transition: all 0.4s ease;
}

.task-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.task-fade-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.task-fade-leave-active {
  transition: all 0.3s ease;
}

.task-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.task-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* 📱 성공/에러 스낵바 */
.success-snackbar,
.error-snackbar {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  font-weight: 600;
  z-index: 10000;
  animation: slideInDown 0.3s ease;
}

.success-snackbar {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
}

.error-snackbar {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 🎯 반응형 디자인 */
@media (max-width: 768px) {
  .header-title {
    font-size: 20px !important;
  }
  
  .header-subtitle {
    font-size: 14px !important;
  }
  
  .header-icon-wrapper {
    width: 40px !important;
    height: 40px !important;
  }
  
  .header-icon-wrapper .v-icon {
    font-size: 20px !important;
  }

  .option-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 8px;
  }

  .option-btn {
    height: 44px;
    font-size: 14px;
  }

  .task-item {
    padding: 16px;
  }

  .task-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .status-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .status-btn {
    height: 52px;
  }

  .invoice-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .invoice-btn {
    height: 52px;
  }

  .floating-actions {
    padding: 16px;
  }

  .action-btn {
    height: 52px;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 18px !important;
  }
  
  .header-subtitle {
    font-size: 12px !important;
  }
  
  .header-icon-wrapper {
    width: 36px !important;
    height: 36px !important;
  }
  
  .header-icon-wrapper .v-icon {
    font-size: 18px !important;
  }

  .card-header {
    padding: 16px 20px;
  }

  .card-content {
    padding: 20px;
  }

  .card-title {
    font-size: 16px;
  }

  .task-item {
    padding: 14px;
  }

  .task-type-grid {
    grid-template-columns: 1fr;
  }

  .type-btn {
    height: 36px;
    font-size: 13px;
  }

  .date-input {
    padding: 14px 16px;
    font-size: 14px;
  }
}

/* 🔍 Flatpickr 커스터마이징 */
:deep(.flatpickr-calendar) {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

:deep(.flatpickr-day.selected) {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border-color: #4f46e5;
}

:deep(.flatpickr-day:hover) {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

:deep(.flatpickr-months) {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border-radius: 16px 16px 0 0;
}

:deep(.flatpickr-month) {
  color: white;
}

:deep(.flatpickr-prev-month),
:deep(.flatpickr-next-month) {
  color: white;
}

:deep(.flatpickr-prev-month):hover,
:deep(.flatpickr-next-month):hover {
  color: rgba(255, 255, 255, 0.8);
}
</style>
