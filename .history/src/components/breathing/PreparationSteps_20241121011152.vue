<template>
  <div class="preparation-steps">
    <div class="timer-circle">
      <span class="status">准备</span>
      <span class="time">{{ formatTime(time) }}</span>
    </div>

    <div class="steps-container">
      <div v-for="(step, index) in steps" 
           :key="index"
           :class="['step-item', { 'completed': completedSteps[index] }]">
        <div class="step-number">{{ index + 1 }}</div>
        <div class="step-content">
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </div>
        <div class="step-checkbox" @click="toggleStep(index)">
          <checkbox :checked="completedSteps[index]" :disabled="index === 2 && !deviceConnected" />
        </div>
      </div>
    </div>

    <div class="device-status" v-if="isCheckingDevice">
      正在检查设备连接状态...
    </div>

    <button 
      class="next-btn"
      :disabled="!canProceed"
      @click="proceedToNext"
    >
      {{ buttonText }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import BluetoothService from '@/services/BluetoothService';
import { useExerciseStore } from '@/stores/exercise'


export default defineComponent({
  name: 'PreparationSteps',
  
  setup() {
    const router = useRouter();
    const completedSteps = ref([false, false, false]);
    const deviceConnected = ref(false);
    const isCheckingDevice = ref(false);
    
    const steps = [
      {
        title: '调整姿势',
        description: '找一个安静的地方，采用舒适的坐姿或躺姿'
      },
      {
        title: '佩戴设备',
        description: '将呼吸带轻轻系在腹部，确保不会滑动'
      },
      {
        title: '设备检查',
        description: '等待设备连接并校准完成'
      }
    ];

    const canProceed = computed(() => {
      return completedSteps.value.every(step => step) && deviceConnected.value;
    });

    const buttonText = computed(() => {
      if (!deviceConnected.value) return '等待设备连接...';
      if (!canProceed.value) return '请完成所有准备步骤';
      return '开始训练';
    });

    const toggleStep = async (index: number) => {
      if (index === 2) {
        if (!deviceConnected.value) {
          await checkDeviceConnection();
        }
      } else {
        completedSteps.value[index] = !completedSteps.value[index];
      }
    };

    const checkDeviceConnection = async () => {
      isCheckingDevice.value = true;
      try {
        const isConnected = await bluetoothService.isConnected();
        deviceConnected.value = isConnected;
        completedSteps.value[2] = isConnected;
        
        if (isConnected) {
          alert('设备连接成功');
        } else {
          alert('设备连接失败，请重试');
        }
      } catch (error) {
        console.error('设备检查失败:', error);
      } finally {
        isCheckingDevice.value = false;
      }
    };

    const proceedToNext = async () => {
      if (!canProceed.value) return;
      
      try {
        await router.push({
          name: 'BreathingExercise',
          query: {
            mode: 'smart',
            duration: 3
          }
        });
      } catch (error) {
        console.error('导航失败:', error);
        alert('进入训练失败，请重试');
      }
    };

    const bluetoothService = BluetoothService.getInstance();
    const isScanning = ref(false);
    const deviceList = ref<any[]>([]);

    // 初始化蓝牙
    const initBluetooth = async () => {
      try {
        await bluetoothService.initBluetooth();
        startScan();
      } catch (error) {
        console.error('蓝牙初始化失败:', error);
      }
    };

    // 开始扫描
    const startScan = async () => {
      isScanning.value = true;
      try {
        await bluetoothService.startDeviceDiscovery();
        
        // 监听发现设备事件
        uni.onBluetoothDeviceFound((result) => {
          const device = result.devices[0];
          // 过滤设备
          if (device.name && device.name.includes('呼吸带')) {
            deviceList.value.push(device);
          }
        });
      } catch (error) {
        console.error('扫描失败:', error);
      }
    };

    // 连接设备
    const connectDevice = async (deviceId: string) => {
      try {
        await bluetoothService.connectDevice(deviceId);
        uni.showToast({
          title: '设备连接成功',
          icon: 'success'
        });
        // 更新步骤状态
        completedSteps.value[2] = true;
      } catch (error) {
        console.error('连接失败:', error);
        uni.showToast({
          title: '连接失败，请重试',
          icon: 'none'
        });
      }
    };

    // 组件卸载时清理
    onUnmounted(() => {
      bluetoothService.stopDeviceDiscovery();
      bluetoothService.disconnect();
    });

    onMounted(() => {
      initBluetooth();
    });

    // 添加时间状态
    const time = ref(0);

    // 添加格式化时间的函数
    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return {
      steps,
      completedSteps,
      deviceConnected,
      isCheckingDevice,
      canProceed,
      buttonText,
      toggleStep,
      proceedToNext,
      isScanning,
      deviceList,
      connectDevice,
      time,
      formatTime,
    };
  }
});
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
</style> 