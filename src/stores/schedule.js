import { defineStore } from 'pinia'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    schedules: [],
    selectedSchedule: null,

    // ✅ 필터 상태 통합
    filters: {
      status: [],
      building: [],
      task: [],
      invoice: null,
      searchText: '',
      startDate: null,
      endDate: null
    }
  }),

  actions: {
    // ✅ 전체 일정 데이터 설정
    setSchedules(schedules) {
      this.schedules = schedules
    },

    // ✅ 단건 추가
    appendSchedule(schedule) {
      this.schedules.push(schedule)
    },

    // ✅ 수정
    updateSchedule(updatedSchedule) {
      const index = this.schedules.findIndex(s => s.id === updatedSchedule.id)
      if (index !== -1) {
        this.schedules[index] = { ...this.schedules[index], ...updatedSchedule }
      }
    },

    // ✅ 삭제
    removeSchedule(id) {
      this.schedules = this.schedules.filter(s => s.id !== id)
    },

    // ✅ 선택된 일정 설정
    setSelectedSchedule(schedule) {
      this.selectedSchedule = schedule
    },

    // ✅ 필터 설정
    setFilters(newFilters) {
      this.filters = {
        ...this.filters,
        ...newFilters
      }
    },

    // ✅ 필터 초기화
    resetFilters() {
      this.filters = {
        status: [],
        building: [],
        task: [],
        invoice: null,
        searchText: '',
        startDate: null,
        endDate: null
      }
    }
  }
})
