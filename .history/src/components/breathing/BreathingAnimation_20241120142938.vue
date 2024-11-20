<template>
  <div class="breathing-container">
    <div 
      class="breathing-circle"
      :class="{ 'inhale': phase === 'inhale', 'exhale': phase === 'exhale', 'hold': phase === 'hold' }"
    >
      <span class="instruction">{{ currentInstruction }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

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