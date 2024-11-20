<template>
  <div class="device-manager">
    <div class="device-list">
      <div v-for="device in devices" :key="device.id" class="device-item">
        <img :src="device.icon" class="device-icon" />
        <div class="device-info">
          <span class="device-name">{{ device.name }}</span>
          <span class="device-status" :class="device.status">
            {{ device.status }}
          </span>
        </div>
        <button class="device-action" @click="handleDeviceAction(device)">
          {{ getActionText(device) }}
        </button>
      </div>
    </div>
    
    <button class="add-device" @click="startPairing">
      添加新设备
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDeviceStore } from '@/store/device'
import { Device } from '@/types'

const deviceStore = useDeviceStore()
const devices = ref<Device[]>([])

const startPairing = async () => {
  try {
    await deviceStore.startBluetoothDiscovery()
    // 显示配对弹窗
  } catch (error) {
    uni.showToast({
      title: '蓝牙初始化失败',
      icon: 'none'
    })
  }
}
</script> 