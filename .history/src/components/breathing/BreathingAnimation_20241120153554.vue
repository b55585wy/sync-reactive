<template>
  <div class="breathing-animation">
    <div class="watch-face" :style="watchFaceStyle">
      <div v-for="i in 6" 
           :key="i" 
           class="circle" 
           :class="[`circle-${i}`, breathingState]"
           :style="circleStyle(i)">
      </div>
    </div>
    <div class="breathing-text">
      {{ currentPhaseText }}
    </div>
    <div class="breathing-timer" v-if="showTimer">
      {{ formatTime(currentTime) }}
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'BreathingAnimation',
  props: {
    isBreathing: {
      type: Boolean,
      default: false
    },
    phase: {
      type: String,
      default: 'inhale'
    },
    duration: {
      type: Number,
      default: 4
    },
    scale: {
      type: Number,
      default: 1
    },
    showTimer: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const currentTime = ref(0)
    
    const breathingState = computed(() => props.phase)
    
    const watchFaceStyle = computed(() => ({
      animationDuration: `${props.duration}s`,
      animationPlayState: props.isBreathing ? 'running' : 'paused',
      transform: `scale(${props.scale})`
    }))

    const currentPhaseText = computed(() => {
      switch(props.phase) {
        case 'inhale': return '吸气'
        case 'hold': return '屏息'
        case 'exhale': return '呼气'
        default: return ''
      }
    })

    const formatTime = (time) => {
      const minutes = Math.floor(time / 60)
      const seconds = Math.floor(time % 60)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const circleStyle = (index) => ({
      animationDuration: `${props.duration}s`,
      animationPlayState: props.isBreathing ? 'running' : 'paused'
    })

    return {
      currentTime,
      breathingState,
      watchFaceStyle,
      currentPhaseText,
      formatTime,
      circleStyle
    }
  }
}
</script>

<style scoped>
.breathing-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #1a1a1a;
  color: white;
}

.watch-face {
  position: relative;
  height: 125px;
  width: 125px;
  animation: pulse 4s cubic-bezier(0.5, 0, 0.5, 1) alternate infinite;
  animation-play-state: paused;
  transition: transform 0.3s ease;
}

.circle {
  height: 125px;
  width: 125px;
  border-radius: 50%;
  position: absolute;
  mix-blend-mode: screen;
  transform: translate(0, 0);
  transition: background-color 0.3s ease;
}

/* 吸气状态 */
.circle.inhale {
  background: #61bea2;
}

/* 屏息状态 */
.circle.hold {
  background: #529ca0;
}

/* 呼气状态 */
.circle.exhale {
  background: #4a90e2;
}

/* ... 保留原有的动画关键帧 ... */

.breathing-text {
  margin-top: 2rem;
  font-size: 1.5rem;
  font-weight: 500;
}

.breathing-timer {
  margin-top: 1rem;
  font-size: 1.2rem;
  opacity: 0.8;
}

/* 添加深色模式支持 */
@media (prefers-color-scheme: dark) {
  .breathing-animation {
    background: #000;
  }
}
</style> 