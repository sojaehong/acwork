import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// Lazy-loading 적용
const LoginView = () => import('@/components/LoginView.vue')
const Home = () => import('@/pages/Home.vue')
const ScheduleAdd = () => import('@/pages/ScheduleAdd.vue')
const ScheduleList = () => import('@/pages/ScheduleList.vue')
const ScheduleDetail = () => import('@/pages/ScheduleDetail.vue')
const EditSchedule = () => import('@/pages/EditSchedule.vue')
const SchedulesMeta = () => import('@/pages/SchedulesMeta.vue')
const WorkerSchedules = () => import('@/pages/WorkerSchedules.vue')
const WorkerPayroll = () => import('@/pages/WorkerPayroll.vue')

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/add', name: 'ScheduleAdd', component: ScheduleAdd },
  { path: '/schedules', name: 'ScheduleList', component: ScheduleList },
  { path: '/schedule/:id', name: 'ScheduleDetail', component: ScheduleDetail },
  { path: '/schedule/:id/edit', name: 'EditSchedule', component: EditSchedule },
  { path: '/meta', name: 'SchedulesMeta', component: SchedulesMeta },
  { path: '/worker-schedules', name: 'WorkerSchedules', component: WorkerSchedules },
  { path: '/payroll', name: 'WorkerPayroll', component: WorkerPayroll }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 인증 가드 with localStorage 동기화
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  const storedId = localStorage.getItem('user_id')
  const storedName = localStorage.getItem('user_name')
  const storedRole = localStorage.getItem('user_role')

  const isLoggedIn = !!userStore.userId || !!storedId

  // 🧩 store가 비어 있으면 localStorage 값으로 복원
  if (storedId && !userStore.userId) {
    userStore.setUser({
      id: storedId,
      name: storedName,
      role: storedRole
    })
  }

  // 🔒 비로그인 상태에서 보호된 페이지 접근 시 → 로그인 페이지로
  if (!isLoggedIn && to.path !== '/login') {
    return next('/login')
  }

  // 🔁 로그인 상태인데 /login 접근 시 → 홈으로 리디렉션
  if (isLoggedIn && to.path === '/login') {
    return next('/')
  }

  return next()
})

export default router
