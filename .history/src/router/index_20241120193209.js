import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Exercise from '../views/Exercise.vue'

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

router.beforeEach((to, from, next) => {
  // 检查一些条件
  if (某些条件) {
    next() // 允许导航
  } else {
    // 可能在这里阻止了导航
    // 或者重定向到其他页面
    next(false) // 或 next('/login') 等
  }
})

export default router 