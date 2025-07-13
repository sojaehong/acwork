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
  },

  actions: {
    // Firestore Actions
    async fetchSchedules(date) {
      this.isLoading = true
      this.error = null
      try {
        const q = query(collection(db, 'schedules'), where('date', '==', date))
        const snapshot = await getDocs(q)
        this.schedules = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      } catch (err) {
        this.error = '일정 데이터를 불러오는 중 오류가 발생했습니다.'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    async fetchSchedulesMetaByDate(date) {
      this.isLoading = true
      this.error = null
      try {
        const q = query(
          collection(db, 'schedulesMeta'),
          where('date', '==', date),
          limit(1)
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
          const data = snap.docs[0].data()
          const userDocs = await Promise.all(
            data.workers.map((id) => getDoc(doc(db, 'users', id)))
          )
          data.workerNames = userDocs.map((u) =>
            u.exists() ? u.data().name : '알 수 없음'
          )
          this.schedulesMeta[date] = { id: snap.docs[0].id, ...data }
        } else {
          this.schedulesMeta[date] = null
        }
      } catch (err) {
        this.error = '일정 메타 데이터를 불러오는 중 오류가 발생했습니다.'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    async addScheduleMeta(metaData) {
      this.isLoading = true
      this.error = null
      try {
        const docRef = await addDoc(collection(db, 'schedulesMeta'), {
          ...metaData,
          createdAt: serverTimestamp(),
        })
        this.schedulesMeta[metaData.date] = { id: docRef.id, ...metaData }
        return { id: docRef.id, ...metaData }
      } catch (err) {
        this.error = '일정 메타 데이터 추가 중 오류가 발생했습니다.'
        console.error(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async updateScheduleMeta(id, metaData) {
      this.isLoading = true
      this.error = null
      try {
        const docRef = doc(db, 'schedulesMeta', id)
        await updateDoc(docRef, {
          ...metaData,
          updatedAt: serverTimestamp(),
        })
        this.schedulesMeta[metaData.date] = { id, ...metaData }
      } catch (err) {
        this.error = '일정 메타 데이터 수정 중 오류가 발생했습니다.'
        console.error(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async deleteScheduleMeta(id, date) {
      this.isLoading = true
      this.error = null
      try {
        const docRef = doc(db, 'schedulesMeta', id)
        await deleteDoc(docRef)
        delete this.schedulesMeta[date]
      } catch (err) {
        this.error = '일정 메타 데이터 삭제 중 오류가 발생했습니다.'
        console.error(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchScheduleById(id) {
      this.isLoading = true
      this.error = null
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
        this.error = err.message
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    async addSchedule(scheduleData) {
      this.isLoading = true
      this.error = null
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
        this.error = '일정 추가 중 오류가 발생했습니다.'
        console.error(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async updateSchedule(scheduleData) {
      this.isLoading = true
      this.error = null
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
        this.error = '일정 수정 중 오류가 발생했습니다.'
        console.error(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async deleteSchedule(id) {
      this.isLoading = true
      this.error = null
      try {
        const docRef = doc(db, 'schedules', id)
        await deleteDoc(docRef)
        this.schedules = this.schedules.filter((s) => s.id !== id)
      } catch (err) {
        this.error = '일정 삭제 중 오류가 발생했습니다.'
        console.error(err)
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
      this.filters = {
        ...this.filters,
        ...newFilters,
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
  },
})
