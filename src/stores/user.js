import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: '',
    userName: '',
    userRole: ''
  }),
  actions: {
    setUser({ id, name, role }) {
      this.userId = id
      this.userName = name
      this.userRole = role
    },
    logout() {
      this.userId = ''
      this.userName = ''
      this.userRole = ''
      localStorage.clear()  // localStorage 도 같이 초기화해주면 깔끔
    }
  }
})
