<template>
  <div class="device-connect">
    <div class="header">
      <text class="title">连接设备</text>
      <text class="close" @click="handleClose">×</text>
    </div>

    <!-- 搜索状态 -->
    <div class="search-status">
      <text>{{ isScanning ? '正在搜索设备...' : '未找到设备' }}</text>
      <button 
        class="refresh-btn" 
        @click="startScan"
        :disabled="isScanning"
      >
        刷新
      </button>
    </div>

    <!-- 设备列表 -->
    <div class="device-list">
      <div 
        v-for="device in deviceList" 
        :key="device.deviceId"
        class="device-item"
        @click="connectDevice(device)"
      >
        <image class="device-icon" src="/static/icons/device.png" />
        <div class="device-info">
          <text class="device-name">{{ device.name || '未知设备' }}</text>
          <text class="device-id">{{ device.deviceId }}</text>
        </div>
        <text class="connect-status">
          {{ device.connecting ? '连接中...' : '点击连接' }}
        </text>
      </div>
    </div>

    <!-- 提示信息 -->
    <div class="tips">
      <text>提示：</text>
      <text>1. 请确保设备电量充足</text>
      <text>2. 保持设备在手机附近</text>
      <text>3. 确保蓝牙已开启</text>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { BluetoothService } from '@/services/bluetooth';

export default defineComponent({
  setup() {
    const bluetoothService = BluetoothService.getInstance();
    const isScanning = ref(false);
    const deviceList = ref<any[]>([]);

    // 初始化蓝牙
    const initBluetooth = async () => {
      try {
        await bluetoothService.initBluetooth();
        startScan();
      } catch (error) {
        console.error('蓝牙初始化失败:', error);
        uni.showToast({
          title: '请开启蓝牙',
          icon: 'none'
        });
      }
    };

    // 开始扫描
    const startScan = async () => {
      isScanning.value = true;
      deviceList.value = []; // 清空列表
      
      try {
        await bluetoothService.startDeviceDiscovery();
        
        // 监听发现设备
        uni.onBluetoothDeviceFound((result) => {
          const device = result.devices[0];
          // 过滤设备（根据实际设备特征修改）
          if (device.name && device.name.includes('呼吸带')) {
            // 检查是否已存在
            if (!deviceList.value.some(d => d.deviceId === device.deviceId)) {
              deviceList.value.push({
                ...device,
                connecting: false
              });
            }
          }
        });

        // 30秒后停止扫描
        setTimeout(() => {
          stopScan();
        }, 30000);
      } catch (error) {
        console.error('扫描失败:', error);
        uni.showToast({
          title: '扫描失败',
          icon: 'none'
        });
      }
    };

    // 停止扫描
    const stopScan = async () => {
      if (isScanning.value) {
        isScanning.value = false;
        await bluetoothService.stopDeviceDiscovery();
      }
    };

    // 连接设备
    const connectDevice = async (device: any) => {
      if (device.connecting) return;
      
      try {
        // 更新状态
        device.connecting = true;
        
        await bluetoothService.connectDevice(device.deviceId);
        
        uni.showToast({
          title: '连接成功',
          icon: 'success'
        });

        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          uni.navigateBack();
          // 如果需要直接进入准备页面
          uni.navigateTo({
            url: '/pages/breathing/prepare'
          });
        }, 1500);
      } catch (error) {
        console.error('连接失败:', error);
        uni.showToast({
          title: '连接失败',
          icon: 'none'
        });
      } finally {
        device.connecting = false;
      }
    };

    // 关闭页面
    const handleClose = () => {
      stopScan();
      uni.navigateBack();
    };

    onMounted(() => {
      initBluetooth();
    });

    onUnmounted(() => {
      stopScan();
    });

    return {
      isScanning,
      deviceList,
      startScan,
      connectDevice,
      handleClose
    };
  }
});
</script>

<style scoped>
.device-connect {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.close {
  font-size: 24px;
  padding: 10px;
}

.search-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.refresh-btn {
  padding: 5px 15px;
  font-size: 14px;
}

.device-list {
  margin-bottom: 20px;
}

.device-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.device-icon {
  width: 40px;
  height: 40px;
  margin-right: 15px;
}

.device-info {
  flex: 1;
}

.device-name {
  font-size: 16px;
  margin-bottom: 5px;
}

.device-id {
  font-size: 12px;
  color: #666;
}

.connect-status {
  color: #4a90e2;
  font-size: 14px;
}

.tips {
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.tips text {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}
</style> 