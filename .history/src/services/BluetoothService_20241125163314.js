import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useDeviceStore } from '@/stores/device'

class BluetoothService {
  // 呼吸带相关常量
  static BREATHING_SERVICE_UUID = "FF01"
  static BREATHING_WRITE_UUID = "FF03"
  static BREATHING_READ_UUID = "FF02"
  
  // 命令定义
  static CMD = {
    TYPE: {
      MOTOR: 0x01
    },
    APP: {
      BREATHING: 0x01
    },
    ACTION: {
      START: 0x01,
      STOP: 0x00
    }
  }

  // 训练模式定义
  static TRAINING_MODES = {
    BEGINNER: {
      id: 'beginner',
      name: '初级呼吸训练',
      inhaleTime: 4,
      holdTime: 2, 
      exhaleTime: 6,
      cycles: 10
    },
    INTERMEDIATE: {
      id: 'intermediate', 
      name: '中级呼吸训练',
      inhaleTime: 5,
      holdTime: 3,
      exhaleTime: 7,
      cycles: 15
    },
    ADVANCED: {
      id: 'advanced',
      name: '高级呼吸训练',
      inhaleTime: 6,
      holdTime: 4,
      exhaleTime: 8,
      cycles: 20
    },
    RELAXATION: {
      id: 'relaxation',
      name: '放松训练',
      inhaleTime: 4,
      holdTime: 4,
      exhaleTime: 4,
      cycles: 12
    },
    ENERGY: {
      id: 'energy', 
      name: '能量训练',
      inhaleTime: 6,
      holdTime: 2,
      exhaleTime: 4,
      cycles: 15
    }
  }

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
      console.log('开始连接呼吸带...')
      
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BluetoothService.BREATHING_SERVICE_UUID] }
        ],
        optionalServices: [
          BluetoothService.BREATHING_WRITE_UUID,
          BluetoothService.BREATHING_READ_UUID
        ]
      })

      console.log('设备已选择,正在连接...')
      const server = await device.gatt.connect()
      
      // 获取服务和特征
      const service = await server.getPrimaryService(BluetoothService.BREATHING_SERVICE_UUID)
      this.writeCharacteristic = await service.getCharacteristic(BluetoothService.BREATHING_WRITE_UUID)
      this.readCharacteristic = await service.getCharacteristic(BluetoothService.BREATHING_READ_UUID)

      // 订阅数据通知
      await this.readCharacteristic.startNotifications()
      this.readCharacteristic.addEventListener('characteristicvaluechanged', this.handleBreathingData.bind(this))

      this.deviceStore.setBreathingBandConnected(true)
      ElMessage.success('呼吸带连接成功')
      return true

    } catch (error) {
      console.error('连接呼吸带失败:', error)
      ElMessage.error('连接呼吸带失败: ' + error.message)
      return false
    }
  }

  // 开始训练
  async startTraining(mode) {
    try {
      const cmd = new Uint8Array([
        BluetoothService.CMD.TYPE.MOTOR,
        BluetoothService.CMD.ACTION.START,
        BluetoothService.CMD.APP.BREATHING
      ])
      await this.writeCharacteristic.writeValue(cmd)
      
      // 设置训练参数
      const params = BluetoothService.TRAINING_MODES[mode.toUpperCase()]
      await this.setTrainingParams(params)
      
      ElMessage.success('训练开始')
    } catch (error) {
      console.error('开始训练失败:', error)
      throw error
    }
  }

  // 停止训练
  async stopTraining() {
    try {
      const cmd = new Uint8Array([
        BluetoothService.CMD.TYPE.MOTOR,
        BluetoothService.CMD.ACTION.STOP,
        BluetoothService.CMD.APP.BREATHING
      ])
      await this.writeCharacteristic.writeValue(cmd)
      ElMessage.success('训练结束')
    } catch (error) {
      console.error('停止训练失败:', error)
      throw error
    }
  }

  // 处理呼吸数据
  handleBreathingData(event) {
    const value = event.target.value
    const breathingData = new Float32Array(value.buffer)[0]
    this.deviceStore.setCurrentBreathingRate(breathingData)
    console.log('呼吸数据:', breathingData)
  }
}

export default BluetoothService 