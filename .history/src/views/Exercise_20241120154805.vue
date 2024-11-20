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
    const currentStep = ref(0)
    const isPaused = ref(false)
    const showEndModal = ref(false)
    const isDeviceReady = ref(false)
    
    // 训练数据
    const elapsedTime = ref(0)
    const currentValue = ref(0)
    const completedCycles = ref(0)
    
    // 准备步骤
    const preparationSteps = [
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
    ]

    // 计算属性
    const progress = computed(() => {
      if (!store.currentSession.totalTime) return 0
      return (elapsedTime.value / store.currentSession.totalTime) * 100
    })

    const phaseText = computed(() => {
      const textMap = {
        prepare: '准备开始',
        inhale: '吸气',
        hold: '屏息',
        exhale: '呼气',
        rest: '休息',
        complete: '训练完成'
      }
      return textMap[currentPhase.value] || ''
    })

    const phaseTip = computed(() => {
      const tipMap = {
        inhale: '缓慢吸气，感受腹部扩张',
        hold: '保持呼吸，保持放松',
        exhale: '缓慢呼气，收紧腹部',
        rest: '放松准备下一次呼吸'
      }
      return tipMap[currentPhase.value] || ''
    })

    // 方法
    const startTraining = () => {
      currentPhase.value = 'inhale'
      store.startSession(store.settings.selectedMode, store.settings.duration)
      startTimer()
    }

    const togglePause = () => {
      isPaused.value = !isPaused.value
      if (isPaused.value) {
        stopTimer()
      } else {
        startTimer()
      }
    }

    const endTraining = () => {
      stopTimer()
      store.completeSession()
      currentPhase.value = 'complete'
      showEndModal.value = false
    }

    let timer = null
    const startTimer = () => {
      timer = setInterval(() => {
        elapsedTime.value++
        updatePhase()
      }, 1000)
    }

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const updatePhase = () => {
      const { phase, mode } = store.currentSession
      const settings = mode === 'guided' ? 
        store.settings.guidedMode : store.settings.customMode
      
      const phaseTime = settings[`${phase}Time`]
      const phaseElapsed = elapsedTime.value % 
        (settings.inhaleTime + settings.holdTime + settings.exhaleTime + settings.restTime)

      if (phaseElapsed >= phaseTime) {
        // 切换到下一个阶段
        const phases = ['inhale', 'hold', 'exhale', 'rest']
        const currentIndex = phases.indexOf(phase)
        const nextPhase = phases[(currentIndex + 1) % phases.length]
        
        if (nextPhase === 'inhale') {
          completedCycles.value++
        }
        
        store.updatePhase(nextPhase)
      }
    }

    // 生命周期钩子
    onMounted(() => {
      // 检查设备连接状态
      checkDeviceConnection()
    })

    onBeforeUnmount(() => {
      stopTimer()
    })

    const checkDeviceConnection = async () => {
      try {
        // 这里添加实际的设备连接检查逻辑
        await new Promise(resolve => setTimeout(resolve, 2000))
        isDeviceReady.value = true
      } catch (error) {
        console.error('Device connection failed:', error)
      }
    }

    return {
      currentPhase,
      currentStep,
      isPaused,
      showEndModal,
      isDeviceReady,
      elapsedTime,
      currentValue,
      completedCycles,
      preparationSteps,
      progress,
      phaseText,
      phaseTip,
      startTraining,
      togglePause,
      endTraining,
      formatTime: (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
      }
    }
  }
}
</script>

<style scoped>
.exercise-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.progress-bar {
  height: 4px;
  background: #e0e0e0;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #4a90e2;
  transition: width 0.3s ease;
}

.time-display {
  position: absolute;
  right: 16px;
  top: 8px;
  font-size: 14px;
  color: #666;
}

.exercise-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
}

.phase-indicator {
  text-align: center;
  margin-bottom: 32px;
}

.phase-text {
  font-size: 24px;
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
}

.phase-tip {
  font-size: 16px;
  color: #666;
}

.stats-panel {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 400px;
}

.stat-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-item .label {
  font-size: 14px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.control-panel {
  padding: 24px;
  background: white;
  border-top: 1px solid #eee;
}

.preparation-guide {
  margin-bottom: 24px;
}

.guide-item {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: #f9f9f9;
  transition: all 0.3s ease;
}

.guide-item.active {
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

.control-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:last-child {
  margin-bottom: 0;
}

.primary-btn {
  background: #4a90e2;
  color: white;
}

.secondary-btn {
  background: #f5f5f5;
  color: #333;
}

.danger-btn {
  background: #ff4444;
  color: white;
}

.completion-summary {
  text-align: center;
  margin-bottom: 24px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* 动画相关样式 */
.prepare-enter-active,
.prepare-leave-active {
  transition: opacity 0.5s ease;
}

.prepare-enter-from,
.prepare-leave-to {
  opacity: 0;
}
</style> 