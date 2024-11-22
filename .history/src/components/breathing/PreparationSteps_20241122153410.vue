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
import { ref,computed, onMounted } from 'vue';
import { useDeviceStore } from '@/stores/device';
import { useRouter } from 'vue-router';
import { IconBreathing, IconHeart, IconAnalysis, IconAdvanced } from '@/assets/icons';
import BluetoothService from '../../services/BluetoothService';
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
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.steps-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 24px;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.step-header h3 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0;
}

.device-tips {
  color: #666;
  font-size: 15px;
  background: #f8f9fa;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

/* 设备网格布局 */
.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

/* 设备卡片样式 */
.device-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  border: 1px solid #eee;
  position: relative;
  overflow: hidden;
}

.device-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #e0e0e0, #f5f5f5);
  transition: all 0.3s ease;
}

.device-card.connected::before {
  background: linear-gradient(90deg, #4CAF50, #81C784);
}

.device-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.device-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.device-card.connected .device-icon {
  background: linear-gradient(135deg, #4CAF50, #81C784);
  color: white;
}

.device-info {
  flex: 1;
}

.device-info h4 {
  margin: 0 0 4px;
  font-size: 18px;
  color: #2c3e50;
}

.device-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

/* 功能提示区域 */
.feature-hints {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 16px;
  padding: 24px;
  margin-top: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.feature-item {
  background: white;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  border: 1px solid #eee;
}

.feature-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 按钮样式 */
button {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f0f2f5;
  color: #666;
}

button:hover {
  background: #e8eaed;
}

.btn-connected {
  background: #4CAF50;
  color: white;
}

.btn-connected:hover {
  background: #43A047;
}

.action-area {
  margin-top: 24px;
  text-align: center;
}

.btn-start {
  background: linear-gradient(135deg, #4CAF50, #81C784);
  color: white;
  padding: 14px 36px;
  font-size: 16px;
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