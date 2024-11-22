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
        <el-button circle class="settings-button" @click="router.push('/settings')">
          <el-icon><Setting /></el-icon>
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
        <h2>
          <el-icon><Connection /></el-icon>
          设备状态
        </h2>
        <div class="device-cards">
          <!-- 心率带卡片 -->
          <div class="device-card" 
               :class="{ active: deviceStore.isHeartRateBandConnected }"
               @click="handleDeviceClick('heartRate')">
            <div class="device-icon" :class="{ connected: deviceStore.isHeartRateBandConnected }">
              <el-icon><Monitor /></el-icon>
            </div>
            <span class="device-name">心率带</span>
            <el-tag :type="deviceStore.isHeartRateBandConnected ? 'success' : 'info'" 
                    class="device-status-tag">
              <el-icon>
                <component :is="deviceStore.isHeartRateBandConnected ? 'CircleCheck' : 'Link'" />
              </el-icon>
              {{ deviceStore.isHeartRateBandConnected ? '已连接' : '点击连接' }}
            </el-tag>
            <div v-if="deviceStore.isHeartRateBandConnected" class="device-data">
              <el-icon color="#f56c6c"><Histogram /></el-icon>
              <span>{{ deviceStore.currentHeartRate }} BPM</span>
            </div>
          </div>

          <!-- 呼吸带卡片 -->
          <div class="device-card" 
               :class="{ active: deviceStore.isBreathingBandConnected }"
               @click="handleDeviceClick('breathing')">
            <div class="device-icon" :class="{ connected: deviceStore.isBreathingBandConnected }">
              <el-icon><WindPower /></el-icon>
            </div>
            <span class="device-name">呼吸带</span>
            <el-tag :type="deviceStore.isBreathingBandConnected ? 'success' : 'info'"
                    class="device-status-tag">
              <el-icon>
                <component :is="deviceStore.isBreathingBandConnected ? 'CircleCheck' : 'Link'" />
              </el-icon>
              {{ deviceStore.isBreathingBandConnected ? '已连接' : '点击连接' }}
            </el-tag>
            <div v-if="deviceStore.isBreathingBandConnected" class="device-data">
              <el-icon color="#409eff"><Odometer /></el-icon>
              <span>{{ deviceStore.currentBreathingRate }} 次/分</span>
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
import { 
  Monitor, 
  WindPower, 
  Connection, 
  Link, 
  CircleCheck, 
  Histogram, 
  Odometer,
  Timer,
  DataLine,
  Trophy,
  Calendar,
  Setting
} from '@element-plus/icons-vue'

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
const todayMinutes = ref(0)
const streakDays = ref(0)
const recentTrainings = ref([])

// 计算属性
const canStartTraining = computed(() => deviceStore.hasAnyDeviceConnected)
const weeklyProgress = computed(() => {
  const weeklyGoal = settingsStore.weeklyGoal || 150 // 默认周目标150分钟
  return Math.min(Math.round((todayMinutes.value / weeklyGoal) * 100), 100)
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
  try {
    // 并行加载数据
    await Promise.all([
      getTodayTrainingMinutes(),
      getStreakDays(),
      loadRecentTrainings()
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
  }
})

// 获取今日训练时长
const getTodayTrainingMinutes = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const trainings = await trainingStore.getTrainingsByDate(today)
    todayMinutes.value = trainings.reduce((total, training) => {
      return total + (training.duration || 0)
    }, 0)
  } catch (error) {
    console.error('获取今日训练时长失败:', error)
    todayMinutes.value = 0
  }
}

// 获取连续训练天数
const getStreakDays = async () => {
  try {
    const trainings = await trainingStore.getRecentTrainings()
    let streak = 0
    let currentDate = new Date()
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const hasTraining = trainings.some(t => t.date.startsWith(dateStr))
      
      if (!hasTraining) break
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    }
    
    streakDays.value = streak
  } catch (error) {
    console.error('获取连续训练天数失败:', error)
    streakDays.value = 0
  }
}

// 加载最近训练记录
const loadRecentTrainings = async () => {
  recentTrainings.value = await trainingStore.getRecentTrainings()
}

// 添加设备点击处理函数
const handleDeviceClick = (deviceType) => {
  if (deviceType === 'heartRate' && !deviceStore.isHeartRateBandConnected) {
    router.push('/prepare/devices')
  } else if (deviceType === 'breathing' && !deviceStore.isBreathingBandConnected) {
    router.push('/prepare/devices')
  }
}
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
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #ebeef5;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.device-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a);
  transform: scaleX(0);
  transition: transform 0.3s;
}

.device-card.active::before {
  transform: scaleX(1);
}

.device-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.device-name {
  font-size: 14px;
  color: #666;
}

.device-status-tag {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #4CAF50;  /* 使用相同的绿色 */
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  width: fit-content;
}

.device-status-tag:hover {
  background: #43A047;  /* 悬停时的深绿色 */
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.device-status-tag.connected {
  background: #4CAF50;
}

.device-status-tag.disconnected {
  background: #f0f2f5;
  color: #666;
}

.device-status-tag.disconnected:hover {
  background: #e8eaed;
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

.settings-button {
  width: 40px;
  height: 40px;
  font-size: 20px;
  color: #666;
  background: #f5f7fa;
  border: none;
  transition: all 0.3s ease;
}

.settings-button:hover {
  background: #e8eaed;
  transform: rotate(30deg);
}
</style> 