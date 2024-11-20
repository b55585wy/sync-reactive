<template>
  <div class="exercise-container">
    <div class="exercise-header">
      <h1>{{ pageTitle }}</h1>
    </div>

    <!-- 呼吸动画 -->
    <breathing-animation 
      :phase="currentPhase"
      :is-active="isActive"
      :current-time="currentTime"
    />

    <!-- 准备步骤 -->
    <div class="preparation-steps">
      <div 
        v-for="(step, index) in preparationSteps" 
        :key="index"
        class="step-item"
        :class="{ 
          'completed': currentStepIndex > index,
          'active': currentStepIndex === index 
        }"
        @click="handleStepClick(index)"
      >
        <div class="step-number">{{ index + 1 }}</div>
        <div class="step-content">
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </div>
        <div class="step-status">
          <i v-if="currentStepIndex > index" class="icon-check"></i>
        </div>
      </div>
    </div>

    <!-- 开始按钮 -->
    <div class="action-buttons">
      <button 
        class="start-button"
        :disabled="!canStart"
        @click="startTraining"
      >
        {{ startButtonText }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BreathingAnimation from '@/components/breathing/BreathingAnimation.vue'
import { useBreathingStore } from '@/stores/breathing'

export default {
  name: 'Exercise',
  
  components: {
    BreathingAnimation
  },

  setup() {
    const router = useRouter()
    const store = useBreathingStore()
    const currentStepIndex = ref(0)
    const isActive = ref(false)
    const currentTime = ref(0)
    const deviceConnected = ref(false)

    const preparationSteps = [
      {
        title: '调整姿势',
        description: '找一个安静的地方，采用舒适的坐姿或躺姿',
        action: () => { /* 姿势调整逻辑 */ }
      },
      {
        title: '佩戴设备',
        description: '将呼吸带轻轻系在腹部，确保不会滑动',
        action: async () => {
          // 尝试连接设备
          try {
            await store.connectDevice()
            deviceConnected.value = true
          } catch (error) {
            console.error('设备连接失败:', error)
          }
        }
      },
      {
        title: '设备检查',
        description: '等待设备连接并校准完成',
        action: async () => {
          // 设备校准逻辑
          await store.calibrateDevice()
        }
      }
    ]

    const handleStepClick = async (index) => {
      if (index <= currentStepIndex.value + 1) {
        currentStepIndex.value = index
        await preparationSteps[index].action()
      }
    }

    const startTraining = () => {
      if (canStart.value) {
        store.startSession()
        router.push('/training')
      }
    }

    const pageTitle = computed(() => '准备开始')
    const currentPhase = computed(() => 'prepare')
    const canStart = computed(() => 
      currentStepIndex.value === preparationSteps.length - 1 && 
      deviceConnected.value
    )
    const startButtonText = computed(() => 
      canStart.value ? '开始训练' : '请完成准备步骤'
    )

    return {
      currentStepIndex,
      preparationSteps,
      isActive,
      currentTime,
      currentPhase,
      pageTitle,
      canStart,
      startButtonText,
      handleStepClick,
      startTraining
    }
  }
}
</script>

<style scoped>
.exercise-container {
  padding: 20px;
  height: 100vh;
}

.exercise-header {
  text-align: center;
  margin-bottom: 20px;
}

.exercise-header h1 {
  font-size: 24px;
  color: #333;
}

.preparation-steps {
  margin-top: 20px;
}

.step-item {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: #f9f9f9;
  transition: all 0.3s ease;
}

.step-item.completed {
  background: #e6f3ff;
  border: 1px solid #4a90e2;
}

.step-item.active {
  background: #e6f3ff;
  border: 1px solid #4a90e2;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #4a90e2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.step-content h3 {
  font-size: 16px;
  margin-bottom: 4px;
}

.step-content p {
  font-size: 14px;
  color: #666;
}

.step-status {
  margin-left: 16px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.start-button {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-button:disabled {
  background: #f5f5f5;
  color: #666;
}
</style> 