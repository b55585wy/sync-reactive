<template>
  <div class="breathing-container" :class="{ active: isActive }">
    <!-- 中心圆 -->
    <div class="center-circle">
      <span class="breath-text">{{ currentPhaseText }}</span>
      <span class="timer-text" v-if="showTimer">{{ formatTime(currentTime) }}</span>
    </div>
    
    <!-- 花瓣层 -->
    <div class="petals-container">
      <div v-for="i in 8" :key="i" 
           class="petal" 
           :class="[`petal-${i}`, breathingState]"
           :style="getPetalStyle(i)">
      </div>
    </div>
    
    <!-- 进度环 -->
    <div class="progress-ring">
      <svg viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#E0E0E0"
          stroke-width="2"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          :stroke="progressColor"
          stroke-width="2"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          transform="rotate(-90 50 50)"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isActive: Boolean,
  duration: {
    type: Number,
    default: 0
  },
  phase: {
    type: String,
    default: 'inhale'
  },
  showTimer: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['phaseComplete', 'exerciseComplete'])

// 状态管理
const breathingState = ref('idle')
const currentTime = ref(0)
const animationTimer = ref<number | null>(null)

// 计算属性
const currentPhaseText = computed(() => {
  switch (props.phase) {
    case 'inhale': return '吸气'
    case 'hold': return '屏息'
    case 'exhale': return '呼气'
    default: return '准备'
  }
})

const circumference = computed(() => 2 * Math.PI * 45)
const dashOffset = computed(() => {
  if (!props.duration) return 0
  const progress = currentTime.value / props.duration
  return circumference.value * (1 - progress)
})

const progressColor = computed(() => {
  switch (props.phase) {
    case 'inhale': return '#4CAF50'
    case 'hold': return '#2196F3'
    case 'exhale': return '#9C27B0'
    default: return '#E0E0E0'
  }
})

// 方法
const getPetalStyle = (index: number) => {
  const rotation = (index - 1) * 45 // 360度/8瓣
  const scale = breathingState.value === 'inhale' ? 1.2 : 1
  const delay = (index - 1) * 0.1
  
  return {
    transform: `rotate(${rotation}deg) scale(${scale})`,
    transition: `all 0.5s ease ${delay}s`
  }
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const startBreathingAnimation = () => {
  breathingState.value = props.phase
  if (props.duration > 0) {
    currentTime.value = props.duration
    startTimer()
  }
}

const startTimer = () => {
  if (animationTimer.value) clearInterval(animationTimer.value)
  
  animationTimer.value = setInterval(() => {
    if (currentTime.value <= 0) {
      clearInterval(animationTimer.value!)
      emit('phaseComplete')
      return
    }
    currentTime.value -= 0.1
  }, 100)
}

// 生命周期
onMounted(() => {
  if (props.isActive) {
    startBreathingAnimation()
  }
})

onUnmounted(() => {
  if (animationTimer.value) {
    clearInterval(animationTimer.value)
  }
})

// 监听属性变化
watch(() => props.isActive, (newValue) => {
  if (newValue) {
    startBreathingAnimation()
  } else {
    breathingState.value = 'idle'
    if (animationTimer.value) {
      clearInterval(animationTimer.value)
    }
  }
})

watch(() => props.phase, (newValue) => {
  breathingState.value = newValue
})
</script>

<style scoped>
.breathing-container {
  position: relative;
  width: 300px;
  height: 300px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center-circle {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.breath-text {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.timer-text {
  font-size: 16px;
  color: #666;
  margin-top: 5px;
}

.petals-container {
  position: absolute;
  width: 100%;
  height: 100%;
  animation: rotate 60s linear infinite;
}

.petal {
  position: absolute;
  width: 60px;
  height: 120px;
  left: 50%;
  top: 50%;
  margin-left: -30px;
  margin-top: -60px;
  border-radius: 60px 60px 0 0;
  background: linear-gradient(to right, #E3F2FD, #90CAF9);
  transform-origin: 50% 100%;
  opacity: 0.8;
  transition: all 2s ease;
}

.petal.inhale {
  transform: scale(1.2);
  background: linear-gradient(to right, #E8F5E9, #A5D6A7);
}

.petal.hold {
  background: linear-gradient(to right, #E3F2FD, #90CAF9);
}

.petal.exhale {
  transform: scale(0.8);
  background: linear-gradient(to right, #F3E5F5, #CE93D8);
}

.progress-ring {
  position: absolute;
  width: 100%;
  height: 100%;
}

.progress-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 为每个花瓣设置不同的初始旋转角度 */
.petal-1 { transform: rotate(0deg); }
.petal-2 { transform: rotate(45deg); }
.petal-3 { transform: rotate(90deg); }
.petal-4 { transform: rotate(135deg); }
.petal-5 { transform: rotate(180deg); }
.petal-6 { transform: rotate(225deg); }
.petal-7 { transform: rotate(270deg); }
.petal-8 { transform: rotate(315deg); }
</style> 