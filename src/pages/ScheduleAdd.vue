<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16">
        <h2 class="text-h5 mb-4">📝 작업 등록</h2>

        <!-- 건물 선택 -->
        <div class="mb-4">
          <div class="mb-2">건물 선택</div>
          <div class="horizontal-scroll">
            <v-btn-toggle v-model="form.building" mandatory>
              <v-btn
                v-for="b in buildings"
                :key="b"
                :value="b"
                class="scroll-btn"
                color="primary"
                variant="tonal"
              >{{ b }}</v-btn>
            </v-btn-toggle>
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
          <div class="mb-2">동 선택</div>
          <div class="horizontal-scroll">
            <v-btn-toggle v-model="form.unit" mandatory>
              <v-btn
                v-for="u in units"
                :key="u"
                :value="u"
                class="scroll-btn"
                color="primary"
                variant="tonal"
              >{{ u }}</v-btn>
            </v-btn-toggle>
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
          <div class="mb-2">작업 내용 및 수량</div>
          <div
            v-for="(task, index) in form.tasks"
            :key="index"
            class="d-flex align-center flex-wrap mb-2"
          >
            <div class="horizontal-scroll mr-2">
              <v-btn-toggle v-model="task.name" mandatory>
                <v-btn
                  v-for="t in types"
                  :key="t"
                  :value="t"
                  class="scroll-btn"
                  color="secondary"
                  variant="tonal"
                >{{ t }}</v-btn>
              </v-btn-toggle>
            </div>

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
        </div>

        <!-- 작업 상태 -->
        <div class="mb-4">
          <div class="mb-2">작업 상태</div>
          <v-btn-toggle v-model="form.status" mandatory class="d-flex flex-wrap">
            <v-btn
              v-for="s in statuses"
              :key="s"
              :value="s"
              class="ma-1"
              color="success"
              variant="tonal"
            >{{ s }}</v-btn>
          </v-btn-toggle>
        </div>

        <!-- 세금계산서 발행 여부 -->
        <div class="mb-4">
          <div class="mb-2">세금계산서 발행 여부</div>
          <v-btn-toggle v-model="form.invoice" mandatory>
            <v-btn value="Y" color="blue" variant="tonal">O</v-btn>
            <v-btn value="N" color="red" variant="tonal">X</v-btn>
          </v-btn-toggle>
        </div>

        <!-- 날짜 -->
        <v-text-field
          v-model="form.date"
          label="날짜"
          type="date"
          outlined
          class="mb-4 w-100"
          style="font-weight: bold"
        />

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
import { ref } from 'vue'
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
.horizontal-scroll {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 4px;
}
.scroll-btn {
  min-width: 90px;
  margin-right: 8px;
  white-space: nowrap;
}
</style>
