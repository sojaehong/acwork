<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16">
        <h2 class="text-h5 mb-4">📝 작업 등록</h2>

        <!-- 날짜 선택 -->
        <div class="mb-4">
          <label class="mb-2 font-weight-bold d-block">날짜 선택</label>
          <v-text-field
            v-model="formattedDate"
            readonly
            outlined
            class="custom-date-picker"
            @click="dateDialog = true"
          />
          <v-dialog v-model="dateDialog" persistent max-width="320">
            <v-card>
              <v-date-picker
                v-model="internalDate"
                show-adjacent-months
                color="primary"
                @update:model-value="onDateSelected"
              />
            </v-card>
          </v-dialog>
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

        <!-- 작업 내용 및 수량 -->
        <div class="mb-4">
          <label class="mb-2 font-weight-bold d-block">작업 내용 및 수량</label>
          <div
            v-for="(task, index) in form.tasks"
            :key="index"
            class="d-flex align-center flex-wrap mb-2"
          >
            <div class="button-grid mr-2">
              <v-btn
                v-for="t in types"
                :key="t"
                :class="[task.name === t ? 'selected-btn' : '', 'grid-btn']"
                @click="task.name = t"
                color="secondary"
                variant="tonal"
              >{{ t }}</v-btn>
            </div>
            <v-text-field
              v-if="task.name === '기타'"
              v-model="task.etc"
              label="작업 종류 직접 입력"
              style="max-width: 140px"
              class="mr-2"
            />
            <v-text-field
              v-model="task.count"
              label="수량"
              type="number"
              min="1"
              style="max-width: 90px"
              class="mr-2"
            />
            <v-btn icon color="error" @click="removeTask(index)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
          <v-btn small color="success" @click="addTask">+ 작업 추가</v-btn>
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

      <!-- 하단 고정 버튼 -->
      <v-container
        class="pa-2"
        style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
      >
        <v-row dense>
          <v-col cols="6">
            <v-btn color="secondary" block @click="goHome">홈으로</v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn color="primary" block @click="submit">등록</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const router = useRouter()
const dateDialog = ref(false)
const internalDate = ref(new Date())

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
  date: toLocalDate(new Date()),
  memo: '',
  invoice: 'N'
})

const formattedDate = computed(() => {
  const date = new Date(form.value.date)
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
})

function onDateSelected(date) {
  if (!date) return
  internalDate.value = date
  form.value.date = toLocalDate(date)
  dateDialog.value = false
}

function toLocalDate(date) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().split('T')[0]
}

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
  router.push('/')
}
</script>

<style scoped>
.custom-date-picker input {
  font-size: 22px !important;
  height: 58px !important;
  padding: 10px 12px !important;
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

/* 날짜 색상 표시 */
::v-deep(.v-date-picker-table .v-btn) {
  color: inherit !important;
}

::v-deep(.v-date-picker-table .v-btn:nth-child(7n + 1)) {
  color: red !important; /* 일요일 */
}

::v-deep(.v-date-picker-table .v-btn:nth-child(7n)) {
  color: blue !important; /* 토요일 */
}
</style>
