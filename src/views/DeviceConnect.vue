import { BluetoothService } from '@/services/bluetooth'

export default {
  setup() {
    const bluetoothService = BluetoothService.getInstance()

    const connectHeartRateBelt = async () => {
      try {
        await bluetoothService.connectHeartRateBelt()
        
        // 设置心率数据回调
        bluetoothService.setHeartRateCallback((heartRate) => {
          console.log('收到心率数据:', heartRate)
          // TODO: 更新UI显示心率数据
        })
        
        // 连接成功后的处理
      } catch (error) {
        console.error('连接心率带失败:', error)
        // 显示错误提示
      }
    }

    return {
      connectHeartRateBelt
    }
  }
} 