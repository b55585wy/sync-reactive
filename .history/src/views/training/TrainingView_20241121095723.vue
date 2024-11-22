<template>
  <div class="training-view">
    <header class="training-header">
      <div class="device-status">
        <div v-if="deviceStore.isBreathingBandConnected" class="device-badge">
          <i class="icon-breathing"></i>
          呼吸带已连接
        </div>
        <div v-if="deviceStore.isHeartRateBandConnected" class="device-badge">
          <i class="icon-heart"></i>
          心率带已连接
        </div>
      </div>
      
      <div class="training-controls">
        <button class="btn-back" @click="router.back()">
          <i class="icon-back"></i>
          返回
        </button>
      </div>
    </header>

    <!-- 训练内容区域 -->
    <main class="training-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useDeviceStore } from '@/stores/deviceStore';

const router = useRouter();
const deviceStore = useDeviceStore();
</script>

<style scoped>
.training-view {
  min-height: 100vh;
  background: #f5f7fa;
}

.training-header {
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.device-status {
  display: flex;
  gap: 12px;
}

.device-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #e3f2fd;
  border-radius: 20px;
  font-size: 14px;
  color: #1976D2;
}

.training-controls {
  display: flex;
  gap: 12px;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  color: #333;
}

.training-content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>