<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16">
        <!-- 날짜 선택 -->
        <div class="mb-4">
          <label class="mb-2 font-weight-bold d-block">날짜 선택</label>
          <flat-pickr
            v-model="form.date"
            :config="dateConfig"
            class="custom-date-picker flatpickr-input"
          />
        </div>

        <!-- 건물 선택 -->
        <div class="mb-4">
          <label class="mb-2 font-weight-bold d-block">건물 선택</label>
          <div class="button-grid">
            <v-btn
              v-for="b in buildings"
              :key="b"
              :class="[form.building === b ? 'selected-btn' : '', 'grid-btn']"
              @click="form.building = b"
              color="primary"
              variant="tonal"
            >{{ b }}</v-btn>
          </div>
          <v-text-field
            v-if="form.building === '기타'"
            v-model="form.buildingEtc"
            label="건물명 직접 입력"
            outlined
          />
        </div>

        <!-- 동 선택 -->
        <div class="mb-4">
          <label class="mb-2 font-weight-bold d-block">동 선택</label>
          <div class="button-grid">
            <v-btn
              v-for="u in units"
              :key="u"
              :class="[form.unit === u ? 'selected-btn' : '', 'grid-btn']"
              @click="form.unit = u"
              color="primary"
              variant="tonal"
            >{{ u }}</v-btn>
          </div>
          <v-text-field
            v-if="form.unit === '기타'"
            v-model="form.unitEtc"
            label="동 직접 입력"
            outlined
          />
        </div>

        <!-- 호수 -->
        <v-text-field v-model="form.room" label="호수" outlined class="mb-4" />

        <!-- 빠른 작업 추가 -->
        <div class="quick-add mb-4">
          <v-select
            v-model="quickTask.name"
            :items="types"
            label="작업 종류"
            dense
            hide-details
            style="max-width: 120px;"
          />
          <v-text-field
            v-if="quickTask.name === '기타'"
            v-model="quickTask.etc"
            label="작업 직접 입력"
            dense
            hide-details
            style="max-width: 140px;"
          />
          <v-text-field
            v-model="quickTask.count"
            type="number"
            label="수량"
            dense
            hide-details
            style="max-width: 80px;"
            @keyup.enter="addQuickTask"
          />
          <v-btn @click="addQuickTask" color="success" icon><v-icon>mdi-plus</v-icon></v-btn>
        </div>

        <!-- 작업 목록 -->
        <div class="mb-4">
          <label class="mb-2 font-weight-bold d-block">작업 목록</label>
          <div
            v-for="(task, index) in form.tasks"
            :key="index"
            class="d-flex align-center flex-wrap mb-2"
          >
            <span class="mr-2">{{ task.name }} × {{ task.count }}</span>
            <v-btn icon color="error" @click="removeTask(index)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- 작업 상태 -->
        <div class="mb-4">
          <label class="mb-2 font-weight-bold d-block">작업 상태</label>
          <div class="button-grid">
            <v-btn
              v-for="s in statuses"
              :key="s"
              :class="[form.status === s ? 'selected-btn' : '', 'grid-btn']"
              @click="form.status = s"
              color="success"
              variant="tonal"
            >{{ s }}</v-btn>
          </div>
        </div>

        <!-- 세금계산서 발행 -->
        <div class="mb-4">
          <label class="mb-2 font-weight-bold d-block">세금계산서 발행</label>
          <div class="button-grid">
            <v-btn
              :class="[form.invoice === 'Y' ? 'selected-btn' : '', 'grid-btn']"
              @click="form.invoice = 'Y'"
              color="blue"
              variant="tonal"
            >O</v-btn>
            <v-btn
              :class="[form.invoice === 'N' ? 'selected-btn' : '', 'grid-btn']"
              @click="form.invoice = 'N'"
              color="red"
              variant="tonal"
            >X</v-btn>
          </div>
        </div>

        <!-- 메모 -->
        <v-textarea
          v-model="form.memo"
          label="작업 관련 메모 (선택사항)"
          outlined
          rows="3"
          class="mb-4"
        />
      </v-container>

      <!-- ✅ 하단 고정: 요약 정보 + 버튼 -->
      <v-container
        class="pa-2"
        style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
      >
        <!-- 요약 정보 -->
        <div class="bottom-summary mb-2">
          날짜: {{ formattedDate }} |
          건물: {{ displayBuilding }} |
          동: {{ displayUnit }} |
          호수: {{ form.room || '미입력' }}
        </div>

        <v-row dense>
          <v-col cols="6">
            <v-btn color="secondary" block @click="goHome">🏠 홈으로</v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn color="primary" block @click="submit">✅ 등록</v-btn>
          </v-col>
        </v-row>
      </v-container>
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
  tasks: [],
  status: '진행',
  date: new Date().toISOString().split('T')[0],
  memo: '',
  invoice: 'N'
})

const quickTask = ref({ name: '', etc: '', count: 1 })

function addQuickTask() {
  const taskName = quickTask.value.name === '기타'
    ? quickTask.value.etc.trim()
    : quickTask.value.name

  if (!taskName || quickTask.value.count < 1) return

  form.value.tasks.push({
    name: taskName,
    count: quickTask.value.count,
    etc: quickTask.value.name === '기타' ? quickTask.value.etc.trim() : ''
  })

  quickTask.value = { name: '', etc: '', count: 1 }
}

function removeTask(index) {
  form.value.tasks.splice(index, 1)
}

function goHome() {
  router.push('/')
}

const dateConfig = {
  locale: Korean,
  dateFormat: 'Y-m-d',
  disableMobile: true,
  inline: true,
  onDayCreate(_, __, ___, dayElem) {
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

const formattedDate = computed(() => {
  const date = new Date(form.value.date)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
})

const displayBuilding = computed(() =>
  form.value.building === '기타' ? form.value.buildingEtc : form.value.building
)
const displayUnit = computed(() =>
  form.value.unit === '기타' ? form.value.unitEtc : form.value.unit
)

async function submit() {
  const cleanedTasks = form.value.tasks.map(task => ({
    name: task.name,
    count: task.count
  }))

  const data = {
    building: displayBuilding.value,
    unit: displayUnit.value,
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
  router.push('/')
}
</script>

<style scoped>
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
  margin-bottom: 8px;
}

.grid-btn {
  min-width: 90px;
  height: 38px;
  font-size: 14px;
  white-space: nowrap;
}

.selected-btn {
  font-weight: bold;
  border: 2px solid #1976d2;
}

.quick-add {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bottom-summary {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  color: #333;
  padding-bottom: 6px;
}
</style>
