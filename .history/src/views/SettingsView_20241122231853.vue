<template>
  <div class="settings-container">
    <!-- 设置页面标题 -->
    <header class="settings-header">
      <h1>设置</h1>
      <p class="subtitle">个性化您的训练体验</p>
    </header>

    <!-- 设置内容区域 -->
    <main class="settings-content">
      <!-- 个人信息设置 -->
      <section class="settings-section">
        <h2>个人信息</h2>
        <div class="settings-card">
          <div class="form-group">
            <label>用户名</label>
            <el-input v-model="settings.username" placeholder="请输入用户名" />
          </div>
          
          <div class="form-group">
            <label>年龄</label>
            <el-input-number 
              v-model="settings.age" 
              :min="12" 
              :max="100"
              placeholder="请输入年龄"
            />
          </div>
          
          <div class="form-group">
            <label>性别</label>
            <el-radio-group v-model="settings.gender">
              <el-radio label="male">男</el-radio>
              <el-radio label="female">女</el-radio>
              <el-radio label="other">其他</el-radio>
            </el-radio-group>
          </div>
          
          <div class="form-group">
            <label>身高 (cm)</label>
            <el-input-number 
              v-model="settings.height" 
              :min="100" 
              :max="250"
              placeholder="请输入身高"
            />
          </div>
          
          <div class="form-group">
            <label>体重 (kg)</label>
            <el-input-number 
              v-model="settings.weight" 
              :min="30" 
              :max="200"
              placeholder="请输入体重"
            />
          </div>
        </div>
      </section>

      <!-- 训练偏好设置 -->
      <section class="settings-section">
        <h2>训练偏好</h2>
        <div class="settings-card">
          <div class="form-group">
            <label>默认训练时长 (分钟)</label>
            <el-select v-model="settings.defaultDuration">
              <el-option v-for="duration in [3, 5, 10, 15, 20]" 
                        :key="duration" 
                        :label="`${duration}分钟`" 
                        :value="duration" />
            </el-select>
          </div>
          
          <div class="form-group">
            <label>训练难度</label>
            <el-select v-model="settings.difficulty">
              <el-option label="初学者" value="beginner" />
              <el-option label="中级" value="intermediate" />
              <el-option label="高级" value="advanced" />
            </el-select>
          </div>
          
          <div class="form-group">
            <label>训练目标</label>
            <el-select v-model="settings.goal" multiple>
              <el-option label="减压放松" value="relaxation" />
              <el-option label="提高专注力" value="focus" />
              <el-option label="改善睡眠" value="sleep" />
              <el-option label="增强体能" value="fitness" />
            </el-select>
          </div>
          
          <div class="form-group">
            <label>提醒设置</label>
            <div class="reminder-settings">
              <el-switch
                v-model="settings.enableReminders"
                active-text="开启每日提醒"
              />
              <el-time-picker
                v-if="settings.enableReminders"
                v-model="settings.reminderTime"
                format="HH:mm"
                placeholder="选择提醒时间"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- 设备管理 -->
      <section class="settings-section">
        <h2>设备管理</h2>
        <div class="settings-card">
          <div class="device-list">
            <div class="device-item" v-for="device in pairedDevices" :key="device.id">
              <div class="device-info">
                <i :class="device.icon"></i>
                <div class="device-details">
                  <h4>{{ device.name }}</h4>
                  <p>{{ device.status }}</p>
                </div>
              </div>
              <el-button @click="forgetDevice(device.id)" size="small" type="danger">
                解除配对
              </el-button>
            </div>
          </div>
        </div>
      </section>

      <!-- 其他设置 -->
      <section class="settings-section">
        <h2>其他设置</h2>
        <div class="settings-card">
          <div class="form-group">
            <label>语言</label>
            <el-select v-model="settings.language">
              <el-option label="简体中文" value="zh-CN" />
              <el-option label="English" value="en-US" />
            </el-select>
          </div>
          
          <div class="form-group">
            <label>主题</label>
            <el-radio-group v-model="settings.theme">
              <el-radio label="light">浅色</el-radio>
              <el-radio label="dark">深色</el-radio>
              <el-radio label="auto">跟随系统</el-radio>
            </el-radio-group>
          </div>
          
          <div class="form-group">
            <label>数据同步</label>
            <div class="sync-settings">
              <el-switch
                v-model="settings.autoSync"
                active-text="自动同步数据"
              />
              <el-button 
                v-if="!settings.autoSync"
                @click="syncData" 
                :loading="isSyncing"
              >
                立即同步
              </el-button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 底部保存按钮 -->
    <footer class="settings-footer">
      <el-button type="primary" @click="saveSettings" :loading="isSaving">
        保存设置
      </el-button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const isSaving = ref(false)
const isSyncing = ref(false)

// 设置数据
const settings = ref({
  // 个人信息
  username: '',
  age: 25,
  gender: 'male',
  height: 170,
  weight: 65,
  
  // 训练偏好
  defaultDuration: 5,
  difficulty: 'beginner',
  goal: ['relaxation'],
  enableReminders: false,
  reminderTime: null,
  
  // 其他设置
  language: 'zh-CN',
  theme: 'light',
  autoSync: true
})

// 已配对设备列表
const pairedDevices = ref([
  {
    id: 1,
    name: '心率带 A1',
    status: '已连接',
    icon: 'icon-heart-rate'
  },
  {
    id: 2,
    name: '呼吸带 B2',
    status: '未连接',
    icon: 'icon-breathing'
  }
])

// 初始化设置
onMounted(async () => {
  const savedSettings = await settingsStore.getSettings()
  if (savedSettings) {
    settings.value = { ...settings.value, ...savedSettings }
  }
})

// 保存设置
const saveSettings = async () => {
  try {
    isSaving.value = true
    await settingsStore.saveSettings(settings.value)
    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('保存设置失败')
  } finally {
    isSaving.value = false
  }
}

// 同步数据
const syncData = async () => {
  try {
    isSyncing.value = true
    await settingsStore.syncData()
    ElMessage.success('数据同步成功')
  } catch (error) {
    ElMessage.error('数据同步失败')
  } finally {
    isSyncing.value = false
  }
}

// 解除设备配对
const forgetDevice = async (deviceId: number) => {
  try {
    await settingsStore.forgetDevice(deviceId)
    pairedDevices.value = pairedDevices.value.filter(d => d.id !== deviceId)
    ElMessage.success('设备已解除配对')
  } catch (error) {
    ElMessage.error('解除配对失败')
  }
}
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.settings-header {
  margin-bottom: 32px;
  text-align: center;
}

.settings-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 16px;
}

.settings-section {
  margin-bottom: 32px;
}

.settings-section h2 {
  font-size: 20px;
  color: #333;
  margin-bottom: 16px;
}

.settings-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 24px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.reminder-settings,
.sync-settings {
  display: flex;
  gap: 16px;
  align-items: center;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-details h4 {
  margin: 0;
  color: #333;
}

.device-details p {
  margin: 4px 0 0;
  color: #666;
  font-size: 14px;
}

.settings-footer {
  margin-top: 32px;
  text-align: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .settings-container {
    padding: 16px;
  }
  
  .settings-card {
    padding: 16px;
  }
  
  .reminder-settings,
  .sync-settings {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style> 