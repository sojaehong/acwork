import { defineStore } from 'pinia'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    schedules: [],
    selectedSchedule: null
  }),
  actions: {
    setSchedules(schedules) {
      this.schedules = schedules
    },
    appendSchedule(schedule) {
      this.schedules.push(schedule)
    },
    updateSchedule(updatedSchedule) {
      const index = this.schedules.findIndex(s => s.id === updatedSchedule.id)
      if (index !== -1) {
        this.schedules[index] = { ...this.schedules[index], ...updatedSchedule }
      }
    },
    setSelectedSchedule(schedule) {
      this.selectedSchedule = schedule
    }
  }
})
