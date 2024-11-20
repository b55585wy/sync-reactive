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

<script setup lang="ts">
import { ref } from 'vue'
import BreathingPetal from '@/components/breathing/BreathingPetal.vue'

const isExercising = ref(false)
const currentPhase = ref('inhale')
const phaseDuration = ref(4) // 4秒一个周期

const startExercise = () => {
  isExercising.value = true
}

const pauseExercise = () => {
  isExercising.value = false
}

const handlePhaseComplete = () => {
  // 切换呼吸阶段
  switch (currentPhase.value) {
    case 'inhale':
      currentPhase.value = 'hold'
      phaseDuration.value = 7 // 屏息7秒
      break
    case 'hold':
      currentPhase.value = 'exhale'
      phaseDuration.value = 8 // 呼气8秒
      break
    case 'exhale':
      currentPhase.value = 'inhale'
      phaseDuration.value = 4 // 吸气4秒
      break
  }
}

const createParticles = () => {
  // 实现粒子动画逻辑
}
</script> 