<template>
  <v-app>
    <v-app-bar color="primary" dark flat>
      <v-toolbar-title>작업자 일정 관리</v-toolbar-title>
      <v-spacer />
      <span class="mr-2">{{ userName }}님</span>
      <v-btn icon @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container class="pa-4">
        <v-row align="center" justify="space-between">
          <h2 class="text-h5">📅 오늘의 작업 일정</h2>
          <v-btn color="primary" :to="'/add'">+ 일정 등록</v-btn>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <!-- 🔹 예정 및 진행중 -->
        <div v-if="activeSchedules.length">
          <h3 class="text-subtitle-1 mb-2">🛠 진행 중인 일정</h3>
          <v-list>
            <v-list-item
              v-for="item in activeSchedules"
              :key="item.id"
              style="cursor: pointer"
              @click="goToDetail(item.id)"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{ item.building }} {{ item.unit }}동 {{ item.room }}호
                </v-list-item-title>
                <v-list-item-subtitle>
                  작업: {{ item.type }} / 상태: {{ item.status }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </div>

        <!-- 🔹 완료 및 보류 -->
        <div v-if="completedSchedules.length">
          <h3 class="text-subtitle-1 mt-6 mb-2">✅ 완료 · 보류 일정</h3>
          <v-list>
            <v-list-item
              v-for="item in completedSchedules"
              :key="item.id"
              style="cursor: pointer"
              @click="goToDetail(item.id)"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{ item.building }} {{ item.unit }}동 {{ item.room }}호
                </v-list-item-title>
                <v-list-item-subtitle>
                  작업: {{ item.type }} / 상태: {{ item.status }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </div>

        <div v-if="!todaySchedules.length" class="text-subtitle-1 mt-4 text-grey">
          오늘 등록된 작업 일정이 없습니다.
        </div>

        <v-divider class="my-6"></v-divider>
        <v-btn color="secondary" block @click="goToAll">
          📋 전체 일정 보기
        </v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'

const router = useRouter()
const todaySchedules = ref([])
const userName = localStorage.getItem('user_name') || '사용자'

// ✅ KST 기준 오늘 날짜 구하기
function getTodayKST() {
  const local = new Date()
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset()) // KST 보정
  return local.toISOString().split('T')[0]
}

async function loadSchedules() {
  const today = getTodayKST()
  const q = query(collection(db, 'schedules'), where('date', '==', today))
  const snap = await getDocs(q)
  todaySchedules.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
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

// 상태별 분류
const activeSchedules = computed(() =>
  todaySchedules.value.filter(s => s.status === '예정' || s.status === '진행중')
)
const completedSchedules = computed(() =>
  todaySchedules.value.filter(s => s.status === '완료' || s.status === '보류')
)

onMounted(() => {
  loadSchedules()
})
</script>
