import { Router } from 'vue-router';
import { useDeviceStore } from '@/stores/device';

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const deviceStore = useDeviceStore();

    // 检查路由是否需要设备连接
    if (to.meta.requiresDevice && !deviceStore.isConnected) {
      try {
        // 尝试连接设备
        await deviceStore.connectDevice();
        next();
      } catch (error) {
        console.error('Device connection required:', error);
        uni.showToast({
          title: '请先连接设备',
          icon: 'none'
        });
        next('/');  // 返回首页
      }
    } else {
      next();
    }
  });
} 