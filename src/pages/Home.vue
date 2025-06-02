<template>
  <v-app>
    <!-- 상단바 -->
    <v-app-bar color="primary" dark flat>
      <v-toolbar-title>공조+</v-toolbar-title>
      <v-spacer />
      <span class="mr-2 font-weight-medium">{{ userName }}님</span>
      <v-btn icon @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- 본문 -->
    <v-main>
      <v-container class="pa-4" style="padding-bottom: 180px !important">
        <!-- 일정 메타 정보 카드 -->
        <v-card
          class="mb-6 elevation-0 meta-info-card"
          outlined
          @click="goToMetaEdit"
          style="cursor: pointer"
        >
          <v-row align="center" class="mb-2">
            <v-col>
              <v-icon color="primary" left>mdi-calendar-clock</v-icon>
              <span class="meta-title">오늘 작업 일정 요약</span>
            </v-col>
          </v-row>
          <v-divider class="mb-3"></v-divider>

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
                    :color="user === userName ? 'warning' : 'grey lighten-2'"
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
        </v-card>

        <!-- 작업 리스트: 진행 중 -->
        <div v-if="activeSchedules.length">
          <h3 class="section-title">🛠 진행 중</h3>
          <TaskCard
            v-for="item in activeSchedules"
            :key="item.id"
            :item="item"
            @click="goToDetail(item.id)"
          />
        </div>

        <!-- 작업 리스트: 완료 -->
        <div v-if="completedSchedules.filter(s => s.status === '완료').length">
          <h3 class="section-title">✅ 완료</h3>
          <TaskCard
            v-for="item in completedSchedules.filter(s => s.status === '완료')"
            :key="item.id"
            :item="item"
            @click="goToDetail(item.id)"
          />
        </div>

        <!-- 작업 리스트: 보류 -->
        <div v-if="completedSchedules.filter(s => s.status === '보류').length">
          <h3 class="section-title">⏸ 보류</h3>
          <TaskCard
            v-for="item in completedSchedules.filter(s => s.status === '보류')"
            :key="item.id"
            :item="item"
            @click="goToDetail(item.id)"
          />
        </div>

        <!-- 아무 작업도 없을 때 -->
        <v-alert v-if="!activeSchedules.length && !completedSchedules.length" type="info" class="mt-4">
          오늘 등록된 작업이 없습니다.
        </v-alert>
      </v-container>

      <!-- 하단 버튼 (고정) -->
      <v-container
        class="pa-2"
        style="position: fixed; bottom: 0; left: 0; right: 0; background: #fff; z-index: 100; box-shadow: 0 -2px 6px rgba(0,0,0,0.1);"
      >
        <v-row dense>
          <v-col cols="4">
            <v-btn color="info" block @click="goToWorker">👷 작업자별</v-btn>
          </v-col>
          <v-col cols="4">
            <v-btn color="success" block @click="goToPayroll">💰 정산</v-btn>
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
import TaskCard from '@/components/TaskCard.vue'

const router = useRouter()
const todaySchedules = ref([])
const scheduleMeta = ref(null)
const userName = localStorage.getItem('user_name') || '사용자'

function getTodayKST() {
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000 // 9시간
  const kst = new Date(now.getTime() + kstOffset)
  return kst.toISOString().split('T')[0]
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

function logout() { localStorage.clear(); router.push('/login') }
function goToAll() { router.push('/schedules') }
function goToDetail(id) { router.push(`/schedule/${id}`) }
function goToMetaEdit() { router.push('/meta') }
function goToWorker() { router.push('/worker-schedules') }
function goToPayroll() { router.push('/payroll') }
function goToAdd() { router.push('/add') }

const activeSchedules = computed(() => todaySchedules.value.filter(s => s.status === '진행'))
const completedSchedules = computed(() => todaySchedules.value.filter(s => s.status !== '진행' && s.status !== '취소됨'))

onMounted(() => {
  loadSchedules()
  loadScheduleMeta()
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
</style>
