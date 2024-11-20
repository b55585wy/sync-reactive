<template>
  <div class="breathing-settings">
    <div class="mode-selection">
      <h3>训练模式</h3>
      <div class="mode-options">
        <div 
          v-for="mode in modes" 
          :key="mode.value"
          :class="['mode-option', { active: selectedMode === mode.value }]"
          @click="selectMode(mode.value)"
        >
          <img :src="mode.icon" :alt="mode.label">
          <span class="mode-label">{{ mode.label }}</span>
          <span class="mode-desc">{{ mode.description }}</span>
        </div>
      </div>
    </div>

    <div class="training-params">
      <h3>训练参数</h3>
      <div class="param-item">
        <label>训练时长</label>
        <slider 
          v-model="duration" 
          :min="3" 
          :max="30" 
          :step="1"
        />
        <span class="param-value">{{ duration }}分钟</span>
      </div>

      <template v-if="selectedMode === 'press'">
        <div class="param-item">
          <label>压力等级</label>
          <slider 
            v-model="pressureLevel" 
            :min="1" 
            :max="10" 
            :step="1"
          />
          <span class="param-value">{{ pressureLevel }}级</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BreathingSettings',
  
  data() {
    return {
      modes: [
        {
          value: 'press',
          label: '按压模式',
          description: '固定频率按压训练',
          icon: '/static/press-mode-icon.png'
        },
        {
          value: 'smart',
          label: '智能模式',
          description: '自适应呼吸训练',
          icon: '/static/smart-mode-icon.png'
        }
      ],
      selectedMode: 'press',
      duration: 3,
      pressureLevel: 5
    };
  },

  methods: {
    selectMode(mode: string) {
      this.selectedMode = mode;
      this.$emit('mode-change', mode);
    }
  }
});
</script> 