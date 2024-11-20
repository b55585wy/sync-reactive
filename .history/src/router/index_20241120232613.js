import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Exercise from '../views/Exercise.vue'
import Settings from '@/views/Settings.vue'

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
  },
  {
    path: '/breathing/PreparationView',
    name: 'BreathingPrepare',
    component: () => import('@/views/breathing/Prepare.vue')
  }

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  // 获取 token 或其他验证信息
  const token = localStorage.getItem('token')
  
  // 定义需要登录才能访问的路由
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !token) {
    // 需要登录但没有 token，重定向到登录页
    next('/login')
  } else {
    // 其他情况正常放行
    next()
  }
})

export default router 