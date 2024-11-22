<!--  -->
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
      // 检查设备连接状态
      if (!deviceStore.isConnected) {
        alert('请先连接呼吸带设备');
        router.replace('/');  // 返回首页
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