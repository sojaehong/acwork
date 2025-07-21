import { defineStore } from 'pinia'
import { db } from '@/firebase/config'
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
  where,
  limit,
} from 'firebase/firestore'
import userCache from '@/utils/userCache'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    schedules: [],
    schedulesMeta: {},
    selectedSchedule: null,
    isLoading: false,
    error: null,
    filters: {
      status: [],
      building: [],
      task: [],
      invoice: null,
      searchText: '',
      startDate: null,
      endDate: null,
    },
  }),

  getters: {
    getScheduleById: (state) => (id) => {
      return state.schedules.find((s) => s.id === id)
    },
    getMetaByDate: (state) => (date) => {
      return state.schedulesMeta[date]
    },
    // 새로 추가: 필터링된 스케줄
    getFilteredSchedules: (state) => {
      let filtered = [...state.schedules]

      if (state.filters.status.length > 0) {
        filtered = filtered.filter(s => 
          s.status && state.filters.status.includes(s.status)
        )
      }

      if (state.filters.building.length > 0) {
        filtered = filtered.filter(s => 
          s.building && state.filters.building.includes(s.building)
        )
      }

      if (state.filters.task.length > 0) {
        filtered = filtered.filter(s => 
          s.tasks && s.tasks.some(task => 
            state.filters.task.includes(task.name)
          )
        )
      }

      if (state.filters.invoice !== null) {
        const hasInvoice = state.filters.invoice === 'O'
        filtered = filtered.filter(s => Boolean(s.invoice) === hasInvoice)
      }

      if (state.filters.searchText) {
        const searchText = state.filters.searchText.toLowerCase()
        filtered = filtered.filter(s =>
          (s.room && s.room.toLowerCase().includes(searchText)) ||
          (s.memo && s.memo.toLowerCase().includes(searchText)) ||
          (s.building && s.building.toLowerCase().includes(searchText))
        )
      }

      if (state.filters.startDate) {
        filtered = filtered.filter(s => 
          s.date && s.date >= state.filters.startDate
        )
      }
      if (state.filters.endDate) {
        filtered = filtered.filter(s => 
          s.date && s.date <= state.filters.endDate
        )
      }

      return filtered
    },
    // 새로 추가: 에러 상태 확인
    hasError: (state) => Boolean(state.error),
  },

  actions: {
    // 새로 추가: 에러 관리
    setError(error, context = '') {
      this.error = error?.message || error || `${context} 중 오류가 발생했습니다.`
      console.error(`[ScheduleStore] ${context}:`, error)
    },

    clearError() {
      this.error = null
    },

    // Firestore Actions (기존 코드 + 개선된 에러 처리)
    async fetchSchedulesByDate(date) {
      this.isLoading = true
      this.clearError()
      
      try {
        const q = query(collection(db, 'schedules'), where('date', '==', date))
        const snapshot = await getDocs(q)
        this.schedules = snapshot.docs.map((doc) => {
          return {
            id: doc.id,
            ...doc.data(),
          }
        })
      } catch (err) {
        this.setError(err, '일정 데이터 조회')
      } finally {
        this.isLoading = false
      }
    },

    async fetchAllSchedules() {
      this.isLoading = true
      this.clearError()
      
      try {
        const q = query(collection(db, 'schedules'), orderBy('date', 'desc'))
        const snapshot = await getDocs(q)
        this.schedules = snapshot.docs.map((doc) => {
          return {
            id: doc.id,
            ...doc.data(),
          }
        })
      } catch (err) {
        this.setError(err, '전체 일정 데이터 조회')
      } finally {
        this.isLoading = false
      }
    },

    async fetchSchedulesMetaByDate(date) {
      this.isLoading = true
      this.clearError()
      
      try {
        const q = query(
          collection(db, 'schedulesMeta'),
          where('date', '==', date),
          limit(1)
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
          const data = snap.docs[0].data()
          
          // 🚀 최적화: 작업자 정보 배치 조회로 N+1 문제 해결
          if (data.workers && data.workers.length > 0) {
            try {
              data.workerNames = await userCache.getUserNames(data.workers)
            } catch (userErr) {
              console.warn('작업자 정보 조회 중 일부 오류:', userErr)
              data.workerNames = []
            }
          } else {
            data.workerNames = []
          }
          
          this.schedulesMeta[date] = { id: snap.docs[0].id, ...data }
        } else {
          this.schedulesMeta[date] = null
        }
      } catch (err) {
        this.setError(err, '메타 데이터 조회')
      } finally {
        this.isLoading = false
      }
    },

    async addScheduleMeta(metaData) {
      this.isLoading = true
      this.clearError()
      
      try {
        const docRef = await addDoc(collection(db, 'schedulesMeta'), {
          ...metaData,
          createdAt: serverTimestamp(),
        })
        this.schedulesMeta[metaData.date] = { id: docRef.id, ...metaData }
        return { id: docRef.id, ...metaData }
      } catch (err) {
        this.setError(err, '메타 데이터 추가')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async updateScheduleMeta(id, metaData) {
      this.isLoading = true
      this.clearError()
      
      try {
        const docRef = doc(db, 'schedulesMeta', id)
        await updateDoc(docRef, {
          ...metaData,
          updatedAt: serverTimestamp(),
        })
        this.schedulesMeta[metaData.date] = { id, ...metaData }
      } catch (err) {
        this.setError(err, '메타 데이터 수정')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async deleteScheduleMeta(id, date) {
      this.isLoading = true
      this.clearError()
      
      try {
        const docRef = doc(db, 'schedulesMeta', id)
        await deleteDoc(docRef)
        delete this.schedulesMeta[date]
      } catch (err) {
        this.setError(err, '메타 데이터 삭제')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchScheduleById(id) {
      this.isLoading = true
      this.clearError()
      
      try {
        const docRef = doc(db, 'schedules', id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const schedule = { id: docSnap.id, ...docSnap.data() }
          this.setSelectedSchedule(schedule)
          // Add to list if not already present
          if (!this.schedules.some((s) => s.id === id)) {
            this.schedules.push(schedule)
          }
          return schedule
        } else {
          throw new Error('해당 ID의 일정을 찾을 수 없습니다.')
        }
      } catch (err) {
        this.setError(err, '일정 조회')
        return null
      } finally {
        this.isLoading = false
      }
    },

    async addSchedule(scheduleData) {
      this.isLoading = true
      this.clearError()
      
      try {
        const dataWithTimestamp = {
          ...scheduleData,
          createdAt: serverTimestamp(),
        }
        const docRef = await addDoc(
          collection(db, 'schedules'),
          dataWithTimestamp
        )
        const newSchedule = {
          id: docRef.id,
          ...scheduleData,
          createdAt: new Date(),
        }
        this.schedules.unshift(newSchedule) // Add to the beginning of the list
        return newSchedule
      } catch (err) {
        this.setError(err, '일정 추가')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async updateSchedule(scheduleData) {
      this.isLoading = true
      this.clearError()
      
      try {
        const { id, ...dataToUpdate } = scheduleData
        const docRef = doc(db, 'schedules', id)
        await updateDoc(docRef, dataToUpdate)

        const index = this.schedules.findIndex((s) => s.id === id)
        if (index !== -1) {
          this.schedules[index] = { ...this.schedules[index], ...dataToUpdate }
        }
        this.setSelectedSchedule(this.schedules[index])
      } catch (err) {
        this.setError(err, '일정 수정')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async deleteSchedule(id) {
      this.isLoading = true
      this.clearError()
      
      try {
        const docRef = doc(db, 'schedules', id)
        await deleteDoc(docRef)
        this.schedules = this.schedules.filter((s) => s.id !== id)
        
        // 선택된 일정이 삭제된 경우 초기화
        if (this.selectedSchedule && this.selectedSchedule.id === id) {
          this.selectedSchedule = null
        }
      } catch (err) {
        this.setError(err, '일정 삭제')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    // Local State Actions
    setSelectedSchedule(schedule) {
      this.selectedSchedule = schedule
    },

    setFilters(newFilters) {
      // 안전한 필터 업데이트
      if (newFilters && typeof newFilters === 'object') {
        this.filters = {
          ...this.filters,
          ...newFilters,
        }
      }
    },

    // 🚀 새로 추가: 필터 토글 메서드
    toggleFilter(type, value) {
      if (!type || value === undefined) return
      
      switch (type) {
        case 'status':
        case 'building':
        case 'task':
          const currentArray = this.filters[type] || []
          const index = currentArray.indexOf(value)
          if (index === -1) {
            this.filters[type] = [...currentArray, value]
          } else {
            this.filters[type] = currentArray.filter(item => item !== value)
          }
          break
        case 'invoice':
          // 세금계산서는 단일 선택 (O/X)
          this.filters.invoice = this.filters.invoice === value ? null : value
          break
        default:
          console.warn(`Unknown filter type: ${type}`)
      }
    },

    resetFilters() {
      this.filters = {
        status: [],
        building: [],
        task: [],
        invoice: null,
        searchText: '',
        startDate: null,
        endDate: null,
      }
    },

    // 새로 추가: 안전한 상태 초기화
    resetState() {
      this.schedules = []
      this.schedulesMeta = {}
      this.selectedSchedule = null
      this.isLoading = false
      this.error = null
      this.resetFilters()
    },
  },
})