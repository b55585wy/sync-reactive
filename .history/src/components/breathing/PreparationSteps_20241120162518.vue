<template>
  <div class="preparation-steps">
    <div class="timer-circle">
      <span class="status">准备</span>
      <span class="time">{{ formatTime(time) }}</span>
    </div>

    <div class="steps-container">
      <div v-for="(step, index) in steps" 
           :key="index"
           :class="['step-item', { 'completed': completedSteps[index] }]">
        <div class="step-number">{{ index + 1 }}</div>
        <div class="step-content">
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </div>
        <div class="step-checkbox" @click="toggleStep(index)">
          <checkbox :checked="completedSteps[index]" :disabled="index === 2 && !deviceConnected" />
        </div>
      </div>
    </div>

    <div class="device-status" v-if="isCheckingDevice">
      正在检查设备连接状态...
    </div>

    <button 
      class="next-btn"
      :disabled="!canProceed"
      @click="proceedToNext"
    >
      {{ buttonText }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'PreparationSteps',
  
  setup() {
    const router = useRouter();
    const completedSteps = ref([false, false, false]);
    
    const steps = [
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
    ];

    const allStepsCompleted = computed(() => {
      return completedSteps.value.every(step => step);
    });

    const toggleStep = (index: number) => {
      completedSteps.value[index] = !completedSteps.value[index];
    };

    const handleConfirm = async () => {
      if (allStepsCompleted.value) {
        try {
          await router.push({
            name: 'BreathingExercise',
            query: {
              mode: 'smart',
              duration: 3
            }
          });
        } catch (error) {
          console.error('Navigation failed:', error);
          uni.showToast({
            title: '跳转失败，请重试',
            icon: 'none'
          });
        }
      } else {
        uni.showToast({
          title: '请完成所有准备步骤',
          icon: 'none'
        });
      }
    };

    return {
      steps,
      completedSteps,
      allStepsCompleted,
      toggleStep,
      handleConfirm
    };
  }
});
</script>

<style scoped>
.preparation-steps {
  padding: 20px;
}

.step-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.step-item:hover {
  background-color: #e9ecef;
}

.step-item.completed {
  background-color: #e8f5e9;
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #4a90e2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.step-content {
  flex: 1;
}

.step-checkbox {
  margin-left: 15px;
}

.action-buttons {
  margin-top: 30px;
  padding: 0 20px;
}

.confirm-btn {
  width: 100%;
  height: 44px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 22px;
  font-size: 16px;
}

.confirm-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.timer-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background-color: #4a90e2;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
}

.status {
  font-size: 20px;
  margin-bottom: 5px;
}

.time {
  font-size: 36px;
  font-weight: bold;
}
</style> 