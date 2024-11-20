<template>
  <div class="exercise-container" :class="currentPhase">
    <!-- 顶部进度条 -->
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      <div class="time-display">{{ formatTime(remainingTime) }}</div>
    </div>

    <!-- 主要内容区 -->
    <div class="exercise-content">
      <!-- 训练阶段提示 -->
      <div class="phase-indicator">
        <span class="phase-text">{{ phaseText }}</span>
        <span class="phase-tip">{{ phaseTip }}</span>
      </div>

      <!-- 呼吸动画 -->
      <breathing-animation 
        :show-stats="isTraining" 
        :current-value="currentValue"
      />

      <!-- 实时数据显示 -->
      <div class="stats-panel" v-if="isTraining">
        <div class="stat-item">
          <span class="label">本次训练时长</span>
          <span class="value">{{ formatTime(elapsedTime) }}</span>
        </div>
        <div class="stat-item">
          <span class="label">完成周期</span>
          <span class="value">{{ completedCycles }}/{{ totalCycles }}</span>
        </div>
      </div>
    </div>

    <!-- 底部控制区 -->
    <div class="control-panel">
      <template v-if="currentPhase === 'prepare'">
        <div class="preparation-guide">
          <div class="guide-item" v-for="(item, index) in preparationSteps" 
               :key="index"
               :class="{ active: currentStep === index }">
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-content">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </div>
        </div>
        <button class="primary-btn" @click="startTraining" 
                :disabled="!isDeviceReady">
          {{ isDeviceReady ? '开始训练' : '正在连接设备...' }}
        </button>
      </template>

      <template v-else-if="isTraining">
        <button class="control-btn" @click="togglePause">
          {{ isPaused ? '继续' : '暂停' }}
        </button>
        <button class="control-btn danger" @click="showEndConfirm">
          结束训练
        </button>
      </template>

      <template v-else-if="currentPhase === 'complete'">
        <div class="completion-summary">
          <h2>训练完成！</h2>
          <div class="summary-stats">
            <div class="summary-item">
              <span class="label">训练时长</span>
              <span class="value">{{ formatTime(totalTime) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">平均吸气强度</span>
              <span class="value">{{ avgInhaleStrength }}%</span>
            </div>
            <div class="summary-item">
              <span class="label">平均呼气强度</span>
              <span class="value">{{ avgExhaleStrength }}%</span>
            </div>
          </div>
        </div>
        <div class="action-buttons">
          <button class="secondary-btn" @click="goHome">返回首页</button>
          <button class="primary-btn" @click="shareResults">分享成果</button>
        </div>
      </template>
    </div>

    <!-- 确认弹窗 -->
    <modal-dialog v-model="showEndModal">
      <div class="end-confirm">
        <h3>确认结束训练？</h3>
        <p>当前训练进度将会保存</p>
        <div class="modal-buttons">
          <button class="secondary-btn" @click="showEndModal = false">
            继续训练
          </button>
          <button class="danger-btn" @click="endTraining">
            结束训练
          </button>
        </div>
      </div>
    </modal-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useBreathingStore } from '@/stores/breathing'
import BreathingAnimation from '@/components/breathing/BreathingAnimation.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'

export default {
  name: 'Exercise',
  components: {
    BreathingAnimation,
    ModalDialog
  },
  setup() {
    const router = useRouter()
    const store = useBreathingStore()
    
    // 状态管理
    const currentPhase = ref('prepare')
    const isTraining = ref(false)
    const isPaused = ref(false)
    const elapsedTime = ref(0)
    const totalTime = ref(0)
    const avgInhaleStrength = ref(0)
    const avgExhaleStrength = ref(0)
    const completedCycles = ref(0)
    const totalCycles = ref(0)
    const currentValue = ref(0)
    const remainingTime = ref(0)
    const progress = ref(0)
    const currentStep = ref(0)
    const preparationSteps = ref([
      { title: '准备', description: '深呼吸，放松身体' },
      { title: '训练', description: '按照4-7-8呼吸法进行训练' },
      { title: '结束', description: '慢慢呼气，放松身体' }
    ])
    const isDeviceReady = ref(true)
    const showEndModal = ref(false)

    // 计算属性
    const phaseText = computed(() => {
      switch (currentPhase.value) {
        case 'prepare':
          return '准备阶段'
        case 'training':
          return '训练阶段'
        case 'complete':
          return '结束阶段'
        default:
          return ''
      }
    })

    const phaseTip = computed(() => {
      switch (currentPhase.value) {
        case 'prepare':
          return '深呼吸，放松身体'
        case 'training':
          return '按照4-7-8呼吸法进行训练'
        case 'complete':
          return '慢慢呼气，放松身体'
        default:
          return ''
      }
    })

    const startTraining = () => {
      isTraining.value = true
      currentPhase.value = 'training'
      store.startSession()
      startExercise()
    }

    const togglePause = () => {
      isPaused.value = !isPaused.value
      if (isPaused.value) {
        store.pauseSession()
        pauseExercise()
      } else {
        store.resumeSession()
        resumeExercise()
      }
    }

    const showEndConfirm = () => {
      showEndModal.value = true
    }

    const endTraining = () => {
      showEndModal.value = false
      store.endSession()
      pauseExercise()
      router.push('/')
    }

    const startExercise = () => {
      // 实现呼吸循环逻辑
      let phaseIndex = 0
      const phases = ['inhale', 'hold', 'exhale']
      const durations = [4, 7, 8] // 4-7-8呼吸法的时间设置

      let exerciseTimer = setInterval(() => {
        phaseIndex = (phaseIndex + 1) % 3
        currentPhase.value = phases[phaseIndex]
        store.setPhase(currentPhase.value)
      }, durations[phaseIndex] * 1000)
    }

    const pauseExercise = () => {
      if (exerciseTimer) {
        clearInterval(exerciseTimer)
        exerciseTimer = null
      }
    }

    const resumeExercise = () => {
      // 实现呼吸循环逻辑
      let phaseIndex = 0
      const phases = ['inhale', 'hold', 'exhale']
      const durations = [4, 7, 8] // 4-7-8呼吸法的时间设置

      let exerciseTimer = setInterval(() => {
        phaseIndex = (phaseIndex + 1) % 3
        currentPhase.value = phases[phaseIndex]
        store.setPhase(currentPhase.value)
      }, durations[phaseIndex] * 1000)
    }

    const handleClose = () => {
      pauseExercise()
      router.push('/')
    }

    onMounted(() => {
      // 初始化设置
      const settings = store.settings
      remainingTime.value = settings.inhaleTime
    })

    onBeforeUnmount(() => {
      pauseExercise()
    })

    return {
      currentPhase,
      isTraining,
      isPaused,
      elapsedTime,
      totalTime,
      avgInhaleStrength,
      avgExhaleStrength,
      completedCycles,
      totalCycles,
      currentValue,
      remainingTime,
      progress,
      currentStep,
      preparationSteps,
      isDeviceReady,
      showEndModal,
      phaseText,
      phaseTip,
      startTraining,
      togglePause,
      showEndConfirm,
      endTraining,
      handleClose
    }
  }
}
</script>

<style scoped>
.exercise-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  color: white;
}

.progress-bar {
  height: 1rem;
  background: #333;
  border-radius: 0.5rem;
  overflow: hidden;
  margin: 1rem;
}

.progress-fill {
  height: 100%;
  background: #4a90e2;
  transition: width 0.3s ease;
}

.time-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
}

.exercise-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.phase-indicator {
  text-align: center;
  margin-bottom: 2rem;
}

.phase-text {
  font-size: 1.5rem;
  font-weight: bold;
}

.phase-tip {
  font-size: 1.2rem;
  color: #999;
}

.control-panel {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.primary-btn {
  padding: 1rem 3rem;
  border-radius: 2rem;
  border: none;
  background: #4a90e2;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-btn:hover {
  background: #357abd;
}

.control-btn {
  padding: 1rem 3rem;
  border-radius: 2rem;
  border: none;
  background: #4a90e2;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover {
  background: #357abd;
}

.control-btn.danger {
  background: #e74c3c;
}

.end-confirm {
  padding: 2rem;
  background: #333;
  border-radius: 0.5rem;
  text-align: center;
}

.modal-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}

.secondary-btn {
  background: #999;
}

.secondary-btn:hover {
  background: #777;
}

.danger-btn {
  background: #e74c3c;
}

.danger-btn:hover {
  background: #c0392b;
}
</style> 
</style> 