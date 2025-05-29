<template>
  <v-container class="pa-4">
    <h2 class="text-h5 mb-4">📋 전체 작업 일정</h2>

    <v-btn color="primary" class="mb-4" @click="goToAdd">+ 새 일정 등록</v-btn>

    <v-alert v-if="loading" type="info">불러오는 중...</v-alert>
    <v-alert v-if="error" type="error">{{ error }}</v-alert>

    <v-row v-if="schedules.length">
      <v-col
        v-for="(item, idx) in schedules"
        :key="idx"
        cols="12"
        md="6"
        @click="goToDetail(item.id)"
      >
        <v-card class="mb-3 pa-3" hover style="cursor: pointer">
          <v-card-title class="text-h6">
            {{ item.date }} – {{ item.building }} {{ item.unit }}동 {{ item.room }}호
          </v-card-title>
          <v-card-subtitle>
            작업: {{ item.type }} / 상태: {{ item.status }}
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <div v-else class="text-grey text-subtitle-1 mt-4">등록된 일정이 없습니다.</div>

    <!-- ✅ 하단에 홈으로 이동 버튼 -->
    <v-divider class="my-6"></v-divider>
    <v-btn color="secondary" block @click="goHome">
      홈으로
    </v-btn>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/firebase/config'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const router = useRouter()
const schedules = ref([])
const loading = ref(true)
const error = ref('')

function goToAdd() {
  router.push('/add')
}

function goToDetail(id) {
  router.push(`/schedule/${id}`)
}

function goHome() {
  router.push('/')
}

onMounted(async () => {
  try {
    const q = query(collection(db, 'schedules'), orderBy('date', 'desc'))
    const snapshot = await getDocs(q)
    schedules.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (err) {
    error.value = '일정을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})
</script>
