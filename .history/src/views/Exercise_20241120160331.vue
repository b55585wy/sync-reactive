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

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { TrainingService } from '@/services/training'
import BreathingAnimation from '@/components/breathing/BreathingAnimation.vue'

const training = new TrainingService()

// 状态
const isPreparationComplete = ref(false)
const showEndConfirm = ref(false)

// 开始训练
async function startTraining() {
  try {
    await training.startTraining()
    isPreparationComplete.value = true
  } catch (error) {
    // 显示错误提示
    console.error('训练启动失败:', error)
  }
}

// 暂停训练
function pauseTraining() {
  training.pauseTraining()
}

// 继续训练
function resumeTraining() {
  training.resumeTraining()
}

// 结束训练
async function endTraining() {
  showEndConfirm.value = true
}

// 确认结束训练
async function confirmEndTraining() {
  await training.stopTraining()
  // 导航到总结页面
  router.push('/summary')
}

// 生命周期钩子
onMounted(() => {
  // 初始化
})

onBeforeUnmount(() => {
  // 清理
  training.stopTraining()
})
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