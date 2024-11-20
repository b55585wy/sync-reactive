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
  },
  {
    path: '/breathing/exercise',
    name: 'BreathingExercise',
    component: () => import('@/views/breathing/ExerciseView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 