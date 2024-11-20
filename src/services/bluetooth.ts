import { ref } from 'vue'

export class BluetoothService {
  private device: any = null
  private characteristic: any = null
  private isConnecting = ref(false)
  private isConnected = ref(false)
  
  // 蓝牙服务 UUID
  private readonly SERVICE_UUID = '0000FFE0-0000-1000-8000-00805F9B34FB'
  private readonly CHAR_UUID = '0000FFE1-0000-1000-8000-00805F9B34FB'

  async connect() {
    if (this.isConnecting.value) return
    
    try {
      this.isConnecting.value = true
      
      // 请求蓝牙设备
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [this.SERVICE_UUID] },
          { namePrefix: 'Breath' }
        ]
      })

      // 连接设备
      const server = await device.gatt.connect()
      
      // 获取服务
      const service = await server.getPrimaryService(this.SERVICE_UUID)
      
      // 获取特征值
      this.characteristic = await service.getCharacteristic(this.CHAR_UUID)
      
      // 启动通知
      await this.characteristic.startNotifications()
      
      // 监听数据
      this.characteristic.addEventListener('characteristicvaluechanged', 
        this.handleValueChange.bind(this))
      
      this.device = device
      this.isConnected.value = true
      
      return true
    } catch (error) {
      console.error('蓝牙连接失败:', error)
      throw error
    } finally {
      this.isConnecting.value = false
    }
  }

  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect()
    }
    this.isConnected.value = false
    this.device = null
    this.characteristic = null
  }

  private handleValueChange(event: any) {
    const value = event.target.value
    const data = new Uint8Array(value.buffer)
    // 处理接收到的数据
    this.processData(data)
  }

  private processData(data: Uint8Array) {
    // 解析数据包
    // 示例: [命令字, 数据长度, ...数据]
    const cmd = data[0]
    const length = data[1]
    const payload = data.slice(2, 2 + length)

    switch (cmd) {
      case 0x01: // 呼吸数据
        this.handleBreathingData(payload)
        break
      case 0x02: // 设备状态
        this.handleDeviceStatus(payload)
        break
      // ... 其他命令处理
    }
  }

  private handleBreathingData(data: Uint8Array) {
    // 处理呼吸数据
    const value = new DataView(data.buffer).getFloat32(0, true)
    // 发出数据更新事件
    this.emit('breathingData', value)
  }

  private handleDeviceStatus(data: Uint8Array) {
    // 处理设备状态
    const status = {
      battery: data[0],
      isCharging: Boolean(data[1]),
      error: data[2]
    }
    // 发出状态更新事件
    this.emit('deviceStatus', status)
  }
} 