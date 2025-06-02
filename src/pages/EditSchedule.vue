<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16" style="padding-bottom: 240px !important">
        <h2 class="text-h5 mb-4">✏️ 작업 수정</h2>

        <!-- 날짜 선택 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">📅 날짜 선택</div>
          <flat-pickr
            v-model="form.date"
            :config="dateConfig"
            class="custom-date-picker flatpickr-input"
          />
        </v-sheet>

        <!-- 건물 선택 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">🏢 건물 선택</div>
          <v-row dense class="mb-2">
            <v-col v-for="b in buildings" :key="b" cols="6" sm="4" md="3">
              <v-btn
                :color="form.building === b ? 'primary' : 'grey'"
                block
                @click="form.building = b"
                :class="form.building === b ? 'selected-btn' : ''"
                variant="tonal"
              >{{ b }}</v-btn>
            </v-col>
          </v-row>
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
          <v-row dense class="mb-2">
            <v-col v-for="u in units" :key="u" cols="6" sm="4" md="3">
              <v-btn
                :color="form.unit === u ? 'primary' : 'grey'"
                block
                @click="form.unit = u"
                :class="form.unit === u ? 'selected-btn' : ''"
                variant="tonal"
              >{{ u }}</v-btn>
            </v-col>
          </v-row>
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
          <div class="mb-2 font-weight-bold">🛠 작업 내용 및 수량</div>
          <div
            v-for="(task, index) in form.tasks"
            :key="index"
            class="d-flex align-center flex-wrap mb-2"
          >
            <v-row dense class="mr-2" style="flex: 1">
              <v-col
                v-for="t in types"
                :key="t"
                cols="6" sm="3"
              >
                <v-btn
                  :color="task.name === t ? 'secondary' : 'grey'"
                  block
                  @click="task.name = t"
                  :class="task.name === t ? 'selected-btn' : ''"
                  variant="tonal"
                >{{ t }}</v-btn>
              </v-col>
            </v-row>
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
          <v-row dense class="mb-2">
            <v-col v-for="s in statuses" :key="s" cols="6" sm="4">
              <v-btn
                :color="form.status === s ? 'success' : 'grey'"
                block
                @click="form.status = s"
                :class="form.status === s ? 'selected-btn' : ''"
                variant="tonal"
              >{{ s }}</v-btn>
            </v-col>
          </v-row>
        </v-sheet>

        <!-- 세금계산서 발행 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">🧾 세금계산서 발행</div>
          <v-row dense class="mb-2">
            <v-col cols="6">
              <v-btn
                :color="form.invoice === 'Y' ? 'blue' : 'grey'"
                block
                @click="form.invoice = 'Y'"
                :class="form.invoice === 'Y' ? 'selected-btn' : ''"
                variant="tonal"
              >O</v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn
                :color="form.invoice === 'N' ? 'red' : 'grey'"
                block
                @click="form.invoice = 'N'"
                :class="form.invoice === 'N' ? 'selected-btn' : ''"
                variant="tonal"
              >X</v-btn>
            </v-col>
          </v-row>
        </v-sheet>

        <!-- 메모 -->
        <v-sheet class="mb-4 pa-4 elevation-1 rounded-lg">
          <div class="mb-2 font-weight-bold">🗒 메모 (선택사항)</div>
          <v-textarea
            v-model="form.memo"
            label="작업 관련 메모"
            outlined
            rows="3"
          />
        </v-sheet>

        <!-- 요약 + 버튼 영역 -->
        <v-sheet
          style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 200; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
          class="px-4 pt-2 pb-4"
        >
          <div class="summary-bar mb-2">
            <div><b>수정 전:</b> {{ originalSummary }}</div>
            <div><b>수정 후:</b> <span v-html="highlightedSummary"></span></div>
          </div>
          <v-row dense>
            <v-col cols="6">
              <v-btn color="secondary" block @click="goBack">돌아가기</v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn color="primary" block @click="submit">수정 완료</v-btn>
            </v-col>
          </v-row>
        </v-sheet>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Korean } from 'flatpickr/dist/l10n/ko.js'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

const router = useRouter()
const route = useRoute()

const buildings = ['테라타워1', '테라타워2', 'SKV1', '현대지식산업', '현대비지니스파크', '대명벨리온', '기타']
const units = ['A', 'B', 'C', 'D', '기타']
const types = ['설치', '수리', '청소', '기타']
const statuses = ['진행', '완료', '보류']

const original = ref({})
const form = ref({
  building: '',
  buildingEtc: '',
  unit: '',
  unitEtc: '',
  room: '',
  tasks: [{ name: '', count: 1, etc: '' }],
  status: '진행',
  date: '',
  memo: '',
  invoice: 'N'
})

const dateConfig = {
  locale: Korean,
  dateFormat: 'Y-m-d',
  disableMobile: true,
  inline: true,
  onDayCreate(_, __, fp, dayElem) {
    const day = new Date(dayElem.dateObj).getDay()
    if (day === 0) dayElem.style.color = 'red'
    if (day === 6) dayElem.style.color = 'blue'
  }
}

onMounted(async () => {
  const id = route.params.id
  const snap = await getDoc(doc(db, 'schedules', id))
  if (!snap.exists()) {
    alert('작업을 찾을 수 없습니다.')
    router.push('/')
    return
  }
  const data = snap.data()
  original.value = { ...data }
  form.value = {
    building: buildings.includes(data.building) ? data.building : '기타',
    buildingEtc: buildings.includes(data.building) ? '' : data.building,
    unit: units.includes(data.unit) ? data.unit : '기타',
    unitEtc: units.includes(data.unit) ? '' : data.unit,
    room: data.room,
    tasks: (data.tasks || []).map(t => ({
      name: types.includes(t.name) ? t.name : '기타',
      etc: types.includes(t.name) ? '' : t.name,
      count: t.count || 1
    })),
    status: data.status || '진행',
    date: data.date,
    memo: data.memo || '',
    invoice: data.invoice ? 'Y' : 'N'
  }
})

const originalSummary = computed(() => {
  const b = original.value.building
  const u = original.value.unit
  const tasks = (original.value.tasks || []).map(t => `${t.name}(${t.count})`).join(', ')
  const invoice = original.value.invoice ? '세금계산서 발행' : '계산서 없음'
  return `${original.value.date} / ${b} ${u} ${original.value.room}호 / ${tasks} / ${original.value.status || '진행'} / ${invoice}`
})

const highlightedSummary = computed(() => {
  const b = form.value.building === '기타' ? form.value.buildingEtc : form.value.building
  const u = form.value.unit === '기타' ? form.value.unitEtc : form.value.unit
  const invoice = form.value.invoice === 'Y' ? '세금계산서 발행' : '계산서 없음'

  const newTasks = form.value.tasks.map(t => ({
    label: t.name === '기타' ? t.etc : t.name,
    count: t.count
  }))
  const originalTasks = (original.value.tasks || []).map(t => ({
    label: t.name,
    count: t.count || 1
  }))

  const taskDiffs = []
  const maxLength = Math.max(newTasks.length, originalTasks.length)

  for (let i = 0; i < maxLength; i++) {
    const t = newTasks[i]
    const o = originalTasks[i]
    if (!t || !t.label) continue
    const changed = !o || t.label !== o.label || t.count !== o.count
    taskDiffs.push(
      changed
        ? `<b style="color:#d32f2f">${t.label}(${t.count})</b>`
        : `${t.label}(${t.count})`
    )
  }

  const fields = [
    { label: form.value.date, original: original.value.date },
    { label: b, original: original.value.building },
    { label: u, original: original.value.unit },
    { label: form.value.room + '호', original: original.value.room + '호' },
    { label: taskDiffs.join(', '), original: originalTasks.map(t => `${t.label}(${t.count})`).join(', ') },
    { label: form.value.status, original: original.value.status || '진행' },
    { label: invoice, original: original.value.invoice ? '세금계산서 발행' : '계산서 없음' }
  ]

  return fields.map(f =>
    f.label !== f.original
      ? `<b style="color:#d32f2f">${f.label}</b>`
      : f.label
  ).join(' / ')
})

function addTask() {
  form.value.tasks.push({ name: '', count: 1, etc: '' })
}
function removeTask(index) {
  form.value.tasks.splice(index, 1)
}
function goBack() {
  router.back()
}
async function submit() {
  const id = route.params.id
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
    status: form.value.status || '진행',
    date: form.value.date,
    memo: form.value.memo,
    invoice: form.value.invoice === 'Y'
  }
  await updateDoc(doc(db, 'schedules', id), data)
  alert('작업이 수정되었습니다.')
  router.back()
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
.selected-btn {
  font-weight: bold;
  border: 2px solid #1976d2;
}
.summary-bar {
  font-size: 15px;
  line-height: 1.5;
  word-break: keep-all;
  white-space: normal;
}
</style>
