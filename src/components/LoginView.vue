<template>
  <v-container class="fill-height d-flex align-center justify-center" fluid>
    <v-card class="pa-6" max-width="400" width="100%">
      <v-card-title class="text-h5 text-center mb-4">
        🔐 작업자 로그인
      </v-card-title>

      <v-text-field
        v-model="inputId"
        label="사용자 ID"
        placeholder="예: user001"
        variant="outlined"
        density="comfortable"
        class="mb-3"
        hide-details
        @keyup.enter="handleLogin"
      />

      <v-text-field
        v-model="inputPw"
        label="비밀번호"
        type="password"
        placeholder="••••••"
        variant="outlined"
        density="comfortable"
        class="mb-4"
        hide-details
        @keyup.enter="handleLogin"
      />

      <v-btn
        color="primary"
        block
        size="large"
        class="mb-2"
        @click="handleLogin"
      >
        로그인
      </v-btn>

      <v-alert v-if="error" type="error" density="comfortable" class="mt-2">
        {{ error }}
      </v-alert>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useUserStore } from '@/stores/user'
import { getAuth, signInAnonymously } from 'firebase/auth'

const inputId = ref('')
const inputPw = ref('')
const error = ref('')
const router = useRouter()
const userStore = useUserStore()
const auth = getAuth()

async function handleLogin() {
  if (!inputId.value || !inputPw.value) {
    error.value = 'ID와 비밀번호를 모두 입력하세요.'
    return
  }

  try {
    // ✅ 1. Firebase Auth 익명 로그인
    await signInAnonymously(auth)

    // ✅ 2. Firestore에서 사용자 정보 확인
    const userRef = doc(db, 'users', inputId.value)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      error.value = '등록되지 않은 사용자입니다.'
      return
    }

    const user = userSnap.data()

    if (user.password !== inputPw.value) {
      error.value = '비밀번호가 일치하지 않습니다.'
      return
    }

    // ✅ 3. localStorage 저장
    localStorage.setItem('user_id', inputId.value)
    localStorage.setItem('user_name', user.name)
    localStorage.setItem('user_role', user.role)

    // ✅ 4. Pinia에 저장
    userStore.setUser({
      id: inputId.value,
      name: user.name,
      role: user.role,
    })

    // ✅ 5. 초기화 및 이동
    inputId.value = ''
    inputPw.value = ''
    error.value = ''
    router.push('/')
  } catch (err) {
    console.error('로그인 오류:', err)
    error.value = '로그인 처리 중 오류가 발생했습니다.'
  }
}
</script>
