<template>
  <div class="breathing-container">
    <div class="breathing-circle" 
         :class="[currentPhase, { active: isActive }]"
         :style="circleStyle">
      <div class="inner-circle">
        <span class="phase-text">{{ phaseText }}</span>
        <span class="timer">{{ formattedTime }}</span>
      </div>
    </div>
    
    <div class="breathing-stats" v-if="showStats">
      <div class="stat-item">
        <span class="label">吸气强度</span>
        <span class="value">{{ inhaleStrength }}%</span>
      </div>
      <div class="stat-item">
        <span class="label">呼气强度</span>
        <span class="value">{{ exhaleStrength }}%</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useBreathingStore } from '@/stores/breathing'

export default {
  name: 'BreathingAnimation',
  
  props: {
    showStats: {
      type: Boolean,
      default: false
    }
  },

  setup() {
    const store = useBreathingStore()
    
    // 计算动画样式
    const circleStyle = computed(() => {
      const scale = store.currentSession.phase === 'inhale' ? 1.5 : 1
      return {
        transform: `scale(${scale})`,
        transition: `transform ${store.currentPhaseTime}s ease-in-out`
      }
    })
    
    // 计算当前阶段文本
    const phaseText = computed(() => {
      const phaseMap = {
        prepare: '准备',
        inhale: '吸气',
        hold: '屏息',
        exhale: '呼气',
        rest: '休息'
      }
      return phaseMap[store.currentSession.phase] || ''
    })
    
    // 格式化时间显示
    const formattedTime = computed(() => {
      const time = Math.max(0, store.currentPhaseTime)
      const minutes = Math.floor(time / 60)
      const seconds = Math.floor(time % 60)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    })

    return {
      circleStyle,
      phaseText,
      formattedTime,
      currentPhase: computed(() => store.currentSession.phase),
      isActive: computed(() => store.currentSession.isActive),
      inhaleStrength: computed(() => {
        const max = store.breathingData.maxInhale
        const current = store.breathingData.currentValue
        return Math.round((current / max) * 100) || 0
      }),
      exhaleStrength: computed(() => {
        const max = Math.abs(store.breathingData.maxExhale)
        const current = Math.abs(store.breathingData.currentValue)
        return Math.round((current / max) * 100) || 0
      })
    }
  }
}
</script>

<style scoped>
.breathing-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #1a1a1a;
  color: white;
}

.breathing-circle {
  position: relative;
  height: 125px;
  width: 125px;
  border-radius: 50%;
  mix-blend-mode: screen;
  transform: translate(0, 0);
  transition: background-color 0.3s ease;
}

.inner-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.phase-text {
  font-size: 1.5rem;
  font-weight: 500;
}

.timer {
  font-size: 1.2rem;
  opacity: 0.8;
}

/* 吸气状态 */
.breathing-circle.inhale {
  background: #61bea2;
}

/* 屏息状态 */
.breathing-circle.hold {
  background: #529ca0;
}

/* 呼气状态 */
.breathing-circle.exhale {
  background: #4a90e2;
}

/* 准备状态 */
.breathing-circle.prepare {
  background: #333;
}

/* 休息状态 */
.breathing-circle.rest {
  background: #222;
}

/* 添加深色模式支持 */
@media (prefers-color-scheme: dark) {
  .breathing-container {
    background: #000;
  }
}
</style> 