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
    setSelectedSchedule(schedule) {
      this.selectedSchedule = schedule
    }
  }
})
