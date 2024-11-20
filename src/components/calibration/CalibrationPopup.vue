<template>
  <div class="calibration-popup">
    <div class="calibration-header">
      <h3>腹围变化测量</h3>
      <span class="close" @click="handleClose">×</span>
    </div>

    <ruler-component
      v-model="currentValue"
      :min-value="-5"
      :max-value="5"
      :step="0.1"
    />

    <div class="measurement-status">
      <span class="status-text">{{ statusText }}</span>
      <div class="measurement-values">
        <span>吸气最大值: {{ inhalationMax.toFixed(1) }}cm</span>
        <span>呼气最大值: {{ exhalationMax.toFixed(1) }}cm</span>
      </div>
      <span class="count">{{ measurementCount }}/3</span>
    </div>

    <div class="action-buttons">
      <button @click="restartMeasurement">重新测量</button>
      <button 
        :disabled="measurementCount < 3"
        @click="completeCalibration"
      >
        开始锻炼
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import RulerComponent from './RulerComponent.vue'
import { useBreathingStore } from '@/store/breathing'

const breathingStore = useBreathingStore()
const currentValue = ref(0)
const measurementCount = ref(0)
const inhalationMax = ref(0)
const exhalationMax = ref(0)

// ... 实现测量逻辑 ...
</script> 