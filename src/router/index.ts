import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Exercise from '@/views/Exercise.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/exercise',
    name: 'Exercise',
    component: Exercise
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 