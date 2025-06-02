<template>
  <v-app>
    <v-main>
      <v-container class="pa-4 pb-16">
        <h2 class="text-h5 mb-4">📝 작업 등록</h2>

        <!-- 날짜 -->
        <div class="mb-4">
          <label class="mb-2 font-weight-bold d-block" style="font-size: 16px;">날짜 선택</label>
          <v-text-field
            v-model="form.date"
            type="date"
            outlined
            dense
            hide-details
            class="custom-date-field"
          />
        </div>

        <!-- 건물 선택 -->
        <div class="mb-4">
          <label class="mb-2 font-weight-bold d-block">건물 선택</label>
          <div class="button-grid">
            <v-btn
              v-for="b in buildings"
              :key="b"
              :value="b"
              :class="[form.building === b ? 'selected-btn' : '', 'grid-btn']"
              @click="form.building = b"
              color="primary"
              variant="tonal"
            >{{ b }}</v-btn>
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
          <label class="mb-2 font-weight-bold d-block">동 선택</label>
          <div class="button-grid">
            <v-btn
              v-for="u in units"
              :key="u"
              :value="u"
              :class="[form.unit === u ? 'selected-btn' : '', 'grid-btn']"
              @click="form.unit = u"
              color="primary"
              variant="tonal"
            >{{ u }}</v-btn>
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

        <!-- ... (기타 항목은 동일하게 유지) -->

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

const form = ref({
  building: '',
  buildingEtc: '',
  unit: '',
  unitEtc: '',
  room: '',
  date: new Date().toISOString().split('T')[0],
})

function goHome() {
  router.push('/')
}

async function submit() {
  const data = {
    building: form.value.building === '기타' ? form.value.buildingEtc : form.value.building,
    unit: form.value.unit === '기타' ? form.value.unitEtc : form.value.unit,
    room: form.value.room,
    date: form.value.date,
    createdAt: serverTimestamp(),
    createdBy: localStorage.getItem('user_id')
  }

  await addDoc(collection(db, 'schedules'), data)
  router.push('/')
}
</script>

<style scoped>
.custom-date-field input {
  font-size: 16px !important;
  height: 50px;
}

.button-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.grid-btn {
  min-width: 90px;
  height: 38px;
  font-size: 14px;
  white-space: nowrap;
}

.selected-btn {
  font-weight: bold;
  border: 2px solid #1976d2;
}
</style>
