<template>
  <div class="breathing-calibration">
    <div class="measurement-display">
      <CircularProgress 
        :value="currentValue" 
        :max="maxValue"
        :phase="measurementPhase"
      />
      <div class="measurement-status">
        <span class="status-text">{{ statusText }}</span>
        <span class="measurement-count">{{ measurementCount }}/3</span>
      </div>
    </div>
    
    <div class="control-panel">
      <template v-if="showConfirmation">
        <button @click="confirmMeasurement(true)" class="confirm-btn success">
          确认
        </button>
        <button @click="confirmMeasurement(false)" class="confirm-btn error">
          重试
        </button>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { BreathingService } from '@/services/breathing';

export default defineComponent({
  name: 'BreathingCalibration',
  
  data() {
    return {
      currentValue: 0,
      maxValue: 100,
      measurementPhase: 'inhale',
      measurementCount: 0,
      showConfirmation: false,
      measurements: [],
    };
  },

  computed: {
    statusText(): string {
      if (this.measurementPhase === 'inhale') {
        return `请尽最大努力吸气... (${this.measurementCount + 1}/3)`;
      }
      return `请尽最大努力呼气... (${this.measurementCount + 1}/3)`;
    }
  },

  methods: {
    async startMeasurement() {
      try {
        const breathingService = BreathingService.getInstance();
        const result = await breathingService.measureBreathing(this.measurementPhase);
        this.currentValue = result.value;
        this.showConfirmation = true;
      } catch (error) {
        console.error('Measurement failed:', error);
      }
    },

    async confirmMeasurement(isValid: boolean) {
      if (!isValid) {
        this.resetCurrentPhase();
        return;
      }

      // 处理测量确认逻辑
    }
  }
});
</script> 