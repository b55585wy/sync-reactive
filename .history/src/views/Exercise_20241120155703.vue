<template>
  <div class="exercise-container">
    <!-- 顶部导航栏 -->
    <div class="nav-header">
      <div class="back-btn" @click="handleBack">
        <i class="icon-back">←</i>
      </div>
      <div class="title">呼吸训练</div>
      <div class="placeholder"></div>
    </div>

    <!-- 呼吸动画区域 -->
    <div class="breathing-section">
      <breathing-animation 
        :phase="currentPhase"
        :is-active="isActive"
        :current-time="currentTime"
      />
    </div>

    <!-- 准备步骤区域 -->
    <div class="preparation-steps" v-if="!isTrainingStarted">
      <div class="steps-title">准备开始</div>
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
          <i v-if="currentStepIndex > index" class="icon-check">✓</i>
        </div>
      </div>
    </div>

    <!-- 训练控制区域 -->
    <div class="control-section">
      <template v-if="!isTrainingStarted">
        <button 
          class="primary-btn start-btn"
          :disabled="!canStart"
          @click="startTraining"
        >
          开始训练
        </button>
      </template>
      
      <template v-else>
        <div class="training-controls">
          <button 
            class="control-btn"
            @click="isActive ? pauseTraining() : resumeTraining()"
          >
            {{ isActive ? '暂停' : '继续' }}
          </button>
          <button 
            class="control-btn end-btn"
            @click="endTraining"
          >
            结束训练
          </button>
        </div>
      </template>
    </div>

    <!-- 结束确认弹窗 -->
    <modal-dialog v-model="showEndConfirm">
      <div class="end-confirm-content">
        <h3>确认结束训练？</h3>
        <p>当前训练进度将会保存</p>
        <div class="confirm-buttons">
          <button 
            class="secondary-btn"
            @click="showEndConfirm = false"
          >
            取消
          </button>
          <button 
            class="primary-btn"
            @click="confirmEndTraining"
          >
            确认
          </button>
        </div>
      </div>
    </modal-dialog>
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: white;
}

.back-btn {
  padding: 8px;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.breathing-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.preparation-steps {
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  margin: 0 16px;
}

.steps-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 16px;
}

.step-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-section {
  padding: 20px;
}

.primary-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 8px;
  background-color: #4a90e2;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.primary-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.training-controls {
  display: flex;
  gap: 12px;
}

.control-btn {
  flex: 1;
  padding: 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.end-btn {
  background-color: #ff4444;
  color: white;
}

.end-confirm-content {
  padding: 20px;
  text-align: center;
}

.confirm-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.secondary-btn {
  flex: 1;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
}
</style> 