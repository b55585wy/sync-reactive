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
    ElMessage.warning('设备已断开连接')
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
}

export default BluetoothService 