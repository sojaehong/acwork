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
  { path: '/', component: Home },
  { path: '/login', component: LoginView },
  { path: '/add', component: ScheduleAdd },
  { path: '/schedules', component: ScheduleList },
  { path: '/schedule/:id', component: ScheduleDetail },
  { path: '/schedule/:id/edit', name: 'EditSchedule', component: EditSchedule },
  { path: '/meta', component: SchedulesMeta },
  { path: '/worker-schedules', component: WorkerSchedules },
  { path: '/payroll', component: WorkerPayroll }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 인증 가드에 userStore 사용
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isLoggedIn = !!userStore.userId || !!localStorage.getItem('user_id')
  if (!isLoggedIn && to.path !== '/login') {
    next('/login')
  } else {
    next()
  }
})

export default router
