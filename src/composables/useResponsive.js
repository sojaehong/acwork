import { ref, onMounted, onUnmounted } from 'vue'
import { throttle } from '@/utils/debounce'

const windowWidth = ref(0)
const isInitialized = ref(false)

// 반응형 상태를 위한 composable
export function useResponsive() {
  const updateWidth = throttle(() => {
    windowWidth.value = window.innerWidth
  }, 100)

  const initializeWidth = () => {
    if (typeof window !== 'undefined' && !isInitialized.value) {
      windowWidth.value = window.innerWidth
      window.addEventListener('resize', updateWidth)
      isInitialized.value = true
    }
  }

  const cleanupWidth = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', updateWidth)
    }
  }

  onMounted(initializeWidth)
  onUnmounted(cleanupWidth)

  return {
    windowWidth,
    isMobile: () => windowWidth.value <= 768,
    isTablet: () => windowWidth.value > 768 && windowWidth.value <= 1024,
    isDesktop: () => windowWidth.value > 1024,
    isXSmall: () => windowWidth.value <= 480,
    isSmall: () => windowWidth.value > 480 && windowWidth.value <= 768,
    
    // 컴포넌트별 크기 계산
    getBadgeSize: () => {
      if (windowWidth.value <= 480) return 'x-small'
      if (windowWidth.value <= 768) return 'small' 
      return 'small'
    },
    
    getIconSize: () => {
      if (windowWidth.value <= 480) return '12'
      if (windowWidth.value <= 768) return '14'
      return '14'
    }
  }
}