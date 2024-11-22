import { createRouter, createWebHistory } from 'vue-router';
import { useDeviceStore } from '../stores/deviceStore';
import { useTrainingStore } from '../stores/trainingStore';
import { BluetoothService } from '../services/BluetoothService';

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
        path: 'prepare',
        name: 'TrainingPrepare',
        component: () => import('@/views/training/PrepareView.vue'),
      },
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
];

export default createRouter({
  history: createWebHistory(),
  routes
}); 