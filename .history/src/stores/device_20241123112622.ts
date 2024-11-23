import { defineStore } from 'pinia';
import BluetoothService from '@/services/BluetoothService'
import { ElMessage } from 'element-plus'

interface DeviceState {
  isHeartRateBandConnected: boolean
  isBreathingBandConnected: boolean
  currentHeartRate: number
  currentBreathingRate: number
  lastUpdateTime: number
}

export const useDeviceStore = defineStore('device', {
  state: (): DeviceState => ({
    isHeartRateBandConnected: false,
    isBreathingBandConnected: false,
    currentHeartRate: 0,
    currentBreathingRate: 0,
    lastUpdateTime: 0
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
    },

    async connectHeartRateBand() {
      if (this.isHeartRateBandConnected) return

      try {
        // 模拟设备连接
        await new Promise(resolve => setTimeout(resolve, 1000))
        this.isHeartRateBandConnected = true
        
        // 开始模拟心率数据更新
        this.startHeartRateSimulation()
        
        ElMessage.success('心率带连接成功')
      } catch (error) {
        console.error('连接心率带失败:', error)
        ElMessage.error('连接心率带失败')
        throw error
      }
    },

    async disconnectHeartRateBand() {
      if (!this.isHeartRateBandConnected) return

      try {
        // 停止心率数据模拟
        this.stopHeartRateSimulation()
        
        // 模拟设备断开
        await new Promise(resolve => setTimeout(resolve, 1000))
        this.isHeartRateBandConnected = false
        this.currentHeartRate = 0
        
        ElMessage.success('心率带已断开连接')
      } catch (error) {
        console.error('断开心率带失败:', error)
        ElMessage.error('断开心率带失败')
        throw error
      }
    },

    // 模拟心率数据更新
    private heartRateInterval: number | null = null
  },

  getters: {
    hasAnyDeviceConnected: (state) => 
      state.isHeartRateBandConnected || state.isBreathingBandConnected
  }
}); 