<template>
  <div class="home">
    <!-- 顶部状态栏 -->
    <header class="header">
      <div class="user-profile">
        <el-avatar :size="40" :src="userAvatar">
          {{ settingsStore.username?.charAt(0) || '用' }}
        </el-avatar>
        <div class="user-info">
          <h3>{{ settingsStore.username || '未设置用户名' }}</h3>
          <span class="subtitle">{{ getGreeting() }}</span>
        </div>
      </div>
      <div class="action-buttons">
        <el-button circle @click="router.push('/settings')">
          <i class="el-icon-setting"></i>
        </el-button>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 训练数据概览 -->
      <section class="stats-overview">
        <div class="stat-card">
          <div class="stat-value">{{ todayMinutes }}</div>
          <div class="stat-label">今日训练(分钟)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ streakDays }}</div>
          <div class="stat-label">连续训练(天)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ weeklyProgress }}%</div>
          <div class="stat-label">周目标完成度</div>
        </div>
      </section>

      <!-- 设备状态卡片 -->
      <section class="device-status" v-if="showDeviceStatus">
        <h2>设备状态</h2>
        <div class="device-cards">
          <div class="device-card" :class="{ active: deviceStore.isHeartRateBandConnected }">
            <i class="icon-heart"></i>
            <span>心率带</span>
            <el-tag :type="deviceStore.isHeartRateBandConnected ? 'success' : 'info'">
              {{ deviceStore.isHeartRateBandConnected ? '已连接' : '未连接' }}
            </el-tag>
            <div v-if="deviceStore.isHeartRateBandConnected" class="device-data">
              {{ deviceStore.currentHeartRate }} BPM
            </div>
          </div>
          <div class="device-card" :class="{ active: deviceStore.isBreathingBandConnected }">
            <i class="icon-breathing"></i>
            <span>呼吸带</span>
            <el-tag :type="deviceStore.isBreathingBandConnected ? 'success' : 'info'">
              {{ deviceStore.isBreathingBandConnected ? '已连接' : '未连接' }}
            </el-tag>
            <div v-if="deviceStore.isBreathingBandConnected" class="device-data">
              {{ deviceStore.currentBreathingRate }} 次/分
            </div>
          </div>
        </div>
      </section>

      <!-- 训练模式选择 -->
      <section class="training-modes">
        <h2>训练模式</h2>
        <div class="mode-grid">
          <div v-for="mode in availableTrainingModes" 
               :key="mode.id" 
               class="mode-card"
               @click="startTraining(mode)">
            <div class="mode-icon" :class="mode.color">
              <i :class="mode.icon"></i>
            </div>
            <div class="mode-info">
              <h3>{{ mode.name }}</h3>
              <p>{{ mode.description }}</p>
              <div class="mode-tags">
                <el-tag size="small" :type="mode.difficulty">{{ mode.difficultyText }}</el-tag>
                <el-tag size="small" type="info">{{ mode.duration }}分钟</el-tag>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 最近训练记录 -->
      <section class="recent-trainings" v-if="recentTrainings.length">
        <h2>最近训练</h2>
        <div class="training-timeline">
          <div v-for="training in recentTrainings" 
               :key="training.id" 
               class="training-record"
               @click="viewTrainingDetails(training)">
            <div class="training-date">
              {{ formatDate(training.date) }}
            </div>
            <div class="training-info">
              <h4>{{ training.modeName }}</h4>
              <div class="training-stats">
                <span><i class="el-icon-timer"></i> {{ training.duration }}分钟</span>
                <span><i class="el-icon-data-line"></i> {{ training.avgHeartRate }}BPM</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 快速开始按钮 -->
    <div class="quick-start" v-if="canStartTraining">
      <el-button type="primary" round size="large" @click="quickStart">
        <i class="el-icon-video-play"></i> 快速开始训练
      </el-button>
    </div>

    <!-- 训练模式选择对话框 -->
    <el-dialog
      v-model="showModeDialog"
      title="选择训练时长"
      width="80%"
      custom-class="mode-dialog">
      <div class="duration-options">
        <el-button-group>
          <el-button
            v-for="duration in [5, 10, 15, 20, 30]"
            :key="duration"
            :type="selectedDuration === duration ? 'primary' : ''"
            @click="selectedDuration = duration">
            {{ duration }}分钟
          </el-button>
        </el-button-group>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showModeDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmTraining">
            开始训练
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useDeviceStore } from '@/stores/device'
import { useTrainingStore } from '@/stores/training'
import { ElMessage } from 'element-plus'

const router = useRouter()
const settingsStore = useSettingsStore()
const deviceStore = useDeviceStore()
const trainingStore = useTrainingStore()

// 状态变量
const showModeDialog = ref(false)
const selectedMode = ref(null)
const selectedDuration = ref(10)
const userAvatar = ref('')
const showDeviceStatus = ref(true)

// 计算属性
const canStartTraining = computed(() => deviceStore.hasAnyDeviceConnected)
const weeklyProgress = computed(() => {
  // 计算周训练目标完成度
  return Math.min(Math.round((todayMinutes.value / settingsStore.weeklyGoal) * 100), 100)
})

// 可用的训练模式
const availableTrainingModes = computed(() => {
  const modes = []
  
  if (deviceStore.isBreathingBandConnected) {
    modes.push({
      id: 'breathing',
      name: '基础呼吸训练',
      description: '通过引导式呼吸提高心肺功能',
      icon: 'icon-breathing',
      color: 'blue',
      difficulty: 'success',
      difficultyText: '初级',
      duration: 10
    })
  }

  if (deviceStore.isHeartRateBandConnected) {
    modes.push({
      id: 'heartRate',
      name: '心率控制训练',
      description: '保持目标心率区间进行训练',
      icon: 'icon-heart',
      color: 'red',
      difficulty: 'warning',
      difficultyText: '中级',
      duration: 15
    })
  }

  if (deviceStore.isBreathingBandConnected && deviceStore.isHeartRateBandConnected) {
    modes.push({
      id: 'combined',
      name: '心肺协调训练',
      description: '提高心肺协调能力的高级训练',
      icon: 'icon-advanced',
      color: 'purple',
      difficulty: 'danger',
      difficultyText: '高级',
      duration: 20
    })
  }

  return modes
})

// 最近训练记录
const recentTrainings = ref([])

// 方法
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了，注意休息'
  if (hour < 9) return '早安，开始新的一天'
  if (hour < 12) return '上午好'
  if (hour < 14) return '午安'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了，注意休息'
}

const startTraining = (mode) => {
  selectedMode.value = mode
  showModeDialog.value = true
}

const quickStart = () => {
  // 选择第一个可用的训练模式
  const firstMode = availableTrainingModes.value[0]
  if (firstMode) {
    startTraining(firstMode)
  } else {
    ElMessage.warning('请先连接设备')
  }
}

const confirmTraining = () => {
  if (!selectedMode.value) return
  
  showModeDialog.value = false
  trainingStore.startTraining()
  router.push({
    name: 'TrainingSession',
    params: { mode: selectedMode.value.id },
    query: { duration: selectedDuration.value }
  })
}

const viewTrainingDetails = (training) => {
  // 查看训练详情的逻辑
}

const formatDate = (date) => {
  // 日期格式化逻辑
}

// 生命周期钩子
onMounted(async () => {
  // 加载最近训练记录
  recentTrainings.value = await trainingStore.getRecentTrainings()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

.header {
  background: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info h3 {
  margin: 0;
  font-size: 16px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  color: #333;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.device-status {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.device-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.device-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.device-card:hover {
  transform: translateY(-2px);
}

.device-card i {
  font-size: 24px;
  color: #4a90e2;
  margin-bottom: 8px;
  display: block;
}

.device-card span {
  font-size: 14px;
  color: #666;
}

.device-data {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.training-modes {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.mode-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.mode-card:hover {
  transform: translateY(-2px);
}

.mode-icon {
  font-size: 24px;
  color: #4a90e2;
  margin-bottom: 8px;
  display: block;
}

.mode-info h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.mode-info p {
  font-size: 14px;
  color: #666;
}

.mode-tags {
  display: flex;
  justify-content: space-around;
  margin-top: 8px;
}

.recent-trainings {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.training-timeline {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.training-record {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.training-record:hover {
  transform: translateY(-2px);
}

.training-date {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.training-info h4 {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.training-stats {
  display: flex;
  justify-content: space-around;
}

.quick-start {
  text-align: center;
  margin-top: 24px;
}

.mode-dialog {
  --el-dialog-bg-color: #f5f7fa;
}

.duration-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
}
</style> 