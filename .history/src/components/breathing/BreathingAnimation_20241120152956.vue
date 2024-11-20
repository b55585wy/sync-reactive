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

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  isBreathing: boolean
  phase: 'inhale' | 'hold' | 'exhale'
  duration: number
  scale?: number
  showTimer?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  scale: 1,
  showTimer: true
})

const currentTime = ref(0)
const breathingState = computed(() => props.phase)

const watchFaceStyle = computed(() => ({
const phase = ref<'inhale' | 'exhale' | 'hold'>('inhale')
const currentInstruction = computed(() => {
  switch (phase.value) {
    case 'inhale': return '吸气'
    case 'exhale': return '呼气'
    case 'hold': return '屏息'
  }
})

// 呼吸模式控制逻辑
const startBreathing = (pattern: BreathingPattern) => {
  // 实现呼吸引导逻辑
}
</script>

<style scoped>
.breathing-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  transition: all 2s ease-in-out;
}

.inhale {
  transform: scale(1.5);
  background-color: var(--primary-color);
}

.exhale {
  transform: scale(1);
  background-color: var(--secondary-color);
}
</style> 