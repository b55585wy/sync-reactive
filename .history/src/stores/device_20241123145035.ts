import { defineStore } from 'pinia';
import BluetoothService from '@/services/BluetoothService'

export const useDeviceStore = defineStore('device', {
  state: () => ({
    isHeartRateBandConnected: false,
    isBreathingBandConnected: false,
    currentHeartRate: 0,
    currentBreathingRate: 0,
    connectedDevices: [],
    lastConnectedDeviceIds: JSON.parse(localStorage.getItem('lastConnectedDevices') || '[]')
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
      console.log('DeviceStore 更新心率:', rate);
    },

    setCurrentBreathingRate(rate: number) {
      this.currentBreathingRate = rate;
    },

    async initializeDevices() {
      if (this.lastConnectedDeviceIds.length > 0) {
        for (const deviceId of this.lastConnectedDeviceIds) {
          const device = await BluetoothService.getDeviceById(deviceId);
          if (device) {
            this.connectedDevices.push(device);
          }
        }
      }
    }
  },

  getters: {
    hasAnyDeviceConnected: (state) => 
      state.isHeartRateBandConnected || state.isBreathingBandConnected
  }
}); 