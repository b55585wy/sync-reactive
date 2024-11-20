export const initializeBluetooth = async () => {
  try {
    await uni.openBluetoothAdapter()
    return true
  } catch (error) {
    console.error('蓝牙初始化失败:', error)
    return false
  }
}

export const startDeviceDiscovery = async () => {
  try {
    await uni.startBluetoothDevicesDiscovery({
      services: ['你的设备服务UUID'],
      allowDuplicatesKey: false,
    })
    return true
  } catch (error) {
    console.error('设备搜索失败:', error)
    return false
  }
} 