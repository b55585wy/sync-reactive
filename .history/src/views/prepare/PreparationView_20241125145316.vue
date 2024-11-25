<!-- 呼吸带佩戴说明提示，调用component（prepareation）组件 -->
<template>
  <div class="preparation-view">
    <PreparationSteps 
      :mode="mode"
      :duration="duration"
      @complete="onPreparationComplete"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PreparationSteps from '@/components/breathing/PreparationSteps.vue';
import { useDeviceStore } from '@/stores/device';
import { useSettingsStore } from '@/stores/settings'

export default defineComponent({
  name: 'PreparationView',
  
  components: {
    PreparationSteps
  },

  setup() {
    const route = useRoute();
    const router = useRouter();
    const deviceStore = useDeviceStore();

    const mode = ref(route.query.mode as string);
    const duration = ref(Number(route.query.duration) || 3);

    onMounted(() => {
      // 添加日志来调试设备连接状态
      console.log('设备连接状态:', {
        心率带: deviceStore.isHeartRateBandConnected,
        呼吸带: deviceStore.isBreathingBandConnected
      });

      // 检查是否至少连接了一个设备
      if (!deviceStore.isBreathingBandConnected && !deviceStore.isHeartRateBandConnected) {
        alert('请至少连接一个设备（呼吸带或心率带）');
        router.replace('/');
        return;
      }

      // 确保 mode 被正确设置
      if (deviceStore.isHeartRateBandConnected) {
        mode.value = 'heartRate';
        console.log('设置心率模式');
      }
      if (deviceStore.isBreathingBandConnected) {
        mode.value = 'breathing';
        console.log('设置呼吸模式');
      }
      if (deviceStore.isBreathingBandConnected && deviceStore.isHeartRateBandConnected) {
        mode.value = 'combined';
        console.log('设置组合模式');
      }
    });

    const onPreparationComplete = async () => {
      try {
        await router.push({
          name: 'BreathingExercise',
          query: {
            mode,
            duration
          }
        });
      } catch (error) {
        console.error('Failed to start exercise:', error);
        alert('启动训练失败，请重试');
      }
    };

    return {
      mode,
      duration,
      onPreparationComplete
    };
  }
});
</script> 