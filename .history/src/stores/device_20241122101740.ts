import { defineStore } from 'pinia';

export const useDeviceStore = defineStore('device', {
  state: () => ({
    isConnected: false,
    selectedMode: 'smart',
    trainingDuration: 3,
    deviceInfo: null as any,
    isBreathingBandConnected: false,
    isHeartRateBandConnected: false
  }),

  actions: {
    async connectDevice(type: 'breathing' | 'heartRate') {
      const deviceStore = useDeviceStore();
      
      try {
        // 连接设备的逻辑
        await this.connect();
        
        // 更新 store 状态
        if (type === 'breathing') {
          deviceStore.setBreathingBandStatus(true);
        } else {
          deviceStore.setHeartRateBandStatus(true);
        }
        
        return true;
      } catch (error) {
        console.error('连接失败:', error);
        return false;
      }
    },

    async disconnectDevice() {
      // 实现设备断开逻辑
    },

    setTrainingParams(mode: string, duration: number) {
      this.selectedMode = mode;
      this.trainingDuration = duration;
    }
  }
}); 