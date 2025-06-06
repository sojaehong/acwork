<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16">
        <h2 class="text-h5 mb-4">일정 관리</h2>

        <!-- 이미 존재하는 날짜 목록 스크롤로 표시 -->
        <div v-if="existingDates.length" class="mb-4">
          <v-slide-group
            v-model="selectedDate"
            class="pa-2"
            show-arrows
            center-active
            @update:modelValue="handleDateSelect"
          >
            <v-slide-group-item
              v-for="date in existingDates"
              :key="date"
              :value="date"
            >
              <v-card
                class="ma-2 pa-2"
                :color="selectedDate === date ? 'primary' : 'grey lighten-2'"
                :dark="selectedDate === date"
                style="width: 180px; cursor: pointer"
                @click="handleDateSelect(date)"
              >
                <div class="text-subtitle-2">{{ date }}</div>
                <div class="text-caption mt-1">
                  시작: {{ metaMap[date]?.startTime || '-' }}<br />
                  인원: {{ metaMap[date]?.workerNames?.join(', ') || '-' }}
                </div>
              </v-card>
            </v-slide-group-item>
          </v-slide-group>
        </div>

        <!-- 날짜 선택 -->
        <v-text-field v-model="form.date" label="작업 날짜" type="date" outlined class="mb-4" @change="handleDateChange" />

        <!-- 시작 시간 선택 -->
        <v-text-field v-model="form.startTime" label="시작 시간 (예: 09:00)" type="time" outlined class="mb-4" />

        <!-- 작업자 선택 -->
        <div class="mb-4">
          <div class="mb-2">작업 인원</div>
          <v-select
            v-model="form.workers"
            :items="userOptions"
            item-title="name"
            item-value="id"
            multiple
            chips
            outlined
            label="작업자를 선택하세요"
          />
        </div>

        <!-- 공지사항 -->
        <v-textarea
          v-model="form.notice"
          label="공지사항 (선택사항)"
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
          <v-col cols="4">
            <v-btn color="secondary" block @click="goHome">홈으로</v-btn>
          </v-col>
          <v-col cols="4" v-if="isEdit">
            <v-btn color="error" block @click="cancelSchedule">일정 취소</v-btn>
          </v-col>
          <v-col :cols="isEdit ? 4 : 8">
            <v-btn color="primary" block @click="submit">저장</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { getTodayDateKST } from '@/utils/date'

const router = useRouter()
const today = getTodayDateKST()

const form = ref({
  date: today,
  startTime: '',
  workers: [],
  notice: ''
})

const userOptions = ref([])
const existingDates = ref([])
const selectedDate = ref('')
const metaMap = ref({})
let editDocId = null
const isEdit = ref(false)

async function fetchUsers() {
  const snap = await getDocs(collection(db, 'users'))
  userOptions.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

async function fetchExistingDates() {
  const snap = await getDocs(collection(db, 'schedulesMeta'))
  const dates = new Set()
  const meta = {}

  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    if (data.date) {
      dates.add(data.date)
      const userNames = await Promise.all(
        (data.workers || []).map(id => getDoc(doc(db, 'users', id)))
      )
      meta[data.date] = {
        startTime: data.startTime,
        workerNames: userNames.map(u => u.exists() ? u.data().name : '알 수 없음')
      }
    }
  }
  existingDates.value = Array.from(dates).sort()
  metaMap.value = meta

  if (existingDates.value.includes(today)) {
    selectedDate.value = today
    await handleDateSelect(today)
  }
}

async function handleDateChange() {
  await handleDateSelect(form.value.date)
}

async function handleDateSelect(date) {
  form.value.date = date
  selectedDate.value = date
  const q = query(collection(db, 'schedulesMeta'), where('date', '==', date))
  const snap = await getDocs(q)
  if (!snap.empty) {
    const docSnap = snap.docs[0]
    const existing = docSnap.data()
    form.value.startTime = existing.startTime
    form.value.workers = existing.workers
    form.value.notice = existing.notice
    editDocId = docSnap.id
    isEdit.value = true
  } else {
    form.value.startTime = ''
    form.value.workers = []
    form.value.notice = ''
    editDocId = null
    isEdit.value = false
  }
}

async function submit() {
  if (isEdit.value && editDocId) {
    await updateDoc(doc(db, 'schedulesMeta', editDocId), {
      ...form.value,
      updatedAt: new Date()
    })
    alert('일정이 수정되었습니다')
  } else {
    await addDoc(collection(db, 'schedulesMeta'), {
      ...form.value,
      createdAt: new Date()
    })
    alert('일정이 등록되었습니다')
  }
  router.push('/')
}

async function cancelSchedule() {
  if (editDocId && confirm('정말 이 일정을 취소하시겠습니까?')) {
    await deleteDoc(doc(db, 'schedulesMeta', editDocId))
    alert('일정이 취소되었습니다.')
    router.push('/')
  }
}

function goHome() {
  router.push('/')
}

onMounted(() => {
  fetchUsers()
  fetchExistingDates()
})
</script>

<style scoped>
.v-bottom-navigation {
  display: none;
}
</style>
