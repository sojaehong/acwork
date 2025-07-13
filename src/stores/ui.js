import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    snackbar: {
      show: false,
      message: '',
      color: 'success',
      timeout: 3000,
    },
  }),
  actions: {
    showSnackbar(message, color = 'success', timeout = 3000) {
      this.snackbar.show = true
      this.snackbar.message = message
      this.snackbar.color = color
      this.snackbar.timeout = timeout
    },
    hideSnackbar() {
      this.snackbar.show = false
      this.snackbar.message = ''
    },
  },
})
