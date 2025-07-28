import { db } from '@/firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore'

// 사용자 정보 캐시
class UserCache {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5분
  }

  // 캐시에서 사용자 정보 가져오기
  get(userId) {
    const cached = this.cache.get(userId)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  // 캐시에 사용자 정보 저장
  set(userId, userData) {
    this.cache.set(userId, {
      data: userData,
      timestamp: Date.now(),
    })
  }

  // 여러 사용자 정보를 한 번에 캐시에 저장
  setMany(userDataArray) {
    const timestamp = Date.now()
    userDataArray.forEach(({ userId, userData }) => {
      this.cache.set(userId, {
        data: userData,
        timestamp,
      })
    })
  }

  // 캐시 클리어
  clear() {
    this.cache.clear()
  }

  // 만료된 캐시 엔트리 제거
  cleanup() {
    const now = Date.now()
    for (const [userId, cached] of this.cache) {
      if (now - cached.timestamp >= this.cacheTimeout) {
        this.cache.delete(userId)
      }
    }
  }

  // 단일 사용자 정보 가져오기 (캐시 우선)
  async getUser(userId) {
    // 1. 캐시에서 먼저 확인
    const cached = this.get(userId)
    if (cached) {
      return cached
    }

    // 2. Firestore에서 가져오기
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        this.set(userId, userData)
        return userData
      }
      return null
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  }

  // 여러 사용자 정보 최적화된 배치 조회
  async getUsers(userIds) {
    if (!userIds || userIds.length === 0) return []

    const uniqueIds = [...new Set(userIds)] // 중복 제거
    const results = []
    const uncachedIds = []

    // 1. 캐시에서 먼저 확인
    for (const userId of uniqueIds) {
      const cached = this.get(userId)
      if (cached) {
        results.push({ userId, userData: cached })
      } else {
        uncachedIds.push(userId)
      }
    }

    // 2. 캐시되지 않은 사용자들을 배치 조회
    if (uncachedIds.length > 0) {
      try {
        // Firestore의 'in' 쿼리 사용 (최대 10개씩)
        const batchSize = 10
        const batches = []

        for (let i = 0; i < uncachedIds.length; i += batchSize) {
          const batch = uncachedIds.slice(i, i + batchSize)
          batches.push(batch)
        }

        const batchPromises = batches.map(async (batch) => {
          const usersRef = collection(db, 'users')
          const q = query(usersRef, where('__name__', 'in', batch))
          const snapshot = await getDocs(q)

          const batchResults = []
          snapshot.forEach((doc) => {
            const userData = { ...doc.data(), uid: doc.id }
            batchResults.push({ userId: doc.id, userData })
          })

          return batchResults
        })

        const batchResults = await Promise.all(batchPromises)
        const flatResults = batchResults.flat()

        // 3. 결과를 캐시에 저장
        this.setMany(flatResults)
        results.push(...flatResults)

        // 4. 조회되지 않은 사용자 ID 처리
        const foundIds = new Set(flatResults.map((r) => r.userId))
        for (const userId of uncachedIds) {
          if (!foundIds.has(userId)) {
            // 존재하지 않는 사용자로 표시
            const userData = { name: '알 수 없음', uid: userId }
            this.set(userId, userData)
            results.push({ userId, userData })
          }
        }
      } catch (error) {
        console.error('Error fetching users in batch:', error)

        // 에러 시 개별 조회 fallback
        const fallbackPromises = uncachedIds.map(async (userId) => {
          const userData = await this.getUser(userId)
          return {
            userId,
            userData: userData || { name: '알 수 없음', uid: userId },
          }
        })

        const fallbackResults = await Promise.allSettled(fallbackPromises)
        for (const result of fallbackResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value)
          }
        }
      }
    }

    // 5. 원본 순서 유지하여 반환
    return userIds.map((userId) => {
      const found = results.find((r) => r.userId === userId)
      return found?.userData || { name: '알 수 없음', uid: userId }
    })
  }

  // 사용자 이름만 가져오기 (경량화)
  async getUserNames(userIds) {
    const users = await this.getUsers(userIds)
    return users.map((user) => user.name || '알 수 없음')
  }
}

// 싱글톤 인스턴스
const userCache = new UserCache()

// 정기적인 캐시 정리 (5분마다)
setInterval(
  () => {
    userCache.cleanup()
  },
  5 * 60 * 1000
)

export default userCache
