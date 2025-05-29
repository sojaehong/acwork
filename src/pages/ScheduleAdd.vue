<template>
  <v-container class="pa-4">
    <h2 class="text-h5 mb-4">📝 일정 등록</h2>

    <!-- 건물 선택 -->
    <div class="mb-4">
      <div class="mb-2">건물 선택</div>
      <v-btn-toggle v-model="form.building" mandatory class="d-flex flex-wrap">
        <v-btn
          v-for="b in buildings"
          :key="b"
          :value="b"
          class="ma-1"
          color="primary"
          variant="tonal"
        >{{ b }}</v-btn>
      </v-btn-toggle>
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
      <v-btn-toggle v-model="form.unit" mandatory class="d-flex flex-wrap">
        <v-btn
          v-for="u in units"
          :key="u"
          :value="u"
          class="ma-1"
          color="primary"
          variant="tonal"
        >{{ u }}</v-btn>
      </v-btn-toggle>
      <v-text-field
        v-if="form.unit === '기타'"
        v-model="form.unitEtc"
        label="동 직접 입력"
        outlined
      />
    </div>

    <!-- 호수 -->
    <v-text-field v-model="form.room" label="호수" outlined class="mb-4" />

    <!-- 작업 종류 -->
    <div class="mb-4">
      <div class="mb-2">작업 종류</div>
      <v-btn-toggle v-model="form.type" mandatory class="d-flex flex-wrap">
        <v-btn
          v-for="t in types"
          :key="t"
          :value="t"
          class="ma-1"
          color="secondary"
          variant="tonal"
        >{{ t }}</v-btn>
      </v-btn-toggle>
      <v-text-field
        v-if="form.type === '기타'"
        v-model="form.typeEtc"
        label="작업 종류 직접 입력"
        outlined
      />
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

    <!-- 날짜 -->
    <v-text-field
      v-model="form.date"
      label="날짜"
      type="date"
      outlined
      class="mb-4"
    />

    <!-- 메모 -->
    <v-textarea
      v-model="form.memo"
      label="작업 관련 메모 (선택사항)"
      outlined
      rows="3"
      class="mb-4"
    />

    <v-btn color="primary" block class="mt-4" @click="submit">등록</v-btn>
    <v-btn color="secondary" block class="mt-4" @click="goHome">홈으로</v-btn>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

// ✅ 한국 시간 기준 오늘 날짜 구하는 함수
function getTodayKR() {
  return new Date()
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    .replace(/\.\s?/g, '-')
    .replace(/\.$/, '')
}

const router = useRouter()

const buildings = ['테라타워', 'SKV1', '현대지식산업', '기타']
const units = ['A', 'B', 'C', 'D', '기타']
const types = ['설치', '수리', '청소', '기타']
const statuses = ['예정', '진행중', '완료', '보류']

const form = ref({
  building: '',
  buildingEtc: '',
  unit: '',
  unitEtc: '',
  room: '',
  type: '',
  typeEtc: '',
  status: '예정',
  date: getTodayKR(), // ✅ 오늘 날짜 자동 세팅
  memo: ''
})

function goHome() {
  router.push('/')
}

async function submit() {
  const data = {
    building: form.value.building === '기타' ? form.value.buildingEtc : form.value.building,
    unit: form.value.unit === '기타' ? form.value.unitEtc : form.value.unit,
    room: form.value.room,
    type: form.value.type === '기타' ? form.value.typeEtc : form.value.type,
    status: form.value.status,
    date: form.value.date,
    memo: form.value.memo,
    createdAt: serverTimestamp(),
    createdBy: localStorage.getItem('user_id')
  }

  await addDoc(collection(db, 'schedules'), data)
  router.push('/')
}
</script>
