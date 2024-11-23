<!-- 呼吸带佩戴说明提示，调用component（prepareation）组件 -->
<template>
  <div class="preparation-view">
    <PreparationSteps 
      :mode="mode"
      :duration="duration"
      @complete="onPreparationComplete"
    />
    <!-- 添加呼吸带必需提示 -->
    <div class="device-requirement-hint">
      <p v-if="mode === 'breathing' || mode === 'combined'">腹式呼吸必须</p>
    </div>
    <!-- 修改底部按钮组 -->
    <div class="action-buttons">
      <el-button-group>
        <el-button 
          type="primary" 
          size="large"
          :loading="isStarting"
          @click="startTraining"
        >
          <el-icon><VideoPlay /></el-icon>
          开始训练
        </el-button>
        
        <el-button 
          type="default" 
          size="large"
          @click="cancelTraining"
        >
          <el-icon><Close /></el-icon>
          取消
        </el-button>
      </el-button-group>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PreparationSteps from '@/components/breathing/PreparationSteps.vue';
import { useDeviceStore } from '@/stores/device';
import { ElMessage, ElMessageBox } from 'element-plus';
import { VideoPlay, Close } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'PreparationView',
  
  components: {
    PreparationSteps
  },

  setup() {
    const route = useRoute();
    const router = useRouter();
    const deviceStore = useDeviceStore();
    const isStarting = ref(false);

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

    // 开始训练
    const startTraining = async () => {
      try {
        isStarting.value = true;
        await onPreparationComplete();
      } catch (error) {
        console.error('开始训练失败:', error);
        ElMessage.error('开始训练失败: ' + error);
      } finally {
        isStarting.value = false;
      }
    };

    // 取消训练
    const cancelTraining = async () => {
      try {
        await ElMessageBox.confirm(
          '确定要取消训练吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '继续训练',
            type: 'warning'
          }
        );
        
        // 返回首页
        router.replace('/');
      } catch {
        // 用户选择继续训练
      }
    };

    return {
      mode,
      duration,
      onPreparationComplete,
      isStarting,
      startTraining,
      cancelTraining
    };
  }
});
</script> 

<style scoped>
.device-requirement-hint {
  text-align: center;
  margin-top: 10px;
  color: #666;
}

.action-buttons {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 12px;

  .el-button {
    min-width: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    
    .el-icon {
      margin-right: 4px;
    }
  }
}
</style> 