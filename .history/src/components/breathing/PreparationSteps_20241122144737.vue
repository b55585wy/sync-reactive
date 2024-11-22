<template>
  <div class="preparation-steps">
    <div class="steps-container">
      <!-- 设备选择和状态 -->
      <div class="step">
        <div class="step-header">
          <h3>设备连接</h3>
          <div class="device-tips">
            {{ getDeviceTips }}
          </div>
        </div>
        
        <div class="devices-grid">
          <!-- 呼吸带卡片 -->
          <div class="device-card" :class="{ 
            connected: isBreathingBandConnected,
            'device-required': currentMode === 'breathing'
          }">
            <div class="device-icon">
              <i class="icon-breathing-band"></i>
            </div>
            <div class="device-info">
              <h4>呼吸带</h4>
              <p>{{ isBreathingBandConnected ? '已连接' : '未连接' }}</p>
              <span v-if="currentMode === 'breathing'" class="required-tag">
                呼吸训练必需
              </span>
            </div>
            <button 
              @click="connectDevice('breathing')"
              :class="{ 'btn-connected': isBreathingBandConnected }"
            >
              {{ isBreathingBandConnected ? '断开连接' : '连接设备' }}
            </button>
          </div>

          <!-- 心率带卡片 -->
          <div class="device-card" :class="{ 
            connected: isHeartRateBandConnected,
            'device-required': currentMode === 'heartRate'
          }">
            <div class="device-icon">
              <i class="icon-heart-rate"></i>
            </div>
            <div class="device-info">
              <h4>心率带</h4>
              <p>{{ isHeartRateBandConnected ? '已连接' : '未连接' }}</p>
              <span v-if="currentMode === 'heartRate'" class="required-tag">
                心率训练必需
              </span>
            </div>
            <button 
              @click="connectDevice('heartRate')"
              :class="{ 'btn-connected': isHeartRateBandConnected }"
            >
              {{ isHeartRateBandConnected ? '断开连接' : '连接设备' }}
            </button>
          </div>
        </div>

        <!-- 功能提示区域 -->
        <div class="feature-hints">
          <h4>当前可用功能：</h4>
          <div class="feature-list">
            <div 
              v-for="feature in availableFeatures" 
              :key="feature.id" 
              class="feature-item"
            >
              <i :class="feature.icon"></i>
              <span>{{ feature.name }}</span>
            </div>
          </div>
        </div>

        <!-- 开始训练按钮 -->
        <div class="action-area">
          <button 
            class="btn-start" 
            :disabled="!canStartTraining"
            @click="startTraining"
          >
            开始训练
          </button>
          <p v-if="!canStartTraining" class="warning-text">
            {{ getStartWarningText }}
          </p>
        </div>

        <!-- 设备扫描弹窗 (保持原有代码) -->
        <!-- ... -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref，computed } from 'vue';
import { useDeviceStore } from '@/stores/device';
import { useRouter } from 'vue-router';

const router = useRouter();
const deviceStore = useDeviceStore();

// 使用 deviceStore 中的状态替代本地 ref
const isBreathingBandConnected = computed(() => deviceStore.isBreathingBandConnected);
const isHeartRateBandConnected = computed(() => deviceStore.isHeartRateBandConnected);
const currentMode = ref<'breathing' | 'heartRate' | 'combined' | null>(null);

// 计算当前可用的功能列表
const availableFeatures = computed(() => {
  const features = [];
  
  if (isBreathingBandConnected.value && isHeartRateBandConnected.value) {
    features.push(
      { id: 1, name: '呼吸训练', icon: 'icon-breathing' },
      { id: 2, name: '心率监测', icon: 'icon-heart' },
      { id: 3, name: '综合分析', icon: 'icon-analysis' },
      { id: 4, name: '高级训练模式', icon: 'icon-advanced' }
    );
  } else if (isBreathingBandConnected.value) {
    features.push(
      { id: 1, name: '呼吸训练', icon: 'icon-breathing' },
      { id: 2, name: '基础呼吸监测', icon: 'icon-basic-monitoring' }
    );
  } else if (isHeartRateBandConnected.value) {
    features.push(
      { id: 1, name: '心率监测', icon: 'icon-heart' },
      { id: 2, name: '心率变异性分析', icon: 'icon-hrv' }
    );
  }
  
  return features;
});

// 连接设备方法
const connectDevice = async (type: 'breathing' | 'heartRate') => {
  if (type === 'breathing') {
    if (isBreathingBandConnected.value) {
      await deviceStore.disconnectBreathingBand();
    } else {
      await deviceStore.connectBreathingBand();
    }
  } else {
    if (isHeartRateBandConnected.value) {
      await deviceStore.disconnectHeartRateBand();
    } else {
      await deviceStore.connectHeartRateBand();
    }
  }
};

// 计算提示文本
const getDeviceTips = computed(() => {
  if (isBreathingBandConnected.value && isHeartRateBandConnected.value) {
    return '所有设备已连接，可以使用全部功能';
  } else if (isBreathingBandConnected.value) {
    return '已连接呼吸带，可以开始基础呼吸训练';
  } else if (isHeartRateBandConnected.value) {
    return '已连接心率带，可以进行心率监测';
  }
  return '请连接至少一个设备以开始训练';
});

// 判断是否可以开始训练
const canStartTraining = computed(() => {
  if (currentMode.value === 'breathing') {
    return isBreathingBandConnected.value;
  } else if (currentMode.value === 'heartRate') {
    return isHeartRateBandConnected.value;
  } else if (currentMode.value === 'combined') {
    return isBreathingBandConnected.value && isHeartRateBandConnected.value;
  }
  return isBreathingBandConnected.value || isHeartRateBandConnected.value;
});

// 获取开始训练的警告文本
const getStartWarningText = computed(() => {
  if (currentMode.value === 'breathing' && !isBreathingBandConnected.value) {
    return '需要连接呼吸带才能开始呼吸训练';
  } else if (currentMode.value === 'heartRate' && !isHeartRateBandConnected.value) {
    return '需要连接心率带才能开始心率训练';
  } else if (currentMode.value === 'combined' && (!isBreathingBandConnected.value || !isHeartRateBandConnected.value)) {
    return '需要同时连接呼吸带和心率带才能开始综合训练';
  }
  return '请连接至少一个设备';
});

// 开始训练
const startTraining = () => {
  if (!canStartTraining.value) return;
  
  // 根据不同的设备组合跳转到相应的训练模式
  if (isBreathingBandConnected.value && isHeartRateBandConnected.value) {
    // 跳转到综合训练页面
    router.push('/training/combined');
  } else if (isBreathingBandConnected.value) {
    // 跳转到呼吸训练页面
    router.push('/training/breathing');
  } else if (isHeartRateBandConnected.value) {
    // 跳转到心率训练页面
    router.push('/training/heart-rate');
  }
};

// ... 其他原有代码 ...
</script>

<style scoped>
.preparation-steps {
  padding: 20px;
}

.step-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.step-item:hover {
  background-color: #e9ecef;
}

.step-item.completed {
  background-color: #e8f5e9;
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #4a90e2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.step-content {
  flex: 1;
}

.step-checkbox {
  margin-left: 15px;
}

.action-buttons {
  margin-top: 30px;
  padding: 0 20px;
}

.confirm-btn {
  width: 100%;
  height: 44px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 22px;
  font-size: 16px;
}

.confirm-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.timer-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background-color: #4a90e2;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
}

.status {
  font-size: 20px;
  margin-bottom: 5px;
}

.time {
  font-size: 36px;
  font-weight: bold;
}

.device-status {
  text-align: center;
  color: #666;
  margin: 10px 0;
}

.next-btn {
  width: 100%;
  height: 44px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 22px;
  font-size: 16px;
  margin-top: 20px;
}

.next-btn:disabled {
  background-color: #ccc;
  opacity: 0.8;
}

.checking {
  position: relative;
}

.checking::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-hints {
  margin-top: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.device-required {
  border: 2px solid #ff9800;
}

.required-tag {
  font-size: 12px;
  color: #ff9800;
  background: rgba(255, 152, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
  display: inline-block;
}

.action-area {
  margin-top: 24px;
  text-align: center;
}

.btn-start {
  padding: 12px 32px;
  font-size: 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-start:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.warning-text {
  color: #f44336;
  margin-top: 8px;
  font-size: 14px;
}

.device-tips {
  color: #666;
  font-size: 14px;
}
</style> 