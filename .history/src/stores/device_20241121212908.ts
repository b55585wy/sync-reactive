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
    async connectDevice(type: '') {
      // 实现设备连接逻辑
      await this.fetchDeviceInfo();
      // 更新 store 状态
    if (type === 'breathing') {
      deviceStore.setBreathingBandStatus(true);
    } else {
      deviceStore.setHeartRateBandStatus(true);
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