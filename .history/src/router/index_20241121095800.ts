import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/prepare',
    component: () => import('@/views/breathing/PreparationView.vue'),
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
        path: 'heart-monitor',
        component: () => import('@/components/training/HeartMonitor.vue'),
      },
      // ... 其他训练模式路由
      
    ]
  }
];

export default createRouter({
  history: createWebHistory(),
  routes
}); 