import { defineStore } from 'pinia';

export const useDeviceStore = defineStore('device', {
  state: () => ({
    isHeartRateBandConnected: false,
    isBreathingBandConnected: false,
    currentHeartRate: 0,
    currentBreathingRate: 0
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
    },

    setCurrentBreathingRate(rate: number) {
      this.currentBreathingRate = rate;
    }
  },

  getters: {
    hasAnyDeviceConnected: (state) => 
      state.isHeartRateBandConnected || state.isBreathingBandConnected
  }
}); 