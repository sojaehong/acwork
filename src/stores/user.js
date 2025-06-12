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
    updateUser(payload) {
      if (payload.id !== undefined) this.userId = payload.id
      if (payload.name !== undefined) this.userName = payload.name
      if (payload.role !== undefined) this.userRole = payload.role
    },
    restoreUserFromLocalStorage() {
      const storedId = localStorage.getItem('user_id')
      const storedName = localStorage.getItem('user_name')
      const storedRole = localStorage.getItem('user_role')

      if (storedId && storedName && storedRole) {
        this.userId = storedId
        this.userName = storedName
        this.userRole = storedRole
      }
    },
    logout() {
      this.userId = ''
      this.userName = ''
      this.userRole = ''
      localStorage.clear()
    }
  }
})
