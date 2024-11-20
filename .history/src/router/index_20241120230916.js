import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Settings from '@/views/Settings.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/breathing/prepare',
    name: 'BreathingPrepare',
    component: () => import('@/views/breathing/Prepare.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 