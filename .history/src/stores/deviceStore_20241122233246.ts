import { defineStore } from 'pinia';
import BluetoothService from '@/services/BluetoothService';

export const useDeviceStore = defineStore('device', {
  state: () => ({
    isBreathingBandConnected: false,
    isHeartRateBandConnected: false,
    connectedDevices: [], // 存储已连接设备的详细信息
    lastConnectedDeviceIds: JSON.parse(localStorage.getItem('lastConnectedDevices') || '[]')
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
    async initializeDevices() {
      if (this.lastConnectedDeviceIds.length > 0) {
        try {
          const bluetoothService = new BluetoothService();
          // 尝试重新连接上次连接的设备
          for (const deviceId of this.lastConnectedDeviceIds) {
            await bluetoothService.reconnectDevice(deviceId);
          }
        } catch (error) {
          console.error('重新连接设备失败:', error);
        }
      }
    },

    setDeviceConnection(type: 'breathing' | 'heartRate', connected: boolean, deviceInfo?: any) {
      if (type === 'breathing') {
        this.isBreathingBandConnected = connected;
      } else {
        this.isHeartRateBandConnected = connected;
      }

      if (connected && deviceInfo) {
        this.connectedDevices.push({
          id: deviceInfo.id,
          name: deviceInfo.name,
          type,
          connectionTime: new Date().toISOString()
        });
        
        // 保存设备ID到本地存储
        this.lastConnectedDeviceIds = this.connectedDevices.map(d => d.id);
        localStorage.setItem('lastConnectedDevices', JSON.stringify(this.lastConnectedDeviceIds));
      } else {
        // 移除断开连接的设备
        this.connectedDevices = this.connectedDevices.filter(d => d.type !== type);
        this.lastConnectedDeviceIds = this.connectedDevices.map(d => d.id);
        localStorage.setItem('lastConnectedDevices', JSON.stringify(this.lastConnectedDeviceIds));
      }
    }
  }
}); 