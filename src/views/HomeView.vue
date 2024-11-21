<template>
  <div class="home">
    <header class="hero">
      <h1>呼吸训练</h1>
      <p>通过科学的呼吸方法提升身心健康</p>
    </header>
    
    <!-- 快速开始卡片 -->
    <div class="quick-start">
      <div class="card" @click="startLastTraining" v-if="deviceStore.lastConnectedDevice">
        <h3>继续上次的训练</h3>
        <p>使用{{ getDeviceName }}继续训练</p>
      </div>
      
      <div class="card primary" @click="startNewTraining">
        <h3>开始新的训练</h3>
        <p>选择设备开始训练</p>
      </div>
    </div>
    
    <!-- 训练模式展示 -->
    <div class="training-modes">
      <h2>训练模式</h2>
      <div class="mode-grid">
        <div 
          v-for="mode in trainingModes" 
          :key="mode.id"
          class="mode-card"
          @click="startTrainingMode(mode)"
        >
          <div class="mode-icon">
            <i :class="mode.icon"></i>
          </div>
          <h4>{{ mode.name }}</h4>
          <p>{{ mode.description }}</p>
          <span class="device-required" v-if="mode.requiresDevice">
            需要{{ getDeviceRequirement(mode.requiresDevice) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useDeviceStore } from '@/stores/deviceStore';

const router = useRouter();
const deviceStore = useDeviceStore();

const trainingModes = [
  {
    id: 'guided-breathing',
    name: '引导式呼吸',
    description: '跟随节奏进行呼吸训练',
    icon: 'icon-guided',
    requiresDevice: 'breathing'
  },
  {
    id: 'heart-monitor',
    name: '心率监测',
    description: '实时监测心率变化',
    icon: 'icon-heart',
    requiresDevice: 'heartRate'
  },
  {
    id: 'coherence',
    name: '心肺协调训练',
    description: '提升心肺功能协调性',
    icon: 'icon-coherence',
    requiresDevice: 'both'
  },
  // ... 其他训练模式
];

const getDeviceName = computed(() => {
  switch (deviceStore.lastConnectedDevice) {
    case 'breathing':
      return '呼吸带';
    case 'heartRate':
      return '心率带';
    default:
      return '';
  }
});

const getDeviceRequirement = (requirement: string) => {
  switch (requirement) {
    case 'breathing':
      return '呼吸带';
    case 'heartRate':
      return '心率带';
    case 'both':
      return '呼吸带和心率带';
    default:
      return '';
  }
};

const startNewTraining = () => {
  router.push('/prepare/devices');
};

const startLastTraining = () => {
  if (deviceStore.lastConnectedDevice) {
    router.push('/prepare/devices');
  }
};

const startTrainingMode = (mode: any) => {
  // 检查是否有必要的设备已连接
  if (!hasRequiredDevices(mode.requiresDevice)) {
    router.push('/prepare/devices');
  } else {
    router.push(`/training/${mode.id}`);
  }
};

const hasRequiredDevices = (requirement: string) => {
  switch (requirement) {
    case 'breathing':
      return deviceStore.isBreathingBandConnected;
    case 'heartRate':
      return deviceStore.isHeartRateBandConnected;
    case 'both':
      return deviceStore.isBreathingBandConnected && deviceStore.isHeartRateBandConnected;
    default:
      return true;
  }
};
</script> 