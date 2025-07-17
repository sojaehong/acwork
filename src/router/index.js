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
const EstimateForm = () => import('@/pages/EstimateForm.vue')
const StatementForm = () => import('@/pages/StatementForm.vue')
const NotFound = () => import('@/pages/NotFound.vue')

// 인증 관련 라우트
const authRoutes = [
  { 
    path: '/login', 
    name: 'Login', 
    component: LoginView, 
    meta: { requiresAuth: false } 
  }
]

// 스케줄 관련 라우트
const scheduleRoutes = [
  { 
    path: '/add', 
    name: 'ScheduleAdd', 
    component: ScheduleAdd,
    meta: { requiresAuth: true }
  },
  { 
    path: '/schedules', 
    name: 'ScheduleList', 
    component: ScheduleList,
    meta: { requiresAuth: true }
  },
  { 
    path: '/schedule/:id', 
    name: 'ScheduleDetail', 
    component: ScheduleDetail,
    meta: { requiresAuth: true }
  },
  { 
    path: '/schedule/:id/edit', 
    name: 'EditSchedule', 
    component: EditSchedule,
    meta: { requiresAuth: true }
  },
  { 
    path: '/meta', 
    name: 'SchedulesMeta', 
    component: SchedulesMeta,
    meta: { requiresAuth: true }
  }
]

// 직원 관련 라우트
const workerRoutes = [
  {
    path: '/worker-schedules',
    name: 'WorkerSchedules',
    component: WorkerSchedules,
    meta: { requiresAuth: true }
  },
  { 
    path: '/payroll', 
    name: 'WorkerPayroll', 
    component: WorkerPayroll,
    meta: { requiresAuth: true }
  }
]

// 문서 관련 라우트
const documentRoutes = [
  { 
    path: '/estimate', 
    name: 'EstimateForm', 
    component: EstimateForm,
    meta: { requiresAuth: true }
  },
  { 
    path: '/statement', 
    name: 'StatementForm', 
    component: StatementForm,
    meta: { requiresAuth: true }
  }
]

const routes = [
  { 
    path: '/', 
    name: 'Home', 
    component: Home, 
    meta: { requiresAuth: true } 
  },
  ...authRoutes,
  ...scheduleRoutes,
  ...workerRoutes,
  ...documentRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 개선된 인증 가드
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // store가 비어 있으면 localStorage 값으로 한 번만 복원
  if (!userStore.userId) {
    const storedId = localStorage.getItem('user_id')
    const storedName = localStorage.getItem('user_name')
    const storedRole = localStorage.getItem('user_role')
    
    if (storedId) {
      userStore.setUser({
        id: storedId,
        name: storedName,
        role: storedRole,
      })
    }
  }
  
  const isLoggedIn = !!userStore.userId
  const requiresAuth = to.meta.requiresAuth !== false // 기본값 true
  
  // 비로그인 상태에서 보호된 페이지 접근 시 → 로그인 페이지로
  if (!isLoggedIn && requiresAuth) {
    return next('/login')
  }
  
  // 로그인 상태인데 /login 접근 시 → 홈으로 리디렉션
  if (isLoggedIn && to.path === '/login') {
    return next('/')
  }
  
  return next()
})

export default router