<template>
  <v-app>
    <v-app-bar color="primary" dark flat>
      <v-toolbar-title>공조+</v-toolbar-title>
      <v-spacer />
      <span class="mr-2">{{ userName }}님</span>
      <v-btn icon @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container class="pa-4 pb-16">
        <!-- ✅ 일정 메타 상단 표시 (클릭 시 일정 관리 이동) -->
        <div class="mb-6" @click="goToMetaEdit" style="cursor: pointer">
          <v-alert type="info" v-if="scheduleMeta">
            시작 시간: {{ scheduleMeta.startTime }}<br />
            작업 인원:
            <span v-for="(user, i) in scheduleMeta.workerNames" :key="user">
              {{ user }}<span v-if="i < scheduleMeta.workerNames.length - 1">, </span>
            </span><br />
            공지사항: {{ scheduleMeta.notice || '없음' }}<br />
          </v-alert>
          <v-alert v-else type="warning">오늘의 일정 메타 정보가 없습니다.</v-alert>
        </div>

        <v-divider class="my-4" />

        <!-- 🔹 진행중 -->
        <div v-if="activeSchedules.length">
          <h3 class="text-subtitle-1 mb-2">🛠 진행 중인 작업</h3>
          <v-list two-line>
            <v-list-item
              v-for="item in activeSchedules"
              :key="item.id"
              style="cursor: pointer"
              @click="goToDetail(item.id)"
            >
              <v-list-item-content>
                <v-list-item-title class="font-weight-bold">
                  📍 {{ item.building }} {{ item.unit }}동 {{ item.room }}호
                </v-list-item-title>
                <v-list-item-subtitle>
                  작업: {{ formatTasks(item.tasks) }}<br />
                  상태: {{ item.status }} / 세금계산서: {{ item.invoice ? 'O' : 'X' }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </div>

        <!-- 🔹 완료 일정 -->
        <div v-if="completedSchedules.filter(s => s.status === '완료').length">
          <h3 class="text-subtitle-1 mt-6 mb-2">✅ 완료 작업</h3>
          <v-list two-line>
            <v-list-item
              v-for="item in completedSchedules.filter(s => s.status === '완료')"
              :key="item.id"
              style="cursor: pointer"
              @click="goToDetail(item.id)"
            >
              <v-list-item-content>
                <v-list-item-title class="font-weight-bold">
                  ✅ {{ item.building }} {{ item.unit }}동 {{ item.room }}호
                </v-list-item-title>
                <v-list-item-subtitle>
                  작업: {{ formatTasks(item.tasks) }}<br />
                  상태: {{ item.status }} / 세금계산서: {{ item.invoice ? 'O' : 'X' }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </div>

        <!-- 🔹 보류 일정 -->
        <div v-if="completedSchedules.filter(s => s.status === '보류').length">
          <h3 class="text-subtitle-1 mt-6 mb-2">⏸ 보류 작업</h3>
          <v-list two-line>
            <v-list-item
              v-for="item in completedSchedules.filter(s => s.status === '보류')"
              :key="item.id"
              style="cursor: pointer"
              @click="goToDetail(item.id)"
            >
              <v-list-item-content>
                <v-list-item-title class="font-weight-bold">
                  ⏸ {{ item.building }} {{ item.unit }}동 {{ item.room }}호
                </v-list-item-title>
                <v-list-item-subtitle>
                  작업: {{ formatTasks(item.tasks) }}<br />
                  상태: {{ item.status }} / 세금계산서: {{ item.invoice ? 'O' : 'X' }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </div>

        <div v-if="!activeSchedules.length && !completedSchedules.length" class="text-subtitle-1 mt-4 text-grey">
          오늘 등록된 작업 일정이 없습니다.
        </div>
      </v-container>

      <!-- 🔻 하단 고정 버튼 영역 -->
      <v-container
        class="pa-2"
        style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
      >
        <v-row dense>
          <v-col cols="4">
            <v-btn color="info" block @click="goToWorker">👷 작업자별 일정</v-btn>
          </v-col>
          <v-col cols="4">
            <v-btn color="success" block @click="goToPayroll">💰 정산 확인</v-btn>
          </v-col>
          <v-col cols="4">
            <v-btn color="secondary" block @click="goToAdd">+ 작업 등록</v-btn>
          </v-col>
        </v-row>
        <v-btn class="mt-2" block color="grey darken-1" @click="goToAll">
          📋 전체 작업 일정 보기
        </v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

const router = useRouter()
const todaySchedules = ref([])
const scheduleMeta = ref(null)
const userName = localStorage.getItem('user_name') || '사용자'

function getTodayKST() {
  const local = new Date()
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  return local.toISOString().split('T')[0]
}

async function loadSchedules() {
  const today = getTodayKST()
  const q = query(collection(db, 'schedules'), where('date', '==', today))
  const snap = await getDocs(q)
  todaySchedules.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

async function loadScheduleMeta() {
  const today = getTodayKST()
  const q = query(collection(db, 'schedulesMeta'), where('date', '==', today))
  const snap = await getDocs(q)
  if (!snap.empty) {
    const data = snap.docs[0].data()
    const userDocs = await Promise.all(data.workers.map(id => getDoc(doc(db, 'users', id))))
    data.workerNames = userDocs.map(u => u.exists() ? u.data().name : '알 수 없음')
    scheduleMeta.value = data
  }
}

function logout() {
  localStorage.clear()
  router.push('/login')
}

function goToAll() {
  router.push('/schedules')
}

function goToDetail(id) {
  router.push(`/schedule/${id}`)
}

function goToMetaEdit() {
  router.push('/meta')
}

function goToWorker() {
  router.push('/worker-schedules')
}

function goToPayroll() {
  router.push('/payroll')
}

function goToAdd() {
  router.push('/add')
}

function formatTasks(tasks) {
  return tasks.map(t => `${t.name}(${t.count})`).join(', ')
}

const activeSchedules = computed(() =>
  todaySchedules.value.filter(s => s.status === '진행' && s.status !== '취소됨')
)

const completedSchedules = computed(() =>
  todaySchedules.value.filter(s => (s.status === '완료' || s.status === '보류') && s.status !== '취소됨')
)

onMounted(() => {
  loadSchedules()
  loadScheduleMeta()
})
</script>

<style scoped>
.font-weight-bold {
  font-weight: bold;
}
.v-list-item-subtitle {
  white-space: normal !important;
  text-overflow: unset !important;
  overflow: visible !important;
  word-break: break-word !important;
}
</style>
