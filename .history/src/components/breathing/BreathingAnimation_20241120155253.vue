<template>
  <div class="breathing-circle-container">
    <div class="breathing-circle" :class="[phase, { active: isActive }]">
      <div class="circle-content">
        <div class="phase-text">{{ phaseText }}</div>
        <div class="timer">{{ formatTime }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'BreathingAnimation',
  
  props: {
    phase: {
      type: String,
      default: 'prepare'
    },
    isActive: {
      type: Boolean,
      default: false
    },
    currentTime: {
      type: Number,
      default: 0
    }
  },

  setup(props) {
    const phaseText = computed(() => {
      const phases = {
        prepare: '准备',
        inhale: '吸气',
        hold: '屏息',
        exhale: '呼气',
        rest: '休息'
      }
      return phases[props.phase] || ''
    })

    const formatTime = computed(() => {
      const minutes = Math.floor(props.currentTime / 60)
      const seconds = props.currentTime % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    })

    return {
      phaseText,
      formatTime
    }
  }
}
</script>

<style scoped>
.breathing-circle-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.breathing-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(145deg, #4a90e2, #357abd);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.5s ease;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
  position: relative;
  overflow: hidden;
}

.circle-content {
  color: white;
  text-align: center;
  z-index: 2;
}

.phase-text {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.timer {
  font-size: 36px;
}

/* 呼吸动画效果 */
.breathing-circle.inhale {
  animation: inhale 4s ease-in-out infinite;
}

.breathing-circle.exhale {
  animation: exhale 4s ease-in-out infinite;
}

.breathing-circle.hold {
  animation: pulse 1s ease-in-out infinite;
}

.breathing-circle.prepare {
  animation: glow 2s ease-in-out infinite;
}

@keyframes inhale {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

@keyframes exhale {
  0% {
    transform: scale(1.2);
    opacity: 1;
  }
  50% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.2);
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1.1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1.1);
  }
}

@keyframes glow {
  0% {
    box-shadow: 0 0 5px rgba(74, 144, 226, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(74, 144, 226, 0.6);
  }
  100% {
    box-shadow: 0 0 5px rgba(74, 144, 226, 0.3);
  }
}

/* 添加呼吸波纹效果 */
.breathing-circle::before,
.breathing-circle::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: ripple 4s infinite;
}

.breathing-circle::after {
  animation-delay: -2s;
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.4;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}
</style> 