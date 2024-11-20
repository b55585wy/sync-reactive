<template>
  <div class="exercise-page">
    <div class="exercise-header">
      <h1>{{ exerciseTitle }}</h1>
      <button class="close-btn" @click="handleClose">×</button>
    </div>

    <breathing-animation
      :is-breathing="isBreathing"
      :phase="currentPhase"
      :duration="phaseDuration"
      :show-timer="true"
    />

    <div class="exercise-controls">
      <button 
        class="control-btn"
        :class="{ active: isBreathing }"
        @click="toggleExercise"
      >
        {{ isBreathing ? '暂停' : '开始' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import BreathingAnimation from '../components/breathing/BreathingAnimation.vue'
import { useBreathingStore } from '../stores/breathing'

export default {
  name: 'Exercise',
  components: {
    BreathingAnimation
  },
  setup() {
    const router = useRouter()
    const breathingStore = useBreathingStore()
    
    const isBreathing = ref(false)
    const currentPhase = ref('inhale')
    const phaseDuration = ref(4)
    const exerciseTitle = ref('4-7-8呼吸法')

    let exerciseTimer = null

    const toggleExercise = () => {
      isBreathing.value = !isBreathing.value
      if (isBreathing.value) {
        breathingStore.startSession()
        startExercise()
      } else {
        breathingStore.stopSession()
        pauseExercise()
      }
    }

    const startExercise = () => {
      // 实现呼吸循环逻辑
      let phaseIndex = 0
      const phases = ['inhale', 'hold', 'exhale']
      const durations = [4, 7, 8] // 4-7-8呼吸法的时间设置

      exerciseTimer = setInterval(() => {
        phaseIndex = (phaseIndex + 1) % 3
        currentPhase.value = phases[phaseIndex]
        phaseDuration.value = durations[phaseIndex]
        breathingStore.setPhase(currentPhase.value)
      }, phaseDuration.value * 1000)
    }

    const pauseExercise = () => {
      if (exerciseTimer) {
        clearInterval(exerciseTimer)
        exerciseTimer = null
      }
    }

    const handleClose = () => {
      pauseExercise()
      router.push('/')
    }

    onMounted(() => {
      // 初始化设置
      const settings = breathingStore.settings
      phaseDuration.value = settings.inhaleTime
    })

    onBeforeUnmount(() => {
      pauseExercise()
    })

    return {
      isBreathing,
      currentPhase,
      phaseDuration,
      exerciseTitle,
      toggleExercise,
      handleClose
    }
  }
}
</script>

<style scoped>
.exercise-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  color: white;
}

.exercise-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
}

.exercise-controls {
  padding: 2rem;
  display: flex;
  justify-content: center;
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

.control-btn.active {
  background: #e74c3c;
}
</style> 