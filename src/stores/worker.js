import { defineStore } from 'pinia'

export const useWorkerStore = defineStore('worker', {
  state: () => ({
    workers: [],
    selectedWorker: null,
  }),
  actions: {
    setWorkers(workers) {
      this.workers = workers
    },
    appendWorker(worker) {
      this.workers.push(worker)
    },
    updateWorker(updatedWorker) {
      const index = this.workers.findIndex((w) => w.id === updatedWorker.id)
      if (index !== -1) {
        this.workers[index] = { ...this.workers[index], ...updatedWorker }
      }
    },
    setSelectedWorker(worker) {
      this.selectedWorker = worker
    },
  },
})
