import { createRouter, createWebHistory } from 'vue-router';
import { useDeviceStore } from '@/stores/device';
import { useTrainingStore } from '@/stores/training';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 主页
    {
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
      beforeEnter: (to, from, next) => {
        const trainingStore = useTrainingStore();
        const deviceStore = useDeviceStore();
        
        if (!deviceStore.hasAnyDeviceConnected) {
          next('/prepare/devices');
        } else if (!trainingStore.isTraining && from.name !== 'TrainingSummary' && from.path !== '/prepare') {
          next('/');
        } else {
          next();
        }
      },
      children: [
        {
          path: 'session/:mode',
          name: 'TrainingSession',
          component: () => import('@/views/training/SessionView.vue'),
          props: route => ({
            mode: route.params.mode,
            duration: Number(route.query.duration) || 3
          })
        },
        {
          path: 'summary',
          name: 'TrainingSummary',
          component: () => import('@/views/training/SummaryView.vue')
        }
      ]
    },
    {
      // 设置页面
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/SettingsView.vue'),
    }
  ]
});

// 全局导航守卫
router.beforeEach((to, from, next) => {
  const trainingStore = useTrainingStore();
  
  if (from.path.startsWith('/training') && 
      !to.path.startsWith('/training') && 
      to.name !== 'TrainingSummary') {
    trainingStore.endTraining();
  }
  
  next();
});

export default router; 