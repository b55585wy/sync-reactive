<template>
  <div class="settings">
    <header class="settings-header">
      <el-button @click="router.back()" icon="el-icon-arrow-left" plain>
        返回
      </el-button>
      <h1>设置</h1>
    </header>

    <main class="settings-content">
      <!-- 用户设置 -->
      <el-card class="settings-section">
        <template #header>
          <h2>用户设置</h2>
        </template>
        <el-form label-position="left" label-width="120px">
          <el-form-item label="用户名">
            <el-input v-model="userSettings.username" placeholder="请输入用户名"></el-input>
          </el-form-item>
          <el-form-item label="年龄">
            <el-input-number v-model="userSettings.age" :min="1" :max="120"></el-input-number>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 训练设置 -->
      <el-card class="settings-section">
        <template #header>
          <h2>训练设置</h2>
        </template>
        <el-form label-position="left" label-width="120px">
          <el-form-item label="默认训练时长">
            <el-input-number 
              v-model="trainingSettings.defaultDuration" 
              :min="1" 
              :max="60"
            ></el-input-number>
            <span class="unit">分钟</span>
          </el-form-item>
          <el-form-item label="目标心率范围">
            <div class="heart-rate-range">
              <el-input-number 
                v-model="trainingSettings.targetHeartRateMin" 
                :min="40" 
                :max="trainingSettings.targetHeartRateMax"
                @change="validateHeartRateRange"
              ></el-input-number>
              <span>至</span>
              <el-input-number 
                v-model="trainingSettings.targetHeartRateMax" 
                :min="trainingSettings.targetHeartRateMin" 
                :max="200"
                @change="validateHeartRateRange"
              ></el-input-number>
              <span>BPM</span>
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 设备设置 -->
      <el-card class="settings-section">
        <template #header>
          <h2>设备设置</h2>
        </template>
        <el-form label-position="left" label-width="120px">
          <el-form-item label="设备状态">
            <div class="device-info">
              <span>{{ deviceName || '未连接设备' }}</span>
              <el-button 
                :type="isConnected ? 'danger' : 'primary'"
                @click="handleDeviceConnection"
              >
                {{ isConnected ? '断开连接' : '连接设备' }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item v-if="isConnected" label="设备电量">
            <el-progress 
              :percentage="batteryLevel" 
              :status="batteryLevel < 20 ? 'exception' : ''"
            ></el-progress>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 通知设置 -->
      <el-card class="settings-section">
        <template #header>
          <h2>通知设置</h2>
        </template>
        <el-form label-position="left" label-width="120px">
          <el-form-item label="训练提醒">
            <el-switch v-model="notificationSettings.trainingReminder"></el-switch>
          </el-form-item>
          <el-form-item v-if="notificationSettings.trainingReminder" label="提醒时间">
            <el-time-picker v-model="notificationSettings.reminderTime"></el-time-picker>
          </el-form-item>
        </el-form>
      </el-card>
    </main>

    <!-- 保存按钮 -->
    <div class="settings-footer">
      <el-button type="primary" @click="saveSettings" :loading="saving">
      <section class="settings-section">
        <h2>用户设置</h2>
        <div class="setting-item">
          <span>用户名</span>
          <el-input v-model="userSettings.username" placeholder="请输入用户名"></el-input>
        </div>
        <div class="setting-item">
          <span>年龄</span>
          <el-input-number v-model="userSettings.age" :min="1" :max="120"></el-input-number>
        </div>
      </section>

      <!-- 训练设置 -->
      <section class="settings-section">
        <h2>训练设置</h2>
        <div class="setting-item">
          <span>默认训练时长（分钟）</span>
          <el-input-number 
            v-model="trainingSettings.defaultDuration" 
            :min="1" 
            :max="60"
          ></el-input-number>
        </div>
        <div class="setting-item">
          <span>目标心率范围</span>
          <div class="heart-rate-range">
            <el-input-number 
              v-model="trainingSettings.targetHeartRateMin" 
              :min="40" 
              :max="trainingSettings.targetHeartRateMax"
              @change="validateHeartRateRange"
            ></el-input-number>
            <span>至</span>
            <el-input-number 
              v-model="trainingSettings.targetHeartRateMax" 
              :min="trainingSettings.targetHeartRateMin" 
              :max="200"
              @change="validateHeartRateRange"
            ></el-input-number>
          </div>
        </div>
      </section>

      <!-- 设备设置 -->
      <section class="settings-section">
        <h2>设备设置</h2>
        <div class="setting-item">
          <span>已连接设备</span>
          <div class="device-info">
            <span>{{ deviceName || '未连接设备' }}</span>
            <el-button 
              :type="isConnected ? 'danger' : 'primary'"
              @click="handleDeviceConnection"
            >
              {{ isConnected ? '断开连接' : '连接设备' }}
            </el-button>
          </div>
        </div>
        <div class="setting-item" v-if="isConnected">
          <span>设备电量</span>
          <span>{{ batteryLevel }}%</span>
        </div>
      </section>

      <!-- 通知设置 -->
      <section class="settings-section">
        <h2>通知设置</h2>
        <div class="setting-item">
          <span>训练提醒</span>
          <el-switch v-model="notificationSettings.trainingReminder"></el-switch>
        </div>
        <div class="setting-item" v-if="notificationSettings.trainingReminder">
          <span>提醒时间</span>
          <el-time-picker v-model="notificationSettings.reminderTime"></el-time-picker>
        </div>
      </section>
    </main>

    <!-- 保存按钮 -->
    <div class="settings-footer">
      <el-button type="primary" @click="saveSettings" :loading="saving">
        保存设置
      </el-button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import BluetoothService from '@/services/BluetoothService'

export default {
  name: 'Settings',
  setup() {
    const router = useRouter()
    const bluetoothService = BluetoothService.getInstance()
    const saving = ref(false)

    // 用户设置
    const userSettings = ref({
      username: '',
      age: 25,
    })

    // 训练设置
    const trainingSettings = ref({
      defaultDuration: 15,
      targetHeartRateMin: 60,
      targetHeartRateMax: 120,
    })

    // 通知设置
    const notificationSettings = ref({
      trainingReminder: false,
      reminderTime: new Date(),
    })

    // 计算属性
    const isConnected = computed(() => bluetoothService.getConnectionStatus())
    const deviceName = computed(() => bluetoothService.getDeviceName())
    const batteryLevel = ref(0)

    // 方法
    const handleDeviceConnection = async () => {
      if (isConnected.value) {
        await bluetoothService.disconnect()
      } else {
        await bluetoothService.connectHeartRateBelt()
      }
    }

    const validateHeartRateRange = () => {
      if (trainingSettings.value.targetHeartRateMin >= trainingSettings.value.targetHeartRateMax) {
        trainingSettings.value.targetHeartRateMax = trainingSettings.value.targetHeartRateMin + 1
      }
    }

    const loadSettings = async () => {
      try {
        // 从 localStorage 或后端加载设置
        const savedSettings = localStorage.getItem('userSettings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          userSettings.value = { ...userSettings.value, ...parsed.userSettings }
          trainingSettings.value = { ...trainingSettings.value, ...parsed.trainingSettings }
          notificationSettings.value = { ...notificationSettings.value, ...parsed.notificationSettings }
        }
      } catch (error) {
        console.error('加载设置失败:', error)
        ElMessage.error('加载设置失败')
      }
    }

    const saveSettings = async () => {
      saving.value = true
      try {
        // 保存到 localStorage 或后端
        const settings = {
          userSettings: userSettings.value,
          trainingSettings: trainingSettings.value,
          notificationSettings: notificationSettings.value,
        }
        localStorage.setItem('userSettings', JSON.stringify(settings))
        
        ElMessage.success('设置保存成功')
      } catch (error) {
        console.error('保存设置失败:', error)
        ElMessage.error('保存设置失败')
      } finally {
        saving.value = false
      }
    }

    onMounted(() => {
      loadSettings()
    })

    return {
      router,
      userSettings,
      trainingSettings,
      notificationSettings,
      isConnected,
      deviceName,
      batteryLevel,
      handleDeviceConnection,
      validateHeartRateRange,
      loadSettings,
      saveSettings,
    }
  }
} 