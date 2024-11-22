import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useDeviceStore } from '@/stores/device'

class BluetoothService {
  constructor() {
    if (BluetoothService.instance) {
      return BluetoothService.instance
    }
    BluetoothService.instance = this

    this.device = ref(null)
    this.heartRate = ref(0)
    this.isConnected = ref(false)
    this.characteristic = null
  }

  async connectHeartRateBand() {
    try {
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
        ],
        optionalServices: ['battery_service']
      })

      console.log('找到设备:', bluetoothDevice.name)
      
      const server = await bluetoothDevice.gatt.connect()
      const service = await server.getPrimaryService('heart_rate')
      this.characteristic = await service.getCharacteristic('heart_rate_measurement')
      
      await this.characteristic.startNotifications()
      this.characteristic.addEventListener('characteristicvaluechanged', this.handleHeartRateChange.bind(this))

      this.device.value = bluetoothDevice
      this.isConnected.value = true
      
      // 监听设备断开连接
      bluetoothDevice.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this))

      // 更新 store 状态
      const deviceStore = useDeviceStore()
      deviceStore.setHeartRateBandConnected(true)

      ElMessage.success('心率带连接成功')
      return true

    } catch (error) {
      console.error('连接心率带失败:', error)
      ElMessage.error('连接心率带失败: ' + error.message)
      return false
    }
  }

  handleHeartRateChange(event) {
    const value = event.target.value
    const heartRateValue = value.getUint8(1)
    this.heartRate.value = heartRateValue
    console.log('当前心率:', heartRateValue)
  }

  handleDisconnection() {
    console.log('设备已断开连接')
    this.isConnected.value = false
    this.heartRate.value = 0
    
    const deviceStore = useDeviceStore()
    deviceStore.setHeartRateBandConnected(false)
    
    ElMessage.warning('设备已断开连接')
  }

  async disconnectHeartRateBand() {
    if (this.device.value?.gatt?.connected) {
      try {
        await this.device.value.gatt.disconnect()
        this.device.value = null
        this.heartRate.value = 0
        this.isConnected.value = false
        ElMessage.success('心率带已断开连接')
        
        // 更新 store 状态
        const deviceStore = useDeviceStore()
        deviceStore.setHeartRateBandConnected(false)
      } catch (error) {
        console.error('断开心率带连接失败:', error)
        ElMessage.error('断开心率带连接失败')
        throw error
      }
    }
  }

  getConnectionStatus() {
    return this.isConnected.value
  }

  getHeartRate() {
    return this.heartRate.value
  }

  // 单例模式
  static getInstance() {
    if (!BluetoothService.instance) {
      BluetoothService.instance = new BluetoothService()
    }
    return BluetoothService.instance
  }
}

export default BluetoothService 