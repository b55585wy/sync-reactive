import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '@/views/Home.vue'
import Exercise from '@/views/Exercise.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/exercise',
    name: 'Exercise',
    component: Exercise
  },
  {
    path: '/breathing/prepare',
    name: 'BreathingPreparation',
    component: () => import('@/views/breathing/PreparationView.vue'),
    meta: {
      requiresDevice: true  // 需要设备连接
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 