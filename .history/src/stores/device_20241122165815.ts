import { defineStore } from 'pinia';
import bluetoothService from '@/services/BluetoothService';

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
    },
    
    async connectHeartRateBand() {
      try {
        await bluetoothService.connectHeartRateBand();
        this.isHeartRateBandConnected = true;
      } catch (error) {
        console.error('连接心率带失败:', error);
        throw error;
      }
    },
    
    async connectBreathingBand() {
      try {
        await bluetoothService.connectBreathingBand();
        this.isBreathingBandConnected = true;
      } catch (error) {
        console.error('连接呼吸带失败:', error);
        throw error;
      }
    },
    
    async disconnectHeartRateBand() {
      try {
        await bluetoothService.disconnectHeartRateBand();
        this.isHeartRateBandConnected = false;
      } catch (error) {
        console.error('断开心率带失败:', error);
        throw error;
      }
    },
    
    async disconnectBreathingBand() {
      try {
        await bluetoothService.disconnectBreathingBand();
        this.isBreathingBandConnected = false;
      } catch (error) {
        console.error('断开呼吸带失败:', error);
        throw error;
      }
    }
  }
}); 