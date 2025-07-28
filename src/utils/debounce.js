// 디바운스 유틸리티 함수
export function debounce(func, delay) {
  let timeoutId

  return function debounced(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

// 쓰로틀 유틸리티 함수 (스크롤 이벤트용)
export function throttle(func, delay) {
  let timeoutId
  let lastExecTime = 0

  return function throttled(...args) {
    const currentTime = Date.now()

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args)
      lastExecTime = currentTime
    } else {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(
        () => {
          func.apply(this, args)
          lastExecTime = Date.now()
        },
        delay - (currentTime - lastExecTime)
      )
    }
  }
}

// 메모이제이션 유틸리티
export function memoize(func, getKey = (...args) => JSON.stringify(args)) {
  const cache = new Map()

  return function memoized(...args) {
    const key = getKey(...args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = func.apply(this, args)
    cache.set(key, result)

    // 메모리 누수 방지를 위해 캐시 크기 제한
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    return result
  }
}
