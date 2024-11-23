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

    // 定义服务和特征值 UUID
    this.HEART_RATE_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb'
    this.HEART_RATE_MEASUREMENT_UUID = '00002a37-0000-1000-8000-00805f9b34fb'
  }

  async connectHeartRateBand() {
    try {
      if (this.isConnected.value) {
        return true
      }

      // 扫描并连接设备
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { 
            services: [this.HEART_RATE_SERVICE_UUID],
            // 如果知道设备名称，可以添加名称过滤
            // name: 'Your Device Name'
          }
        ],
        optionalServices: ['battery_service']
      })

      console.log('找到设备:', bluetoothDevice.name, bluetoothDevice.id)
      
      // 连接到 GATT 服务器
      const server = await bluetoothDevice.gatt.connect()
      console.log('已连接到 GATT 服务器')

      // 获取心率服务
      const service = await server.getPrimaryService(this.HEART_RATE_SERVICE_UUID)
      console.log('已获取心率服务')

      // 获取心率特征值
      this.characteristic = await service.getCharacteristic(this.HEART_RATE_MEASUREMENT_UUID)
      console.log('已获取心率特征值')
      
      // 启动通知
      await this.characteristic.startNotifications()
      console.log('已启动通知')

      // 添加特征值变化监听器
      this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value
        // 解析心率数据
        const flags = value.getUint8(0)
        let heartRate
        if (flags & 0x01) { // 检查心率值格式标志
          heartRate = value.getUint16(1, true) // 16位心率值
        } else {
          heartRate = value.getUint8(1) // 8位心率值
        }
        
        console.log('收到心率数据:', heartRate)
        this.heartRate.value = heartRate
        this.deviceStore.setCurrentHeartRate(heartRate)
      })

      this.device.value = bluetoothDevice
      this.isConnected.value = true
      
      // 添加断开连接监听器
      bluetoothDevice.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this))

      this.deviceStore.setHeartRateBandConnected(true)
      ElMessage.success('心率带连接成功')
      return true

    } catch (error) {
      console.error('连接心率带失败:', error)
      ElMessage.error('连接心率带失败: ' + error.message)
      return false
    }
  }

  async disconnectHeartRateBand() {
    if (this.device.value?.gatt?.connected) {
      try {
        // 停止通知
        if (this.characteristic) {
          await this.characteristic.stopNotifications()
          console.log('已停止通知')
        }

        // 断开连接
        await this.device.value.gatt.disconnect()
        console.log('已断开设备连接')

        this.device.value = null
        this.heartRate.value = 0
        this.isConnected.value = false
        this.characteristic = null
        
        this.deviceStore.setHeartRateBandConnected(false)
        this.deviceStore.setCurrentHeartRate(0)
        
        ElMessage.success('心率带已断开连接')
      } catch (error) {
        console.error('断开心率带连接失败:', error)
        ElMessage.error('断开心率带连接失败')
      }
    }
  }

  handleDisconnection() {
    console.log('设备已断开连接')
    this.isConnected.value = false
    this.heartRate.value = 0
    this.deviceStore.setHeartRateBandConnected(false)
    this.deviceStore.setCurrentHeartRate(0)
    ElMessage.warning('设备已断开连接')
    
    // 可以选择是否自动重连
    if (this.shouldAutoReconnect) {
      this.tryReconnect()
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

  async reconnectDevice(deviceId) {
    try {
      // 尝试直接连接已知设备
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service'],
        deviceId // 指定设备ID
      });
      
      await this.connectToDevice(device);
      return true;
    } catch (error) {
      console.error('重新连接设备失败:', error);
      return false;
    }
  }

  async connectToDevice(device) {
    const server = await device.gatt.connect();
    // ... 连接逻辑 ...
  }
}

export default BluetoothService 