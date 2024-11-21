import { defineStore } from 'pinia';

export const useDeviceStore = defineStore('device', {
  state: () => ({
    isBreathingBandConnected: false,
    isHeartRateBandConnected: false,
    lastConnectedDevice: null as string | null,
  }),
  
  getters: {
    hasAnyDeviceConnected: (state) => 
      state.isBreathingBandConnected || state.isHeartRateBandConnected,
      
    availableFeatures: (state) => {
      const features = [];
      
      if (state.isBreathingBandConnected) {
        features.push(
          { id: 'guided-breathing', name: '引导式呼吸', requiresDevice: 'breathing' },
          { id: 'box-breathing', name: '箱式呼吸', requiresDevice: 'breathing' },
          // ... 其他呼吸相关功能
        );
      }
      
      if (state.isHeartRateBandConnected) {
        features.push(
          { id: 'heart-monitor', name: '心率监测', requiresDevice: 'heartRate' },
          { id: 'hrv-analysis', name: 'HRV分析', requiresDevice: 'heartRate' },
          // ... 其他心率相关功能
        );
      }
      
      if (state.isBreathingBandConnected && state.isHeartRateBandConnected) {
        features.push(
          { id: 'coherence', name: '心肺协调训练', requiresDevice: 'both' },
          { id: 'meditation', name: '冥想指导', requiresDevice: 'both' },
          // ... 其他双设备功能
        );
      }
      
      return features;
    }
  },
  
  actions: {
    setDeviceConnection(type: 'breathing' | 'heartRate', connected: boolean) {
      if (type === 'breathing') {
        this.isBreathingBandConnected = connected;
      } else {
        this.isHeartRateBandConnected = connected;
      }
      
      if (connected) {
        this.lastConnectedDevice = type;
      }
    }
  }
}); 