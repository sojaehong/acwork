import { defineStore } from 'pinia'

export const useWorkerStore = defineStore('worker', {
  state: () => ({
    workers: [],
    selectedWorker: null
  }),
  actions: {
    setWorkers(workers) {
      this.workers = workers
    },
    setSelectedWorker(worker) {
      this.selectedWorker = worker
    }
  }
})
