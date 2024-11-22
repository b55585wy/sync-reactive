import { defineStore } from 'pinia';

interface DeviceState {
  isBreathingBandConnected: boolean;
  isHeartRateBandConnected: boolean;
}

export const useDeviceStore = defineStore('device', {
  state: (): DeviceState => ({
    isBreathingBandConnected: false,
    isHeartRateBandConnected: false
  }),

  actions: {
    setHeartRateBandStatus(status: boolean) {
      this.isHeartRateBandConnected = status;
    },
    
    setBreathingBandStatus(status: boolean) {
      this.isBreathingBandConnected = status;
    }
  }
}); 