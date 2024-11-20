<template>
  <div class="main-card">
    <button class="start-button" @click="startBreathing">开始锻炼</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useDeviceStore } from '@/stores/device';

export default defineComponent({
  setup() {
    const router = useRouter();
    const deviceStore = useDeviceStore();

    const startBreathing = async () => {
      try {
        // 检查设备连接状态
        if (!deviceStore.isConnected) {
          await deviceStore.connectDevice();
        }
        
        // 跳转到准备页面
        await router.push({
          name: 'BreathingPreparation',
          query: {
            mode: deviceStore.selectedMode,
            duration: deviceStore.trainingDuration
          }
        });
      } catch (error) {
        console.error('Failed to start breathing session:', error);
        // 显示错误提示
        uni.showToast({
          title: '请先连接呼吸带设备',
          icon: 'none'
        });
      }
    };

    return {
      startBreathing
    };
  }
});
</script> 