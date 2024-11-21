<template>
  <div class="preparation-steps">
    <div class="steps-container">
      <!-- 设备选择步骤 -->
      <div class="step" :class="{ active: currentStep === 1 }">
        <div class="step-header">
          <h3>选择要连接的设备类型</h3>
          <span class="step-status">{{ completedDevices.length }}/2 已连接</span>
        </div>
        
        <div class="devices-grid">
          <!-- 呼吸带卡片 -->
          <div class="device-card" :class="{ connected: isBreathingBandConnected }">
            <div class="device-icon">
              <i class="icon-breathing-band"></i>
            </div>
            <div class="device-info">
              <h4>呼吸带</h4>
              <p>{{ isBreathingBandConnected ? '已连接' : '未连接' }}</p>
            </div>
            <button 
              @click="connectDevice('breathing')"
              :class="{ 'btn-connected': isBreathingBandConnected }"
            >
              {{ isBreathingBandConnected ? '断开连接' : '连接设备' }}
            </button>
          </div>

          <!-- 心率带卡片 -->
          <div class="device-card" :class="{ connected: isHeartRateBandConnected }">
            <div class="device-icon">
              <i class="icon-heart-rate"></i>
            </div>
            <div class="device-info">
              <h4>心率带</h4>
              <p>{{ isHeartRateBandConnected ? '已连接' : '未连接' }}</p>
            </div>
            <button 
              @click="connectDevice('heartRate')"
              :class="{ 'btn-connected': isHeartRateBandConnected }"
            >
              {{ isHeartRateBandConnected ? '断开连接' : '连接设备' }}
            </button>
          </div>
        </div>

        <!-- 设备扫描弹窗 -->
        <div v-if="showScanModal" class="scan-modal">
          <div class="modal-header">
            <h3>扫描{{ currentScanType === 'breathing' ? '呼吸带' : '心率带' }}</h3>
            <button @click="closeScanModal">关闭</button>
          </div>
          
          <div class="device-list">
            <div v-if="isScanning" class="scanning-animation">
              <div class="spinner"></div>
              <p>正在扫描设备...</p>
            </div>
            
            <template v-else-if="deviceList.length">
              <div 
                v-for="device in deviceList" 
                :key="device.deviceId"
                class="device-item"
                @click="selectDevice(device)"
              >
                <span class="device-name">{{ device.name }}</span>
                <span class="signal-strength">信号: {{ device.RSSI }}dB</span>
              </div>
            </template>
            
            <div v-else class="no-devices">
              <p>未找到设备</p>
              <button @click="startScan">重新扫描</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { bluetoothService } from '@/services/BluetoothService';

// 状态管理
const isBreathingBandConnected = ref(false);
const isHeartRateBandConnected = ref(false);
const showScanModal = ref(false);
const isScanning = ref(false);
const deviceList = ref<any[]>([]);
const currentScanType = ref<'breathing' | 'heartRate'>('breathing');

// 计算已连接设备数量
const completedDevices = computed(() => {
  const devices = [];
  if (isBreathingBandConnected.value) devices.push('breathing');
  if (isHeartRateBandConnected.value) devices.push('heartRate');
  return devices;
});

// 连接设备
const connectDevice = async (type: 'breathing' | 'heartRate') => {
  currentScanType.value = type;
  showScanModal.value = true;
  await startScan();
};

// 开始扫描
const startScan = async () => {
  isScanning.value = true;
  deviceList.value = [];
  
  try {
    const devices = await bluetoothService.startDeviceDiscovery(currentScanType.value);
    deviceList.value = devices;
  } catch (error) {
    console.error('扫描失败:', error);
  } finally {
    isScanning.value = false;
  }
};

// 选择设备
const selectDevice = async (device: any) => {
  try {
    const connected = await bluetoothService.connectDevice(device);
    if (connected) {
      if (currentScanType.value === 'breathing') {
        isBreathingBandConnected.value = true;
      } else {
        isHeartRateBandConnected.value = true;
      }
      showScanModal.value = false;
    }
  } catch (error) {
    console.error('连接失败:', error);
  }
};

// 关闭扫描弹窗
const closeScanModal = () => {
  showScanModal.value = false;
  isScanning.value = false;
  deviceList.value = [];
};
</script>

<style scoped>
.preparation-steps {
  padding: 20px;
}

.steps-container {
  max-width: 800px;
  margin: 0 auto;
}

.step {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.device-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.device-card.connected {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.device-icon {
  width: 48px;
  height: 48px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
}

.device-info {
  flex: 1;
}

.device-info h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.device-info p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #666;
}

button {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: #1976D2;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

button.btn-connected {
  background: #4CAF50;
}

.scan-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.device-list {
  max-height: 300px;
  overflow-y: auto;
}

.device-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.scanning-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-radius: 10px;
  background: #f5f5f5;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #4CAF50;
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-devices {
  text-align: center;
  color: #666;
  margin: 10px 0;
}
</style> 