<template>
  <v-app>
    <v-app-bar color="primary" dark flat>
      <v-toolbar-title>공조플러스</v-toolbar-title>
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
          <v-btn color="primary" :to="'/add'">+ 작업 등록</v-btn>
        </v-row>

        <v-divider class="my-4"></v-divider>

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
                  <div v-for="t in item.tasks" :key="t.name">
                    작업: {{ t.name }} ({{ t.count }}대)
                  </div>
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
                  <div v-for="t in item.tasks" :key="t.name">
                    작업: {{ t.name }} ({{ t.count }}대)
                  </div>
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
                  <div v-for="t in item.tasks" :key="t.name">
                    작업: {{ t.name }} ({{ t.count }}대)
                  </div>
                  상태: {{ item.status }} / 세금계산서: {{ item.invoice ? 'O' : 'X' }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </div>

        <div v-if="!activeSchedules.length && !completedSchedules.length" class="text-subtitle-1 mt-4 text-grey">
          오늘 등록된 작업 일정이 없습니다.
        </div>

        <v-divider class="my-6"></v-divider>
        <v-btn color="secondary" block @click="goToAll">
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
import { collection, query, where, getDocs } from 'firebase/firestore'

const router = useRouter()
const todaySchedules = ref([])
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

const activeSchedules = computed(() =>
  todaySchedules.value.filter(s =>
    s.status === '진행' && s.status !== '취소됨'
  )
)

const completedSchedules = computed(() =>
  todaySchedules.value.filter(s =>
    (s.status === '완료' || s.status === '보류') && s.status !== '취소됨'
  )
)

onMounted(() => {
  loadSchedules()
})
</script>
