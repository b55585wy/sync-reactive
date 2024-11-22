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
    this.deviceStore = useDeviceStore()
    
    // 添加页面可见性变化监听
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    // 添加页面关闭前的监听
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this))
  }

  // 处理页面可见性变化
  handleVisibilityChange() {
    if (document.visibilityState === 'visible' && this.device.value && !this.isConnected.value) {
      // 页面重新可见时，尝试重新连接
      this.reconnectDevice()
    }
  }

  // 处理页面关闭前的操作
  handleBeforeUnload(event) {
    if (this.isConnected.value) {
      // 提示用户有正在连接的设备
      event.preventDefault()
      event.returnValue = '有设备正在连接，确定要离开吗？'
      return event.returnValue
    }
  }

  // 重新连接设备
  async reconnectDevice() {
    if (this.device.value && !this.isConnected.value) {
      try {
        const server = await this.device.value.gatt.connect()
        const service = await server.getPrimaryService('heart_rate')
        this.characteristic = await service.getCharacteristic('heart_rate_measurement')
        
        await this.characteristic.startNotifications()
        this.characteristic.addEventListener('characteristicvaluechanged', this.handleHeartRateChange.bind(this))
        
        this.isConnected.value = true
        this.deviceStore.setHeartRateBandConnected(true)
        ElMessage.success('设备重新连接成功')
      } catch (error) {
        console.error('重新连接失败:', error)
        ElMessage.error('重新连接失败，请手动重新连接设备')
      }
    }
  }

  async connectHeartRateBand() {
    try {
      if (this.isConnected.value) {
        return true
      }

      // 添加选项以保持窗口打开
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
        ],
        optionalServices: ['battery_service'],
        keepRepeated: true, // 保持设备选择窗口打开
        acceptAllDevices: false // 不接受所有设备，只接受指定服务的设备
      })

      console.log('找到设备:', bluetoothDevice.name)
      
      // 添加连接超时处理
      const connectPromise = bluetoothDevice.gatt.connect()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('连接超时')), 10000) // 10秒超时
      })
      
      const server = await Promise.race([connectPromise, timeoutPromise])
      const service = await server.getPrimaryService('heart_rate')
      this.characteristic = await service.getCharacteristic('heart_rate_measurement')
      
      await this.characteristic.startNotifications()
      this.characteristic.addEventListener('characteristicvaluechanged', this.handleHeartRateChange.bind(this))

      this.device.value = bluetoothDevice
      this.isConnected.value = true
      
      bluetoothDevice.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this))

      this.deviceStore.setHeartRateBandConnected(true)
      ElMessage.success('心率带连接成功')
      return true

    } catch (error) {
      console.error('连接心率带失败:', error)
      ElMessage.error('连接心率带失败: ' + (error.message || '请确保设备已开启并在范围内'))
      return false
    }
  }

  handleHeartRateChange(event) {
    const value = event.target.value
    const heartRateValue = value.getUint8(1)
    this.heartRate.value = heartRateValue
    this.deviceStore.setCurrentHeartRate(heartRateValue)
    console.log('当前心率:', heartRateValue)
  }

  handleDisconnection() {
    console.log('设备已断开连接')
    this.isConnected.value = false
    this.heartRate.value = 0
    this.deviceStore.setHeartRateBandConnected(false)
    this.deviceStore.setCurrentHeartRate(0)
    
    // 自动重连尝试
    if (document.visibilityState === 'visible') {
      ElMessage.warning('设备已断开连接，正在尝试重新连接...')
      this.reconnectDevice()
    } else {
      ElMessage.warning('设备已断开连接')
    }
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

  // 在组件销毁时清理监听器
  destroy() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    if (this.device.value?.gatt?.connected) {
      this.disconnectHeartRateBand()
    }
  }
}

export default BluetoothService 