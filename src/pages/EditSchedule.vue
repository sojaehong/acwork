<template>
  <v-container class="pa-4">
    <h2 class="text-h5 mb-4">✏️ 일정 수정</h2>

    <!-- 건물 선택 -->
    <div class="mb-4">
      <div class="mb-2">건물 선택</div>
      <v-btn-toggle v-model="form.building" mandatory class="d-flex flex-wrap">
        <v-btn v-for="b in buildings" :key="b" :value="b" class="ma-1" color="primary" variant="tonal">{{ b }}</v-btn>
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
        <v-btn v-for="u in units" :key="u" :value="u" class="ma-1" color="primary" variant="tonal">{{ u }}</v-btn>
      </v-btn-toggle>
      <v-text-field
        v-if="form.unit === '기타'"
        v-model="form.unitEtc"
        label="동 직접 입력"
        outlined
      />
    </div>

    <v-text-field v-model="form.room" label="호수" outlined class="mb-4" />

    <!-- 작업 종류 -->
    <div class="mb-4">
      <div class="mb-2">작업 종류</div>
      <v-btn-toggle v-model="form.type" mandatory class="d-flex flex-wrap">
        <v-btn v-for="t in types" :key="t" :value="t" class="ma-1" color="secondary" variant="tonal">{{ t }}</v-btn>
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
        <v-btn v-for="s in statuses" :key="s" :value="s" class="ma-1" color="success" variant="tonal">{{ s }}</v-btn>
      </v-btn-toggle>
    </div>

    <v-text-field
      v-model="form.date"
      label="날짜"
      type="date"
      outlined
      class="mb-4"
    />

    <v-textarea
      v-model="form.memo"
      label="작업 관련 메모 (선택사항)"
      outlined
      rows="3"
      class="mb-4"
    />

    <v-btn color="primary" block class="mt-4" @click="submit">수정 완료</v-btn>
    <v-btn color="secondary" block class="mt-2" @click="goBack">돌아가기</v-btn>

  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

const router = useRouter()
const route = useRoute()

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
  status: '',
  date: '',
  memo: ''
})

onMounted(async () => {
  const id = route.params.id
  const snap = await getDoc(doc(db, 'schedules', id))
  if (!snap.exists()) {
    alert('일정을 찾을 수 없습니다.')
    router.push('/')
    return
  }
  const data = snap.data()
  form.value = {
    building: buildings.includes(data.building) ? data.building : '기타',
    buildingEtc: buildings.includes(data.building) ? '' : data.building,
    unit: units.includes(data.unit) ? data.unit : '기타',
    unitEtc: units.includes(data.unit) ? '' : data.unit,
    room: data.room,
    type: types.includes(data.type) ? data.type : '기타',
    typeEtc: types.includes(data.type) ? '' : data.type,
    status: data.status,
    date: data.date,
    memo: data.memo || ''
  }
})

function goBack() {
  router.back()
}

async function submit() {
  const id = route.params.id
  const data = {
    building: form.value.building === '기타' ? form.value.buildingEtc : form.value.building,
    unit: form.value.unit === '기타' ? form.value.unitEtc : form.value.unit,
    room: form.value.room,
    type: form.value.type === '기타' ? form.value.typeEtc : form.value.type,
    status: form.value.status,
    date: form.value.date,
    memo: form.value.memo
  }

  await updateDoc(doc(db, 'schedules', id), data)
  alert('일정이 수정되었습니다.')
  router.push(`/schedule/${id}`)
}
</script>
