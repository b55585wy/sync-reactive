import { createRouter, createWebHistory } from 'vue-router';
import { useDeviceStore } from '../stores/deviceStore';

const routes = [
  {
    // 主页
    path: '/',
    component: () => import('@/views/Home.vue'),
  },
  {
    // 准备页面
    path: '/prepare',
    component: () => import('@/views/prepare/PreparationView.vue'),
    children: [
      {
        path: 'devices',
        component: () => import('@/components/breathing/DeviceConnection.vue'),
      }
    ]
  },
  {
    // 训练相关路由
    path: '/training',
    component: () => import('@/views/training/TrainingView.vue'),
    // 需要设备连接的路由守卫
    beforeEnter: (to, from, next) => {
      const deviceStore = useDeviceStore();
      if (!deviceStore.hasAnyDeviceConnected) {
        next('/prepare/devices');
      } else {
        next();
      }
    },
    children: [
      {
        path: 'guided-breathing',
        component: () => import('@/components/training/GuidedBreathing.vue'),
      },
      {
        path: 'heart-rate',
        component: () => import('@/components/training/HeartMonitor.vue'),
      },
      // ... 其他训练模式路由
      
    ]
  },
  {
    // 设置页面
    path: '/settings',
    component: () => import('@/views/Settings.vue'),
    // 还需要配置参数比如设置界面返回的用户信息
  },
  {
    path: '/training',
    component: () => import('@/views/training/TrainingView.vue'),
    children: [
      {
        path: 'prepare',
        name: 'TrainingPrepare',
        component: () => import('@/views/training/PrepareView.vue'),
      },
      {
        path: 'session',
        name: 'TrainingSession',
        component: () => import('@/views/training/SessionView.vue'),
        props: route => ({
          mode: route.query.mode,
          duration: Number(route.query.duration) || 3
        })
      }
    ]
  }
];

export default createRouter({
  history: createWebHistory(),
  routes
}); 