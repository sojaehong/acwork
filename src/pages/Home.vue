<template>
  <v-app>
    <!-- 상단바 -->
    <v-app-bar color="primary" dark flat>
      <v-toolbar-title>공조+</v-toolbar-title>
      <v-spacer />
      <span v-if="userStore.userId" class="mr-2 font-weight-medium">{{ userStore.userName }}님</span>
      <v-btn icon :ripple="false" @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- 본문 -->
    <v-main>
      <v-container class="pa-4" style="padding-bottom: 180px !important">

        <!-- 중앙 로딩 -->
        <v-progress-circular
          v-if="loading"
          indeterminate
          color="primary"
          size="48"
          width="5"
          style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 999;"
        ></v-progress-circular>

        <!-- 일정 메타 정보 카드 -->
        <v-card class="mb-6 elevation-0 meta-info-card responsive-card" outlined>
          <!-- 날짜 이동 영역 -->
          <v-row align="center" class="pa-3 pb-1">
            <v-col cols="auto">
              <v-btn icon :ripple="false" @click.stop="changeDate(-1)">
                <v-icon>mdi-chevron-left-circle</v-icon>
              </v-btn>
            </v-col>

            <v-col class="text-center text-h6 font-weight-bold">
              {{ displayDate }}
              <div class="text-caption mt-1 text-grey-darken-1">{{ displayDday }}</div>
            </v-col>

            <v-col cols="auto">
              <v-btn icon :ripple="false" @click.stop="changeDate(1)">
                <v-icon>mdi-chevron-right-circle</v-icon>
              </v-btn>
            </v-col>
          </v-row>
          <v-divider></v-divider>
          <!-- 일정 메타 정보 내용 -->
          <v-card-text @click="goToMetaEdit" style="cursor: pointer;">
            <v-row>
              <v-col cols="12" md="4">
                <div class="meta-label">🕒 시작 시간</div>
                <div class="meta-value">{{ scheduleMeta?.startTime || '없음' }}</div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="meta-label">👷 작업 인원</div>
                <div class="meta-value">
                  <template v-if="scheduleMeta">
                    <v-chip
                      v-for="(user, i) in scheduleMeta.workerNames"
                      :key="user"
                      :color="user === userStore.userName ? 'warning' : 'grey lighten-2'"
                      small
                      class="ma-1"
                    >
                      {{ user }}
                    </v-chip>
                  </template>
                  <template v-else>없음</template>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="meta-label">📢 공지사항</div>
                <div class="meta-value">{{ scheduleMeta?.notice || '없음' }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 작업 리스트 -->
        <div v-if="activeSchedules.length">
          <h3 class="section-title responsive-title">🛠 진행 중</h3>
          <transition-group name="fade-stagger" tag="div" appear>
            <TaskCard
              v-for="item in activeSchedules"
              :key="item.id + '-active'"
              :item="item"
              @click="goToDetail(item.id)"
              class="responsive-card"
            />
          </transition-group>
        </div>

        <div v-if="completedDoneSchedules.length">
          <h3 class="section-title responsive-title">✅ 완료</h3>
          <transition-group name="fade-stagger" tag="div" appear>
            <TaskCard
              v-for="item in completedDoneSchedules"
              :key="item.id + '-done'"
              :item="item"
              @click="goToDetail(item.id)"
              class="responsive-card"
            />
          </transition-group>
        </div>

        <div v-if="completedHoldSchedules.length">
          <h3 class="section-title responsive-title">⏸ 보류</h3>
          <transition-group name="fade-stagger" tag="div" appear>
            <TaskCard
              v-for="item in completedHoldSchedules"
              :key="item.id + '-hold'"
              :item="item"
              @click="goToDetail(item.id)"
              class="responsive-card"
            />
          </transition-group>
        </div>

        <!-- 없을 때 -->
        <v-alert v-if="!activeSchedules.length && !completedSchedules.length" type="info" class="mt-4">
          등록된 작업이 없습니다.
        </v-alert>
      </v-container>

      <!-- 하단 버튼 -->
      <v-container
        class="pa-2"
        style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1); pointer-events: auto;"
      >
        <v-row dense>
          <v-col cols="4">
            <v-btn color="info" block @click="goToWorker" class="responsive-btn">👷 작업자별</v-btn>
          </v-col>
          <v-col cols="4">
            <v-btn color="success" block @click="goToPayroll" class="responsive-btn">💰 정산</v-btn>
          </v-col>
          <v-col cols="4">
            <v-btn color="secondary" block @click="goToAdd" class="responsive-btn">+ 작업 등록</v-btn>
          </v-col>
        </v-row>
        <v-btn class="mt-2 responsive-btn" block color="grey darken-1" @click="goToAll">📋 전체 작업 일정 보기</v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>


<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore'
import TaskCard from '@/components/TaskCard.vue'
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'
import debounce from 'lodash/debounce'

const router = useRouter()
const scheduleStore = useScheduleStore()
const userStore = useUserStore()
const scheduleMeta = ref(null)

const loading = ref(false)

const todayKST = computed(() => {
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000
  const kst = new Date(now.getTime() + kstOffset)
  return kst.toISOString().split('T')[0]
})

const selectedDate = ref(todayKST.value)

function formatDateWithDay(dateStr) {
  const date = new Date(dateStr)
  const day = date.toLocaleDateString('ko-KR', { weekday: 'short' })
  if (dateStr === todayKST.value) {
    return `오늘`
  } else {
    return `${dateStr} (${day})`
  }
}

const displayDate = computed(() => formatDateWithDay(selectedDate.value))

const displayDday = computed(() => {
  if (selectedDate.value === todayKST.value) {
    return '오늘'
  } else {
    const today = new Date(todayKST.value)
    const target = new Date(selectedDate.value)
    const diff = Math.floor((target - today) / (1000 * 60 * 60 * 24))
    return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`
  }
})

async function loadSchedules(date) {
  const q = query(collection(db, 'schedules'), where('date', '==', date))
  const snap = await getDocs(q)
  const schedules = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  scheduleStore.setSchedules(schedules)
}

async function loadScheduleMeta(date) {
  const q = query(collection(db, 'schedulesMeta'), where('date', '==', date), limit(1))
  const snap = await getDocs(q)
  if (!snap.empty) {
    const data = snap.docs[0].data()
    const userDocs = await Promise.all(data.workers.map(id => getDoc(doc(db, 'users', id))))
    data.workerNames = userDocs.map(u => u.exists() ? u.data().name : '알 수 없음')
    scheduleMeta.value = data
  } else {
    scheduleMeta.value = null
  }
}

const debouncedLoadData = debounce(async (date) => {
  loading.value = true
  await Promise.all([loadSchedules(date), loadScheduleMeta(date)])
  loading.value = false
}, 300)

function changeDate(offset) {
  const current = new Date(selectedDate.value)
  current.setDate(current.getDate() + offset)
  const newDateStr = current.toISOString().split('T')[0]
  selectedDate.value = newDateStr
  debouncedLoadData(newDateStr)
}

function logout() {
  userStore.logout()
  router.push('/login')
}

function goToAll() { router.push('/schedules') }
function goToDetail(id) { router.push(`/schedule/${id}`) }
function goToMetaEdit() { router.push('/meta') }
function goToWorker() { router.push('/worker-schedules') }
function goToPayroll() { router.push('/payroll') }
function goToAdd() { router.push('/add') }

const activeSchedules = computed(() => scheduleStore.schedules.filter(s => s.status === '진행'))
const completedSchedules = computed(() => scheduleStore.schedules.filter(s => s.status !== '진행' && s.status !== '취소됨'))

const completedDoneSchedules = computed(() =>
  completedSchedules.value.filter(s => s.status === '완료')
)
const completedHoldSchedules = computed(() =>
  completedSchedules.value.filter(s => s.status === '보류')
)

onMounted(async () => {
  // 유저 정보 복원
  if (!userStore.userId) {
    const storedId = localStorage.getItem('user_id')
    const storedName = localStorage.getItem('user_name')
    const storedRole = localStorage.getItem('user_role')
    if (storedId && storedName && storedRole) {
      userStore.setUser({
        id: storedId,
        name: storedName,
        role: storedRole
      })
    }
  }

  // 최초 로딩
  loading.value = true
  await Promise.all([loadSchedules(selectedDate.value), loadScheduleMeta(selectedDate.value)])
  loading.value = false
})
</script>

<style scoped>
.meta-info-card {
  background-color: #f0f4ff;
  border-left: 5px solid #2196f3;
  transition: background 0.2s;
}
.meta-info-card:hover {
  background-color: #e3edff;
}
.meta-label {
  font-weight: 600;
  font-size: 13px;
  color: #616161;
  margin-bottom: 4px;
}
.meta-value {
  font-size: 15px;
}
.meta-title {
  font-weight: 700;
  font-size: 16px;
}
.section-title {
  font-weight: 700;
  font-size: 16px;
  margin-top: 16px;
  margin-bottom: 10px;
}
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