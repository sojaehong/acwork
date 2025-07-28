import { defineStore } from 'pinia'
import { getAuth, signInAnonymously } from 'firebase/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: '',
    userName: '',
    userRole: '',
    isAuthenticated: false,
    isInitialized: false,
    initializationError: null,
  }),

  getters: {
    // 사용자 인증 상태 확인
    isLoggedIn: (state) =>
      !!state.userId && !!state.userName && !!state.userRole,

    // 사용자 정보 객체 반환
    userInfo: (state) => ({
      id: state.userId,
      name: state.userName,
      role: state.userRole,
    }),
  },

  actions: {
    setUser({ id, name, role }) {
      this.userId = id
      this.userName = name
      this.userRole = role
      this.isAuthenticated = true

      // localStorage에 저장
      localStorage.setItem('user_id', id)
      localStorage.setItem('user_name', name)
      localStorage.setItem('user_role', role)
    },

    updateUser(payload) {
      if (payload.id !== undefined) {
        this.userId = payload.id
        localStorage.setItem('user_id', payload.id)
      }
      if (payload.name !== undefined) {
        this.userName = payload.name
        localStorage.setItem('user_name', payload.name)
      }
      if (payload.role !== undefined) {
        this.userRole = payload.role
        localStorage.setItem('user_role', payload.role)
      }
    },

    restoreUserFromLocalStorage() {
      const storedId = localStorage.getItem('user_id')
      const storedName = localStorage.getItem('user_name')
      const storedRole = localStorage.getItem('user_role')

      if (storedId && storedName && storedRole) {
        this.userId = storedId
        this.userName = storedName
        this.userRole = storedRole
        this.isAuthenticated = true
        return true
      }
      return false
    },

    // 🚀 새로 추가: 통합 인증 초기화 메서드
    async initializeAuth(router = null) {
      // 이미 초기화되었다면 스킵
      if (this.isInitialized && this.isLoggedIn) {
        return { success: true }
      }

      this.initializationError = null

      try {
        // 1. Firebase 인증 확인
        const auth = getAuth()
        if (!auth.currentUser) {
          console.log('Firebase 재인증 중...')
          await signInAnonymously(auth)
        }

        // 2. localStorage에서 사용자 정보 복원
        const restored = this.restoreUserFromLocalStorage()

        if (!restored) {
          // 사용자 정보가 없으면 로그인 페이지로
          this.initializationError = '사용자 정보를 찾을 수 없습니다.'

          if (router) {
            await router.push('/login')
          }

          return {
            success: false,
            error: this.initializationError,
            shouldRedirect: true,
          }
        }

        this.isInitialized = true
        console.log('인증 초기화 완료:', this.userInfo)

        return { success: true }
      } catch (error) {
        console.error('인증 초기화 실패:', error)
        this.initializationError = '인증 초기화 중 오류가 발생했습니다.'

        // 3초 후 로그인 페이지로 리다이렉트
        if (router) {
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        }

        return {
          success: false,
          error: this.initializationError,
          originalError: error,
        }
      }
    },

    // 🔄 재시도 가능한 데이터 로딩 래퍼
    async withRetry(asyncFunction, maxRetries = 3, delayMs = 1000) {
      let retryCount = 0

      while (retryCount <= maxRetries) {
        try {
          return await asyncFunction()
        } catch (error) {
          retryCount++

          if (retryCount > maxRetries) {
            throw new Error(`${maxRetries}번 재시도 후 실패: ${error.message}`)
          }

          console.log(`재시도 ${retryCount}/${maxRetries}...`)
          await new Promise((resolve) =>
            setTimeout(resolve, delayMs * retryCount)
          )
        }
      }
    },

    // 🔐 인증이 필요한 작업을 안전하게 실행
    async executeWithAuth(asyncFunction, router = null) {
      // 먼저 인증 상태 확인
      const authResult = await this.initializeAuth(router)

      if (!authResult.success) {
        return authResult
      }

      try {
        const result = await asyncFunction()
        return { success: true, data: result }
      } catch (error) {
        console.error('인증된 작업 실행 실패:', error)
        return {
          success: false,
          error: error.message,
          originalError: error,
        }
      }
    },

    logout() {
      this.userId = ''
      this.userName = ''
      this.userRole = ''
      this.isAuthenticated = false
      this.isInitialized = false
      this.initializationError = null

      // localStorage 정리
      const keysToRemove = ['user_id', 'user_name', 'user_role']
      keysToRemove.forEach((key) => localStorage.removeItem(key))

      // 또는 전체 삭제: localStorage.clear()
    },

    // 🧹 상태 초기화 (디버깅용)
    resetState() {
      this.$reset()
      localStorage.clear()
    },
  },
})
