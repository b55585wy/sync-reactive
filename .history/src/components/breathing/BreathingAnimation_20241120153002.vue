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

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const circleStyle = (index: number) => ({
  animationDuration: `${props.duration}s`,
  animationPlayState: props.isBreathing ? 'running' : 'paused'
})
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