import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useDeviceStore } from '@/stores/device'

// 定义完整的 UUID
const BREATHING_SERVICE_UUID = '000000ff-0000-1000-8000-00805f9b34fb'
const BREATHING_CHAR_UUID = '0000ff01-0000-1000-8000-00805f9b34fb'
const BATTERY_UUID = '0000ff02-0000-1000-8000-00805f9b34fb'
const WRITE_UUID = '0000ff03-0000-1000-8000-00805f9b34fb'
const ENCODER_READ_UUID = '0000ff04-0000-1000-8000-00805f9b34fb'
const MOTOR_I_READ_UUID = '0000ff05-0000-1000-8000-00805f9b34fb'

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
    this.breathingRate = ref(0)
    this.breathingCharacteristic = null
  }

  async connectHeartRateBand() {
    try {
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

      this.deviceStore.setHeartRateBandConnected(true)
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
    this.deviceStore.setCurrentHeartRate(heartRateValue)
    console.log('当前心率:', heartRateValue)
  }

  handleDisconnection() {
    console.log('设备已断开连接')
    this.isConnected.value = false
    this.heartRate.value = 0
    this.deviceStore.setHeartRateBandConnected(false)
    this.deviceStore.setCurrentHeartRate(0)
    
    // 尝试重连
    setTimeout(async () => {
      await this.reconnectDevice()
    }, 1000)
  }

  async disconnectHeartRateBand() {
    if (this.device.value?.gatt?.connected) {
      try {
        await this.device.value.gatt.disconnect();
        this.device.value = null;
        this.heartRate.value = 0;
        this.isConnected.value = false;
        this.deviceStore.setHeartRateBandConnected(false);
        this.deviceStore.setCurrentHeartRate(0);
        
        // 清理事件监听器
        if (this.characteristic) {
          this.characteristic.removeEventListener('characteristicvaluechanged', this.handleHeartRateChange);
          this.characteristic = null;
        }
        
        ElMessage.success('心率带已断开连接');
      } catch (error) {
        console.error('断开心率带连接失败:', error);
        ElMessage.error('断开心率带连接失败');
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

  async reconnectDevice() {
    try {
      console.log('尝试重新连接设备...');
      await this.connectHeartRateBand();
      return true;
    } catch (error) {
      console.error('重连失败:', error);
      return false;
    }
  }

  async connectBreathingBand() {
    try {
      console.log('开始搜索呼吸带 SYNC...')
      
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { 
            name: 'SYNC'
          }
        ],
        // 添加所有需要的服务
        optionalServices: [
          BREATHING_SERVICE_UUID,
          BREATHING_CHAR_UUID,
          BATTERY_UUID,
          WRITE_UUID,
          ENCODER_READ_UUID,
          MOTOR_I_READ_UUID
        ]
      })

      console.log('找到SYNC设备:', bluetoothDevice.name)
      
      const server = await bluetoothDevice.gatt.connect()
      console.log('GATT服务器已连接')
      
      // 获取主服务
      const service = await server.getPrimaryService(BREATHING_SERVICE_UUID)
      console.log('获取到主服务')

      // 获取各个特征
      const breathingChar = await service.getCharacteristic(BREATHING_CHAR_UUID)
      const batteryChar = await service.getCharacteristic(BATTERY_UUID)
      const writeChar = await service.getCharacteristic(WRITE_UUID)
      const encoderChar = await service.getCharacteristic(ENCODER_READ_UUID)
      const motorIChar = await service.getCharacteristic(MOTOR_I_READ_UUID)
      
      console.log('获取到所有特征')

      // 开始监听数据
      await breathingChar.startNotifications()
      breathingChar.addEventListener(
        'characteristicvaluechanged',
        this.handleBreathingChange.bind(this)
      )

      // 存储特征以供后续使用
      this.breathingCharacteristic = breathingChar
      this.writeCharacteristic = writeChar

      // 发送启动命令
      await writeChar.writeValue(new Uint8Array([0x01, 0x01, 0x01]))
      console.log('发送启动命令')

      this.deviceStore.setBreathingBandConnected(true)
      ElMessage.success('呼吸带连接成功')
      return true

    } catch (error) {
      console.error('连接呼吸带失败:', error)
      ElMessage.error('连接呼吸带失败: ' + error.message)
      throw error
    }
  }

  handleBreathingChange(event) {
    const value = event.target.value
    const breathingValue = this.parseBreathingData(value) // 解析呼吸数据
    this.breathingRate.value = breathingValue
    this.deviceStore.setCurrentBreathingRate(breathingValue)
  }

  parseBreathingData(value) {
    // 将字节数据转换为浮点数
    const dataView = new DataView(value.buffer)
    return dataView.getFloat32(0, true) // 使用小端序读取
  }

  async disconnectBreathingBand() {
    if (this.breathingCharacteristic) {
      try {
        // 发送停止命令
        const cmdService = await this.device.value.gatt.getPrimaryService('FF03')
        const cmdChar = await cmdService.getCharacteristic('FF03')
        await cmdChar.writeValue(new Uint8Array([0x01, 0x00, 0x01])) // 停止命令

        // 清理连接
        await this.breathingCharacteristic.stopNotifications()
        this.breathingCharacteristic = null
        this.deviceStore.setBreathingBandConnected(false)
        this.deviceStore.setCurrentBreathingRate(0)
        
        ElMessage.success('呼吸带已断开连接')
      } catch (error) {
        console.error('断开呼吸带失败:', error)
        ElMessage.error('断开呼吸带失败')
      }
    }
  }
}

export default BluetoothService 