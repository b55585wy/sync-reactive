import { defineStore } from 'pinia';
import BluetoothService from '@/services/BluetoothService'

export const useDeviceStore = defineStore('device', {
  state: () => ({
    currentHeartRate: 0,
    isHeartRateBandConnected: false,
    heartRateHistory: [] as number[]
  }),

  actions: {
    setCurrentHeartRate(rate: number) {
      console.log('Store更新心率:', rate);
      this.currentHeartRate = rate;
      this.heartRateHistory.push(rate);
      
      // 触发事件通知
      window.dispatchEvent(new CustomEvent('heartRateUpdate', {
        detail: { rate }
      }));
    },

    setHeartRateBandConnected(connected: boolean) {
      console.log('Store更新连接状态:', connected);
      this.isHeartRateBandConnected = connected;
    }
  }
}); 