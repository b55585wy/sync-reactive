class BluetoothService {
  // ... existing code ...

  // 添加心率带的常量
  static HEART_RATE_SERVICE_UUID = "0000180d-0000-1000-8000-00805f9b34fb"
  static HEART_RATE_MEASUREMENT_UUID = "00002a37-0000-1000-8000-00805f9b34fb"
  static HEART_RATE_MAC_ADDRESS = "D0:A4:69:B6:8F:A2"

  async connectHeartRateBelt() {
    try {
      // 检查蓝牙是否可用
      if (!this.bluetooth) {
        throw new Error('Bluetooth not available')
      }

      // 连接到心率带
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BluetoothService.HEART_RATE_SERVICE_UUID] },
          { address: BluetoothService.HEART_RATE_MAC_ADDRESS }
        ]
      })

      const server = await device.gatt.connect()
      const service = await server.getPrimaryService(BluetoothService.HEART_RATE_SERVICE_UUID)
      const characteristic = await service.getCharacteristic(BluetoothService.HEART_RATE_MEASUREMENT_UUID)

      // 订阅心率数据通知
      await characteristic.startNotifications()
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value
        const heartRate = value.getUint8(1)
        console.log('Heart Rate:', heartRate)
        // TODO: 处理心率数据，可以触发事件或调用回调函数
        this.onHeartRateChanged?.(heartRate)
      })

      this.isConnected = true
      return true
    } catch (error) {
      console.error('Failed to connect heart rate belt:', error)
      this.isConnected = false
      throw error
    }
  }

  // 可选：添加断开连接方法
  async disconnectHeartRateBelt() {
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect()
      this.isConnected = false
    }
  }

  // 可选：添加心率数据回调
  setHeartRateCallback(callback) {
    this.onHeartRateChanged = callback
  }
} 