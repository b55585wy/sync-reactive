<template>
  <div class="settings-container">
    <header class="settings-header">
      <h1>设置</h1>
      <p class="subtitle">个性化您的训练体验</p>
    </header>

    <main class="settings-content">
      <!-- 设备状态部分 -->
      <section class="settings-section">
        <h2>设备管理</h2>
        <div class="settings-card">
          <div class="device-list">
            <!-- 心率带状态 -->
            <div class="device-item">
              <div class="device-info">
                <el-icon><Monitor /></el-icon>
                <div class="device-details">
                  <h4>心率带</h4>
                  <p :class="{ 'connected': deviceStore.isHeartRateBandConnected }">
                    {{ deviceStore.isHeartRateBandConnected ? '已连接' : '未连接' }}
                  </p>
                </div>
              </div>
              <el-button 
                @click="handleDeviceClick('heartRate')"
                :type="deviceStore.isHeartRateBandConnected ? 'danger' : 'primary'"
                size="small">
                {{ deviceStore.isHeartRateBandConnected ? '断开连接' : '连接设备' }}
              </el-button>
            </div>

            <!-- 呼吸带状态 -->
            <div class="device-item">
              <div class="device-info">
                <el-icon><WindPower /></el-icon>
                <div class="device-details">
                  <h4>呼吸带</h4>
                  <p :class="{ 'connected': deviceStore.isBreathingBandConnected }">
                    {{ deviceStore.isBreathingBandConnected ? '已连接' : '未连接' }}
                  </p>
                </div>
              </div>
              <el-button 
                @click="handleDeviceClick('breathing')"
                :type="deviceStore.isBreathingBandConnected ? 'danger' : 'primary'"
                size="small">
                {{ deviceStore.isBreathingBandConnected ? '断开连接' : '连接设备' }}
              </el-button>
            </div>
          </div>
        </div>
      </section>

      <!-- 个人信息设置 -->
      <section class="settings-section">
        <h2>个人信息</h2>
        <div class="settings-card">
          <div class="form-group">
            <label>用户名</label>
            <el-input v-model="tempSettings.username" placeholder="请输入用户名" />
          </div>
          
          <div class="form-group">
            <label>年龄</label>
            <el-input-number 
              v-model="tempSettings.age" 
              :min="12" 
              :max="100"
              placeholder="请输入年龄"
            />
          </div>
          
          <div class="form-group">
            <label>性别</label>
            <el-radio-group v-model="tempSettings.gender">
              <el-radio label="male">男</el-radio>
              <el-radio label="female">女</el-radio>
              <el-radio label="other">其他</el-radio>
            </el-radio-group>
          </div>
          
          <div class="form-group">
            <label>身高 (cm)</label>
            <el-input-number 
              v-model="tempSettings.height" 
              :min="100" 
              :max="250"
              placeholder="请输入身高"
            />
          </div>
          
          <div class="form-group">
            <label>体重 (kg)</label>
            <el-input-number 
              v-model="tempSettings.weight" 
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
            <el-select v-model="tempSettings.defaultDuration">
              <el-option v-for="duration in [5, 10, 15, 20,30]" 
                        :key="duration" 
                        :label="`${duration}分钟`" 
                        :value="duration" />
            </el-select>
          </div>
          
          <div class="form-group">
            <label>训练难度</label>
            <el-select v-model="tempSettings.difficulty">
              <el-option label="初学者" value="beginner" />
              <el-option label="中级" value="intermediate" />
              <el-option label="高级" value="advanced" />
            </el-select>
          </div>
          
          <div class="form-group">
            <label>训练目标</label>
            <el-select v-model="tempSettings.goal" multiple>
              <el-option label="减压放松" value="relaxation" />
              <el-option label="提高专注力" value="focus" />
              <el-option label="改善睡眠" value="sleep" />
              <el-option label="改善体态" value="fitness" />
            </el-select>
          </div>
          
          <div class="form-group">
            <label>提醒设置</label>
            <div class="reminder-settings">
              <el-switch
                v-model="tempSettings.enableReminders"
                active-text="开启每日提醒"
              />
              <el-time-picker
                v-if="tempSettings.enableReminders"
                v-model="tempSettings.reminderTime"
                format="HH:mm"
                placeholder="选择提醒时间"
              />
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
            <el-select v-model="tempSettings.language">
              <el-option label="简体中文" value="zh-CN" />
              <el-option label="English" value="en-US" />
            </el-select>
          </div>
          
          <div class="form-group">
            <label>主题</label>
            <el-radio-group v-model="tempSettings.theme">
              <el-radio label="light">浅色</el-radio>
              <el-radio label="dark">深色</el-radio>
              <el-radio label="auto">跟随系统</el-radio>
            </el-radio-group>
          </div>
          
          <div class="form-group">
            <label>数据同步</label>
            <div class="sync-settings">
              <el-switch
                v-model="tempSettings.autoSync"
                active-text="自动同步数据"
              />
              <el-button 
                v-if="!tempSettings.autoSync"
                @click="syncData" 
                :loading="isSyncing"
              >
                立即同步
              </el-button>
            </div>
          </div>
        </div>
      </section>

      <!-- 训练目标设置 -->
      <section class="settings-section">
        <h2>训练目标设置</h2>
        <div class="settings-card">
          <div class="target-settings">
            <!-- 目标心率设置 -->
            <div class="setting-item">
              <div class="setting-label">
                <h4>目标心率范围</h4>
                <!-- <p class="setting-desc">设置您希望通过呼吸训练达到的心率范围</p> -->
              </div>
              <div class="heart-rate-range">
                <el-input-number 
                  v-model="targetHeartRateMin" 
                  :min="40" 
                  :max="targetHeartRateMax"
                  size="small"
                  @change="updateHeartRateSettings">
                  <template #prefix>最小</template>
                </el-input-number>
                <span class="separator">-</span>
                <el-input-number 
                  v-model="targetHeartRateMax" 
                  :min="targetHeartRateMin" 
                  :max="220-settingsStore.age"
                  size="small"
                  @change="updateHeartRateSettings">
                  <template #prefix>最大</template>
                </el-input-number>
                <span class="unit">BPM</span>
              </div>
            </div>

            <!-- 呼吸节奏设置 -->
            <div class="setting-item">
              <div class="setting-label">
                <h4>默认呼吸节奏</h4>
                <!-- <p class="setting-desc">设置默认的呼吸训练节奏（秒）</p> -->
              </div>
              <div class="breathing-rhythm">
                <el-input-number 
                  v-model="inhaleTime" 
                  :min="2" 
                  :max="6"
                  size="small">
                  <template #prefix>吸气</template>
                </el-input-number>
                <el-input-number 
                  v-model="holdTime" 
                  :min="0" 
                  :max="4"
                  size="small">
                  <template #prefix>屏息</template>
                </el-input-number>
                <el-input-number 
                  v-model="exhaleTime" 
                  :min="2" 
                  :max="8"
                  size="small">
                  <template #prefix>呼气</template>
                </el-input-number>
              </div>
            </div>

            <!-- 训练提醒设置 -->
            <div class="setting-item">
              <div class="setting-label">
                <h4>训练提醒</h4>
                <p class="setting-desc">设置每日训练提醒时间</p>
              </div>
              <el-time-picker
                v-model="reminderTime"
                format="HH:mm"
                placeholder="选择提醒时间"
                size="small"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- 底部操作按钮 -->
      <div class="settings-actions">
        <el-button @click="cancelChanges">取消</el-button>
        <el-button type="primary" @click="saveChanges">保存</el-button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useDeviceStore } from '@/stores/deviceStore'
import BluetoothService from '@/services/BluetoothService'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, WindPower } from '@element-plus/icons-vue'
import type { Settings } from '@/types/settings';

const router = useRouter()
const settingsStore = useSettingsStore()
const deviceStore = useDeviceStore()
const bluetoothService = new BluetoothService()
const isSaving = ref(false)
const isSyncing = ref(false)

// 创建临时设置对象
const tempSettings = ref({
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

// 心率目标设置
const targetHeartRateMin = ref(60);
const targetHeartRateMax = ref(80);
const inhaleTime = ref(4);
const holdTime = ref(2);
const exhaleTime = ref(6);
const reminderTime = ref(null);

// 更新心率设置
const updateHeartRateSettings = () => {
  tempSettings.value = {
    ...tempSettings.value,
    targetHeartRateMin: targetHeartRateMin.value,
    targetHeartRateMax: targetHeartRateMax.value
  };
};

// 初始化临时设置
onMounted(async () => {
  try {
    // ��始化设置
    await settingsStore.initializeSettings();
    
    // 使用 getAllSettings getter 获取所有设置
    const currentSettings = settingsStore.getAllSettings;
    
    // 更新临时设置
    tempSettings.value = { ...currentSettings };
    
    // 更新目标心率等设置
    targetHeartRateMin.value = currentSettings.targetHeartRateMin;
    targetHeartRateMax.value = currentSettings.targetHeartRateMax;
    inhaleTime.value = currentSettings.inhaleTime;
    holdTime.value = currentSettings.holdTime;
    exhaleTime.value = currentSettings.exhaleTime;
    reminderTime.value = currentSettings.reminderTime;
  } catch (error) {
    console.error('加载设置失败:', error);
    ElMessage.error('加载设置失败');
  }
});

// 取消修改
const cancelChanges = () => {
  ElMessageBox.confirm('确定要放弃修改吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 重置为原始值
    const originalSettings = settingsStore.getAllSettings;
    tempSettings.value = { ...originalSettings };
    targetHeartRateMin.value = originalSettings.targetHeartRateMin;
    targetHeartRateMax.value = originalSettings.targetHeartRateMax;
    inhaleTime.value = originalSettings.inhaleTime;
    holdTime.value = originalSettings.holdTime;
    exhaleTime.value = originalSettings.exhaleTime;
    reminderTime.value = originalSettings.reminderTime;
    
    router.back();
  }).catch(() => {
    // 用户取消操作
  });
};

// 保存修改
const saveChanges = async () => {
  try {
    isSaving.value = true;
    
    // 合并所有设置
    const newSettings = {
      ...tempSettings.value,
      targetHeartRateMin: targetHeartRateMin.value,
      targetHeartRateMax: targetHeartRateMax.value,
      inhaleTime: inhaleTime.value,
      holdTime: holdTime.value,
      exhaleTime: exhaleTime.value,
      reminderTime: reminderTime.value
    };

    // 保存设置
    await settingsStore.saveSettings(newSettings);
    
    ElMessage.success('设置保存成功');
    router.back();
  } catch (error) {
    console.error('保存设置失败:', error);
    ElMessage.error('保存失败：' + (error.message || '未知错误'));
  } finally {
    isSaving.value = false;
  }
};

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

// 处理设备连接/断开
const handleDeviceClick = async (deviceType: 'heartRate' | 'breathing') => {
  try {
    if (deviceType === 'heartRate') {
      if (!deviceStore.isHeartRateBandConnected) {
        // 连接心率带
        await bluetoothService.connectHeartRateBand();
        deviceStore.setHeartRateBandConnected(true);
        ElMessage.success('心率带连接成功');
      } else {
        // 断开心率带
        await ElMessageBox.confirm(
          '确定要断开心率带连接吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        await bluetoothService.disconnectHeartRateBand();
        deviceStore.setHeartRateBandConnected(false);
        ElMessage.success('心率带已断开连接');
      }
    } else if (deviceType === 'breathing') {
      if (!deviceStore.isBreathingBandConnected) {
        // 连接呼吸带
        // await bluetoothService.connectBreathingBand();
        // deviceStore.setBreathingBandConnected(true);
        ElMessage.success('呼吸带连接成功');
      } else {
        await ElMessageBox.confirm(
          '确定要断开呼吸带连接吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        // await bluetoothService.disconnectBreathingBand();
        deviceStore.setBreathingBandConnected(false);
        ElMessage.success('呼吸带已断开连接');
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('设备操作失败:', error);
      ElMessage.error('设备操作失败: ' + (error.message || '未知错误'));
    }
  }
};

// 获取设备图标
const getDeviceIcon = (type) => {
  if (type === 'breathing') {
    return 'icon-breathing'
  } else if (type === 'heartRate') {
    return 'icon-heart-rate'
  } else {
    return ''
  }
}

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
}
</script>

<style scoped>
.settings-container {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 32px;
}

.settings-actions {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
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
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.device-details h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.device-details p {
  margin: 4px 0 0;
  color: #666;
}

.device-details p.connected {
  color: #67C23A;
}

.icon-heart,
.icon-breathing {
  font-size: 24px;
  color: #409EFF;
}

.target-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #eee;
}

.setting-label {
  flex: 1;
}

.setting-label h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.setting-desc {
  margin: 4px 0 0;
  font-size: 14px;
  color: #666;
}

.heart-rate-range,
.breathing-rhythm {
  display: flex;
  align-items: center;
  gap: 12px;
}

.separator {
  color: #666;
}

.unit {
  color: #666;
  margin-left: 8px;
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