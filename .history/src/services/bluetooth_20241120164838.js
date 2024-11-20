class BluetoothService {
  // ... existing code ...

  // 添加心率带的常量
  static HEART_RATE_SERVICE_UUID = "0000180d-0000-1000-8000-00805f9b34fb"
  static HEART_RATE_MEASUREMENT_UUID = "00002a37-0000-1000-8000-00805f9b34fb"
  static HEART_RATE_MAC_ADDRESS = "D0:A4:69:B6:8F:A2"

  async connectHeartRateBelt() {
    try {
      console.log('开始连接心率带...')
      // 检查蓝牙是否可用
      if (!this.bluetooth) {
        console.error('蓝牙不可用')
        throw new Error('Bluetooth not available')
      }

      console.log('请求蓝牙设备...')
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BluetoothService.HEART_RATE_SERVICE_UUID] },
          { address: BluetoothService.HEART_RATE_MAC_ADDRESS }
        ]
      })

      console.log('设备已选择，正在连接...')
      const server = await device.gatt.connect()
      console.log('已连接到 GATT 服务器')
      
      const service = await server.getPrimaryService(BluetoothService.HEART_RATE_SERVICE_UUID)
      console.log('已获取心率服务')
      
      const characteristic = await service.getCharacteristic(BluetoothService.HEART_RATE_MEASUREMENT_UUID)
      console.log('已获取心率特征值')

      // 订阅心率数据通知
      await characteristic.startNotifications()
      console.log('已开启通知')
      
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value
        const heartRate = value.getUint8(1)
        console.log('收到心率数据:', heartRate)
        this.onHeartRateChanged?.(heartRate)
      })

      this.isConnected = true
      console.log('心率带连接成功')
      return true
    } catch (error) {
      console.error('连接心率带失败:', error)
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