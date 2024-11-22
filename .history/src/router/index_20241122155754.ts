import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/training',
      component: () => import('@/views/training/TrainingLayout.vue'),
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
  ]
});

export default router; 