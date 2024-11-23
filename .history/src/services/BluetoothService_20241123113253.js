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
      // 检查蓝牙API是否可用
      if (!navigator.bluetooth) {
        throw new Error('此浏览器不支持蓝牙功能');
      }

      if (this.isConnected.value) {
        return true;
      }

      console.log('开始扫描设备...');
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { 
            // 修改这里：使用更通用的服务UUID格式
            services: ['heart_rate']
          }
        ],
        // 添加所有可能需要的服务
        optionalServices: ['battery_service', 'device_information']
      });

      console.log('设备信息:', {
        name: bluetoothDevice.name,
        id: bluetoothDevice.id,
        gatt: bluetoothDevice.gatt
      });

      const server = await bluetoothDevice.gatt.connect();
      console.log('GATT服务器已连接');

      // 列出所有可用的服务
      const services = await server.getPrimaryServices();
      console.log('可用服务列表:', services.map(s => s.uuid));

      const service = await server.getPrimaryService('heart_rate');
      console.log('已获取心率服务:', service.uuid);

      // 列出服务的所有特征值
      const characteristics = await service.getCharacteristics();
      console.log('可用特征值列表:', characteristics.map(c => c.uuid));

      this.characteristic = await service.getCharacteristic('heart_rate_measurement');
      console.log('已获取心率特征值:', this.characteristic.uuid);

      // 检查特征值的属性
      console.log('特征值属性:', {
        notify: this.characteristic.properties.notify,
        read: this.characteristic.properties.read,
        write: this.characteristic.properties.write
      });

      await this.characteristic.startNotifications();
      console.log('已启动通知');

      this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
        console.log('收到原始数据:', event.target.value);
        console.log('数据缓冲区:', new Uint8Array(event.target.value.buffer));
        
        const value = event.target.value;
        const flags = value.getUint8(0);
        let heartRate;
        
        if (flags & 0x01) {
          heartRate = value.getUint16(1, true);
          console.log('16位心率值:', heartRate);
        } else {
          heartRate = value.getUint8(1);
          console.log('8位心率值:', heartRate);
        }

        console.log('解析后的心率:', heartRate);
        this.heartRate.value = heartRate;
        this.deviceStore.setCurrentHeartRate(heartRate);
      });

      this.device.value = bluetoothDevice
      this.isConnected.value = true
      
      // 添加断开连接监听器
      bluetoothDevice.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this))

      this.deviceStore.setHeartRateBandConnected(true)
      ElMessage.success('心率带连接成功')
      return true

    } catch (error) {
      console.error('连接过程中的详细错误:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      throw error;
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