import { defineStore } from 'pinia';

export const useDeviceStore = defineStore('device', {
  state: () => ({
    isHeartRateBandConnected: false,
    isBreathingBandConnected: false,
    currentHeartRate: 0
  }),

  actions: {
    setHeartRateBandConnected(status: boolean) {
      this.isHeartRateBandConnected = status;
    },

    setBreathingBandConnected(status: boolean) {
      this.isBreathingBandConnected = status;
    },

    setCurrentHeartRate(rate: number) {
      this.currentHeartRate = rate;
    }
  }
}); 