<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16" style="padding-bottom: 240px !important">
        <h2 class="text-h5 mb-4">📝 작업 등록</h2>

        <!-- 날짜 선택 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">🗕 날짜 선택</div>
          <flat-pickr
            v-model="form.date"
            :config="dateConfig"
            class="custom-date-picker flatpickr-input"
          />
        </v-sheet>

        <!-- 건물 선택 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">🏢 건물 선택</div>
          <v-btn-toggle v-model="form.building" mandatory class="button-grid">
            <v-btn
              v-for="b in buildings"
              :key="b"
              :value="b"
              :class="form.building === b ? 'selected-btn' : ''"
              color="primary"
              variant="tonal"
            >{{ b }}</v-btn>
          </v-btn-toggle>
          <v-text-field
            v-if="form.building === '기타'"
            v-model="form.buildingEtc"
            label="건물명 직접 입력"
            outlined
          />
        </v-sheet>

        <!-- 동 선택 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">🏬 동 선택</div>
          <v-btn-toggle v-model="form.unit" mandatory class="button-grid">
            <v-btn
              v-for="u in units"
              :key="u"
              :value="u"
              :class="form.unit === u ? 'selected-btn' : ''"
              color="primary"
              variant="tonal"
            >{{ u }}</v-btn>
          </v-btn-toggle>
          <v-text-field
            v-if="form.unit === '기타'"
            v-model="form.unitEtc"
            label="동 직접 입력"
            outlined
          />
        </v-sheet>

        <!-- 호수 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">🏠 호수</div>
          <v-text-field
            v-model="form.room"
            label="호수"
            outlined
          />
        </v-sheet>

        <!-- 작업 내용 및 수량 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">💪 작업 내용 및 수량</div>
          <div
            v-for="(task, index) in form.tasks"
            :key="index"
            class="d-flex align-center flex-wrap mb-2"
          >
            <v-btn-toggle v-model="task.name" class="button-grid mr-2">
              <v-btn
                v-for="t in types"
                :key="t"
                :value="t"
                :class="task.name === t ? 'selected-btn' : ''"
                color="secondary"
                variant="tonal"
              >{{ t }}</v-btn>
            </v-btn-toggle>
            <v-text-field
              v-if="task.name === '기타'"
              v-model="task.etc"
              label="작업 종류 직접 입력"
              class="mr-2"
              style="max-width: 140px"
            />
            <v-text-field
              v-model="task.count"
              label="수량"
              type="number"
              min="1"
              class="mr-2"
              style="max-width: 90px"
            />
            <v-btn icon color="error" @click="removeTask(index)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
          <v-btn small color="success" @click="addTask">+ 작업 추가</v-btn>
        </v-sheet>

        <!-- 작업 상태 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">📌 작업 상태</div>
          <v-btn-toggle v-model="form.status" class="button-grid">
            <v-btn
              v-for="s in statuses"
              :key="s"
              :value="s"
              :class="form.status === s ? 'selected-btn' : ''"
              color="success"
              variant="tonal"
            >{{ s }}</v-btn>
          </v-btn-toggle>
        </v-sheet>

        <!-- 세금계산서 발행 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">📟 세금계산서 발행</div>
          <v-btn-toggle v-model="form.invoice" class="button-grid">
            <v-btn
              value="Y"
              :class="form.invoice === 'Y' ? 'selected-btn' : ''"
              color="blue"
              variant="tonal"
            >O</v-btn>
            <v-btn
              value="N"
              :class="form.invoice === 'N' ? 'selected-btn' : ''"
              color="red"
              variant="tonal"
            >X</v-btn>
          </v-btn-toggle>
        </v-sheet>

        <!-- 메모 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">📒 메모 (선택사항)</div>
          <v-textarea
            v-model="form.memo"
            label="작업 관련 메모"
            outlined
            rows="3"
          />
        </v-sheet>
      </v-container>

      <!-- 하단 고정 요약 + 버튼 -->
      <v-container
        class="pa-2"
        style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
      >
        <div class="summary-bar">
          📌 요약: {{ summaryText }}
        </div>
        <v-row dense>
          <v-col cols="6">
            <v-btn color="secondary" block @click="goHome">홈으로</v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn color="primary" block @click="submit">등록</v-btn>
          </v-col>
        </v-row>
      </v-container>

      <!-- 등록 완료 Toast -->
      <v-snackbar v-model="toast.show" timeout="2000">
        {{ toast.message }}
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Korean } from 'flatpickr/dist/l10n/ko.js'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const router = useRouter()
const buildings = ['테라타워1', '테라타워2', 'SKV1', '현대지식산업', '현대비지니스파크', '대명벨리온', '기타']
const units = ['A', 'B', 'C', 'D', '기타']
const types = ['설치', '수리', '청소', '기타']
const statuses = ['진행', '완료', '보류']

const form = ref({
  building: '',
  buildingEtc: '',
  unit: '',
  unitEtc: '',
  room: '',
  tasks: [{ name: '', count: 1, etc: '' }],
  status: '진행',
  date: new Date().toISOString().split('T')[0],
  memo: '',
  invoice: 'N'
})

const toast = ref({ show: false, message: '' })

const dateConfig = {
  locale: Korean,
  dateFormat: 'Y-m-d',
  disableMobile: true,
  inline: true,
  onDayCreate(_, __, fp, dayElem) {
    const day = new Date(dayElem.dateObj).getDay()
    if (day === 0) {
      dayElem.style.color = 'red'
      dayElem.style.fontWeight = 'bold'
    } else if (day === 6) {
      dayElem.style.color = 'blue'
      dayElem.style.fontWeight = 'bold'
    }
  }
}

const summaryText = computed(() => {
  const b = form.value.building === '기타' ? form.value.buildingEtc : form.value.building
  const u = form.value.unit === '기타' ? form.value.unitEtc : form.value.unit
  const tasks = form.value.tasks.map(t => (t.name === '기타' ? t.etc : t.name) + `(${t.count})`).join(', ')
  const invoice = form.value.invoice === 'Y' ? '세금계산서 발행' : '계산서 없음'
  return `${form.value.date} / ${b} ${u} ${form.value.room}호 / ${tasks} / ${form.value.status} / ${invoice}`
})

function addTask() {
  form.value.tasks.push({ name: '', count: 1, etc: '' })
}

function removeTask(index) {
  form.value.tasks.splice(index, 1)
}

function goHome() {
  router.push('/')
}

async function submit() {
  const cleanedTasks = form.value.tasks.map(task => ({
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
    invoice: form.value.invoice === 'Y',
    createdAt: serverTimestamp(),
    createdBy: localStorage.getItem('user_id')
  }

  await addDoc(collection(db, 'schedules'), data)
  toast.value = { show: true, message: '✅ 등록 완료' }
  setTimeout(() => router.push('/'), 1000)
}
</script>

<style scoped>
.custom-date-picker {
  margin-bottom: 12px;
}
.flatpickr-input {
  font-size: 18px;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: 100%;
}
.button-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.button-grid > .v-btn {
  flex: 1 1 30%;
  min-width: 100px;
  justify-content: center;
}
@media (max-width: 600px) {
  .button-grid > .v-btn {
    flex: 1 1 45%;
    font-size: 14px;
    padding: 8px;
  }
}
.selected-btn {
  font-weight: bold;
  border: 2px solid #1976d2;
}
.summary-bar {
  font-size: 16px;
  font-weight: 600;
  padding: 10px 12px;
  background: #f0f2f5;
  border-radius: 8px;
  margin-bottom: 8px;
  color: #2c2c2c;
  text-align: center;
  line-height: 1.5;
}
</style>