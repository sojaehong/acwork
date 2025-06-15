<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-32">
        <h2 class="text-h5 mb-4 responsive-title">✏️ 작업 수정</h2>

        <!-- 날짜 선택 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">📅 날짜 선택</div>
          <flat-pickr v-model="form.date" :config="dateConfig" class="custom-date-picker flatpickr-input" />
        </v-sheet>

        <!-- 건물 선택 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">🏢 건물 선택</div>
          <v-row dense>
            <v-col v-for="b in buildings" :key="b" cols="4" class="pa-1">
              <v-btn :color="form.building === b ? 'primary' : 'grey-lighten-1'" block size="small" variant="tonal" @click="form.building = b">
                {{ b }}
              </v-btn>
            </v-col>
          </v-row>
          <v-text-field v-if="form.building === '기타'" v-model="form.buildingEtc" label="건물명 직접 입력" outlined />
        </v-sheet>

        <!-- 동 선택 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">🏬 동 선택</div>
          <v-row dense>
            <v-col v-for="u in units" :key="u" cols="4" class="pa-1">
              <v-btn :color="form.unit === u ? 'primary' : 'grey-lighten-1'" block size="small" variant="tonal" @click="form.unit = u">
                {{ u }}
              </v-btn>
            </v-col>
          </v-row>
          <v-text-field v-if="form.unit === '기타'" v-model="form.unitEtc" label="동 직접 입력" outlined />
        </v-sheet>

        <!-- 호수 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">🏠 호수</div>
          <v-text-field v-model="form.room" label="호수" outlined />
        </v-sheet>

        <!-- 작업 내용 및 수량 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">💪 작업 내용 및 수량</div>
          <transition-group name="fade-stagger" tag="div">
            <div
              v-for="task in form.tasks"
              :key="task.id"
              class="d-flex align-start mb-2 flex-wrap task-row"
            >
              <v-btn-toggle v-model="task.name" class="mr-2">
                <v-btn
                  v-for="t in types"
                  :key="t"
                  :value="t"
                  :class="task.name === t ? 'selected-btn' : ''"
                  color="secondary"
                  variant="tonal"
                >
                  {{ t }}
                </v-btn>
              </v-btn-toggle>

              <transition name="fade-stagger">
                <v-text-field
                  v-if="task.name === '기타'"
                  v-model="task.etc"
                  label="직접입력"
                  class="mr-2 custom-task-etc"
                  dense
                />
              </transition>

              <v-text-field
                v-model.number="task.count"
                type="number"
                min="1"
                label="수량"
                class="mr-2"
                style="max-width: 80px"
                dense
              />

              <v-btn icon color="error" @click="removeTask(task.id)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </transition-group>
          <v-btn small color="success" @click="addTask">+ 작업 추가</v-btn>
        </v-sheet>

        <!-- 작업 상태 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">📌 작업 상태</div>
          <v-btn-toggle v-model="form.status">
            <v-btn v-for="s in statuses" :key="s" :value="s" color="primary" variant="tonal">{{ s }}</v-btn>
          </v-btn-toggle>
        </v-sheet>

        <!-- 세금계산서 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">🧾 세금계산서 발행 여부</div>
          <v-btn-toggle v-model="form.invoice">
            <v-btn value="Y" color="blue" variant="tonal">O</v-btn>
            <v-btn value="N" color="red" variant="tonal">X</v-btn>
          </v-btn-toggle>
        </v-sheet>

        <!-- 메모 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg" style="scroll-margin-bottom: 120px">
          <div class="mb-2 font-weight-bold">📝 메모</div>
          <v-textarea
            v-model="form.memo"
            rows="3"
            outlined
            auto-grow
            style="min-height: 100px"
          />
        </v-sheet>

        <!-- Dummy Spacer -->
        <div style="height: 200px;"></div>
      </v-container>

      <!-- 하단 고정 버튼 -->
      <v-container
        class="pa-2 summary-bar"
        style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
      >
        <v-row dense>
          <v-col cols="6">
            <v-btn color="primary" block class="responsive-btn" @click="goBack">돌아가기</v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn color="secondary" block class="responsive-btn" :loading="isSaving" @click="submit">수정 완료</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Korean } from 'flatpickr/dist/l10n/ko.js'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useScheduleStore } from '@/stores/schedule'

const router = useRouter()
const route = useRoute()
const scheduleStore = useScheduleStore()

const buildings = ['테라타워1', '테라타워2', 'SKV1', '현대지식산업', '현대비지니스파크', '대명벨리온', '기타']
const units = ['A', 'B', 'C', 'D', '기타']
const types = ['설치', '수리', '청소', '기타']
const statuses = ['진행', '완료', '보류']

const form = ref({
  building: '', buildingEtc: '', unit: '', unitEtc: '', room: '',
  tasks: [{ id: Date.now() + Math.random(), name: '', count: 1, etc: '' }],
  status: '진행', date: '', memo: '', invoice: 'N'
})

const isSaving = ref(false)
const original = ref({})

onMounted(async () => {
  const id = route.params.id
  const storeSchedule = scheduleStore.schedules.find(s => s.id === id)

  if (storeSchedule) {
    original.value = storeSchedule
    initializeForm()
  } else {
    const snap = await getDoc(doc(db, 'schedules', id))
    if (!snap.exists()) {
      alert('존재하지 않는 작업입니다')
      router.back()
      return
    }
    original.value = { id: snap.id, ...snap.data() }
    scheduleStore.setSchedules([...scheduleStore.schedules, original.value])
    initializeForm()
  }
})

function initializeForm() {
  form.value = {
    building: buildings.includes(original.value.building) ? original.value.building : '기타',
    buildingEtc: buildings.includes(original.value.building) ? '' : original.value.building,
    unit: units.includes(original.value.unit) ? original.value.unit : '기타',
    unitEtc: units.includes(original.value.unit) ? '' : original.value.unit,
    room: original.value.room,
    tasks: (original.value.tasks || []).map(t => ({
      id: Date.now() + Math.random(),
      name: types.includes(t.name) ? t.name : '기타',
      etc: types.includes(t.name) ? '' : t.name,
      count: t.count || 1
    })),
    status: original.value.status,
    date: original.value.date,
    memo: original.value.memo,
    invoice: original.value.invoice ? 'Y' : 'N'
  }
}

const dateConfig = {
  locale: Korean, dateFormat: 'Y-m-d', disableMobile: true, inline: true
}

function addTask() {
  form.value.tasks.push({ id: Date.now() + Math.random(), name: '', count: 1, etc: '' })
}

function removeTask(id) {
  if (form.value.tasks.length === 1) {
    alert('최소 1개의 작업은 입력해야 합니다.')  // 여긴 Snackbar 연결 가능
    return
  }
  form.value.tasks = form.value.tasks.filter(t => t.id !== id)
}

function goBack() {
  router.back()
}

async function submit() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    // 필수 검증 추가
    if (!form.value.building || !form.value.unit || !form.value.room || !form.value.status || !form.value.date) {
      alert('필수 항목을 모두 입력해주세요.')
      isSaving.value = false
      return
    }

    const cleanedTasks = form.value.tasks
      .filter(task => task.name)
      .map(task => ({
        name: task.name === '기타' ? task.etc : task.name,
        count: task.count
      }))
    const data = {
      building: form.value.building === '기타' ? form.value.buildingEtc : form.value.building,
      unit: form.value.unit === '기타' ? form.value.unitEtc : form.value.unit,
      room: form.value.room,
      tasks: cleanedTasks,
      status: form.value.status,
      date: form.value.date,
      memo: form.value.memo,
      invoice: form.value.invoice === 'Y'
    }
    await updateDoc(doc(db, 'schedules', route.params.id), data)
    alert('작업이 수정되었습니다.')

    const index = scheduleStore.schedules.findIndex(s => s.id === original.value.id)
    if (index !== -1) {
      scheduleStore.schedules[index] = {
        ...scheduleStore.schedules[index],
        ...data
      }
    }

    router.back()
  } catch (err) {
    console.error(err)
    alert('수정 중 오류가 발생했습니다.')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.selected-btn {
  font-weight: bold;
  border: 2px solid #1976d2;
}
.task-row {
  flex-wrap: wrap;
  overflow-x: hidden;
}
.custom-task-etc {
  min-width: 120px;
  max-width: 180px;
  flex-shrink: 1;
}
/* fade-stagger 효과 */
.fade-stagger-enter-active {
  transition: all 0.3s ease;
}
.fade-stagger-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-stagger-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.fade-stagger-leave-active {
  transition: all 0.2s ease;
}
.fade-stagger-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.fade-stagger-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
