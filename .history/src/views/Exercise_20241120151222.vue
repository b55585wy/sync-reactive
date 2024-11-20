<template>
  <div class="exercise-page">
    <breathing-petal
      :is-active="isExercising"
      :phase="currentPhase"
      :duration="phaseDuration"
      @phase-complete="handlePhaseComplete"
    />
    
    <div class="exercise-controls">
      <button @click="startExercise" v-if="!isExercising">
        开始练习
      </button>
      <button @click="pauseExercise" v-else>
        暂停
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
</script> 