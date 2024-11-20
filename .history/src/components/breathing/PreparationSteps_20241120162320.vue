<template>
  <div class="preparation-steps">
    <div class="timer-circle">
      <span class="status">准备</span>
      <span class="time">{{ formatTime(time) }}</span>
    </div>

    <div class="steps-container">
      <div v-for="(step, index) in steps" 
           :key="index"
           :class="['step-item', { 'completed': completedSteps[index] }]"
           @click="toggleStep(index)">
        <div class="step-number">{{ index + 1 }}</div>
        <div class="step-content">
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </div>
        <div class="step-check" v-if="completedSteps[index]">✓</div>
      </div>
    </div>

    <!-- 添加清晰的操作按钮 -->
    <div class="action-buttons">
      <button 
        class="start-btn"
        :disabled="!allStepsCompleted"
        @click="startTraining"
      >
        开始训练
      </button>
      <button 
        class="retry-btn"
        v-if="deviceConnectionFailed"
        @click="retryConnection"
      >
        重新连接设备
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PreparationSteps',
  
  data() {
    return {
      steps: [
        {
          title: '调整姿势',
          description: '找一个安静的地方，采用舒适的坐姿或躺姿'
        },
        {
          title: '佩戴设备',
          description: '将呼吸带轻轻系在腹部，确保不会滑动'
        },
        {
          title: '设备检查',
          description: '等待设备连接并校准完成'
        }
      ],
      completedSteps: [false, false, false],
      status: '准备',
      time: 0,
      deviceConnectionFailed: false
    };
  },

  computed: {
    allStepsCompleted(): boolean {
      return this.completedSteps.every(step => step);
    }
  },

  methods: {
    async checkStepCompletion() {
      // 检查第一步 - 可以通过传感器检测姿势是否稳定
      this.completedSteps[0] = true; // 暂时自动通过

      // 检查第二步 - 检测设备是否正确佩戴
      try {
        const deviceStatus = await this.checkDeviceWearing();
        this.completedSteps[1] = deviceStatus.properly_worn;
      } catch (error) {
        console.error('设备佩戴检查失败:', error);
        this.deviceConnectionFailed = true;
      }

      // 检查第三步 - 设备连接状态
      try {
        const connectionStatus = await this.checkDeviceConnection();
        this.completedSteps[2] = connectionStatus.connected;
      } catch (error) {
        console.error('设备连接检查失败:', error);
        this.deviceConnectionFailed = true;
      }
    },

    async startTraining() {
      if (this.allStepsCompleted) {
        this.$emit('preparation-complete');
      } else {
        uni.showToast({
          title: '请完成所有准备步骤',
          icon: 'none'
        });
      }
    },

    async retryConnection() {
      this.deviceConnectionFailed = false;
      await this.checkStepCompletion();
    },

    formatTime(seconds: number): string {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  },

  mounted() {
    this.checkStepCompletion();
  }
});
</script>

<style scoped>
.preparation-steps {
  padding: 20px;
}

.timer-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background-color: #4a90e2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 auto 30px;
  color: white;
}

.step-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 10px;
}

.step-item.completed {
  background-color: #e8f5e9;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.start-btn {
  padding: 12px 24px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
}

.start-btn:disabled {
  background-color: #ccc;
}
</style> 