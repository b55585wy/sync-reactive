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

  getDeviceStore() {
    return useDeviceStore()
  }

  async connectHeartRateBand() {
    try {
      const deviceStore = this.getDeviceStore()

      if (this.isConnected.value) {
        return true
      }

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
      
      bluetoothDevice.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this))

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
    const deviceStore = this.getDeviceStore()
    const value = event.target.value
    const heartRateValue = value.getUint8(1)
    this.heartRate.value = heartRateValue
    deviceStore.setCurrentHeartRate(heartRateValue)
    console.log('当前心率:', heartRateValue)
  }

  handleDisconnection() {
    const deviceStore = this.getDeviceStore()
    console.log('设备已断开连接')
    this.isConnected.value = false
    this.heartRate.value = 0
    deviceStore.setHeartRateBandConnected(false)
    deviceStore.setCurrentHeartRate(0)
    ElMessage.warning('设备已断开连接')
  }

  async disconnectHeartRateBand() {
    if (this.device.value?.gatt?.connected) {
      try {
        await this.device.value.gatt.disconnect()
        this.device.value = null
        this.heartRate.value = 0
        this.isConnected.value = false
        this.deviceStore.setHeartRateBandConnected(false)
        this.deviceStore.setCurrentHeartRate(0)
        ElMessage.success('心率带已断开连接')
      } catch (error) {
        console.error('断开心率带连接失败:', error)
        ElMessage.error('断开心率带连接失败')
      }
    }
  }

  getConnectionStatus() {
    return this.isConnected.value
  }

  getHeartRate() {
    return this.heartRate.value
  }

  static getInstance() {
    if (!BluetoothService.instance) {
      BluetoothService.instance = new BluetoothService()
    }
    return BluetoothService.instance
  }
}

export default BluetoothService 