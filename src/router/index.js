import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/components/LoginView.vue'
import Home from '@/pages/Home.vue'
import ScheduleAdd from '@/pages/ScheduleAdd.vue'
import ScheduleList from '@/pages/ScheduleList.vue'
import ScheduleDetail from '@/pages/ScheduleDetail.vue'
import SchedulesMeta from '@/pages/SchedulesMeta.vue'
import WorkerSchedules from '@/pages/WorkerSchedules.vue'
import WorkerPayroll from '@/pages/WorkerPayroll.vue'



const routes = [
  { path: '/', component: Home },
  { path: '/login', component: LoginView },
  { path: '/add', component: ScheduleAdd },
  { path: '/schedules', component: ScheduleList },
  { path: '/schedule/:id', component: ScheduleDetail },
  {
    path: '/schedule/:id/edit',
    name: 'EditSchedule',
    component: () => import('@/pages/EditSchedule.vue')
  },
  { path: '/meta', component: SchedulesMeta },
  { path: '/worker-schedules', component: WorkerSchedules },
  { path: '/payroll', component: WorkerPayroll },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('user_id')
  if (!isLoggedIn && to.path !== '/login') {
    next('/login')
  } else {
    next()
  }
})

export default router