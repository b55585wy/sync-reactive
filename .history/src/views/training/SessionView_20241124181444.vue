import { useSettingsStore } from '@/stores/settings'
import * as echarts from 'echarts';
import BreathingFlower from '@/components/breathing/BreathingFlower.vue';
<template>
  <div class="training-session">
    <!-- 状态栏 -->
    <header class="status-bar">
      <div class="left-controls">
        <el-button circle class="back-btn" @click="confirmExit">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
      </div>

      <div class="center-info">
        <div class="time-display">
          <span class="current-time">{{ formatTime(elapsedTime) }}</span>
          <div class="session-progress">
            <el-progress 
              :percentage="progress" 
              :show-text="false"
              :stroke-width="4"
              :color="progressColor"
            />
          </div>
        </div>
      </div>

      <div class="right-status">
        <div class="device-indicators">
          <el-tooltip content="心率监测" placement="bottom">
            <div class="indicator" :class="{ active: deviceStore.isHeartRateBandConnected }">
              <el-icon><Monitor /></el-icon>
            </div>
          </el-tooltip>
          <el-tooltip content="呼吸监测" placement="bottom">
            <div class="indicator" :class="{ active: deviceStore.isBreathingBandConnected }">
              <el-icon><Odometer /></el-icon>
            </div>
          </el-tooltip>
        </div>
      </div>
    </header>

    <!-- 仪表板 -->
    <main class="dashboard-grid">
      <!-- 心率监测卡片 -->
      <div class="dashboard-card primary-card" v-if="showHeartRate">
        <div class="card-header">
          <el-icon><Monitor /></el-icon>
          <span>实时心率</span>
        </div>

        <div class="heart-rate-display" :class="getHeartRateStatus">
          <div class="current-value">
            <span class="number">{{ deviceStore.currentHeartRate || '--' }}</span>
            <span class="unit">BPM</span>
          </div>
          <div class="heart-animation" :class="{ beating: isBeating }">
            <div class="pulse-ring"></div>
          </div>
        </div>

        <div class="zone-distribution">
          <div class="zone-bars">
            <div 
              v-for="zone in heartRateZones" 
              :key="zone.name"
              class="zone-bar"
              :class="{ active: isInZone(zone.range) }"
            >
              <div class="bar-progress" 
                :style="{ 
                  width: `${getZonePercentage(zone.range)}%`,
                  backgroundColor: zone.color 
                }"
              ></div>
              <div class="bar-label">
                <span class="name">{{ zone.name }}</span>
                <span class="percentage">{{ getZonePercentage(zone.range) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 呼吸引导卡片 -->
      <div class="dashboard-card" v-if="showBreathing">
        <div class="card-header">
          <el-icon><WindPower /></el-icon>
          <span>呼吸引导</span>
        </div>

        <BreathingFlower
          :breathing-phase="breathingPhase"
          :breathing-countdown="breathingCountdown"
        />
      </div>

      <!-- 实时建议卡片 -->
      <div class="dashboard-card advice-card" v-if="currentAdvice">
        <div class="card-header">
          <el-icon><ChatDotRound /></el-icon>
          <span>训练建议</span>
        </div>
        <el-alert
          :title="currentAdvice.title"
          :type="currentAdvice.type"
          :description="currentAdvice.content"
          show-icon
          :closable="false"
        />
      </div>
    </main>

    <!-- 底部控制栏 -->
    <footer class="control-bar">
      <div class="control-buttons">
        <el-button-group>
          <el-button type="primary" circle size="large" @click="togglePause">
            <el-icon>
              <component :is="isPaused ? 'VideoPlay' : 'VideoPause'" />
            </el-icon>
          </el-button>
          <el-button type="danger" circle size="large" @click="confirmEndSession">
            <el-icon><CircleClose /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      <div class="session-info">
        <div class="remaining-time">剩余 {{ formatTime(remainingTime) }}</div>
      </div>
    </footer>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useTrainingStore } from '@/stores/training';
import { useDeviceStore } from '@/stores/device';
import { useSettingsStore } from '@/stores/settings';
import BreathingFlower from '@/components/breathing/BreathingFlower.vue';
import { 
  ArrowLeft, Monitor, Odometer, WindPower, ChatDotRound, VideoPlay, VideoPause, CircleClose 
} from '@element-plus/icons-vue';

const router = useRouter();
const trainingStore = useTrainingStore();
const deviceStore = useDeviceStore();
const settingsStore = useSettingsStore();
const props = defineProps({
  mode: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
});
// 响应式变量
const elapsedTime = ref(0); // 已训练时间（秒）
const isPaused = ref(false); // 暂停状态
const currentAdvice = ref(null); // 当前建议
const breathingPhase = ref('inhale'); // 呼吸阶段（吸气/呼气）
const breathingCountdown = ref(10); // 当前呼吸倒计时

// 心率统计
const maxHeartRate = ref(0);
const minHeartRate = ref(999);
const avgHeartRate = ref(0);
const heartRateSum = ref(0);
const heartRateCount = ref(0);
const heartRateHistory = ref<number[]>([]);

// 定时器
let timer: number | null = null;
let breathingTimer: number | null = null;

// 计算属性
const progress = computed(() => Math.round((elapsedTime.value / (props.duration * 60)) * 100));
const remainingTime = computed(() => (props.duration * 60) - elapsedTime.value);
const showHeartRate = computed(() => props.mode === 'heartRate' || props.mode === 'combined');
const showBreathing = computed(() => props.mode === 'breathing' || props.mode === 'combined');

// 心率区间分布
const heartRateZones = computed(() => [
  { name: '热身', range: [60, 70], color: '#91CC75' },
  { name: '燃脂', range: [70, 80], color: '#FAC858' },
  { name: '有氧', range: [80, 90], color: '#EE6666' },
  { name: '无氧', range: [90, 100], color: '#73C0DE' }
]);

// 格式化时间
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 心率区间百分比
const getZonePercentage = (range: [number, number]) => {
  const totalTime = heartRateHistory.value.length;
  if (!totalTime) return 0;
  const timeInZone = heartRateHistory.value.filter(hr => hr >= range[0] && hr <= range[1]).length;
  return Math.round((timeInZone / totalTime) * 100);
};

// 呼吸倒计时更新
const updateBreathing = () => {
  breathingCountdown.value--;
  if (breathingCountdown.value <= 0) {
    switch (breathingPhase.value) {
      case 'inhale':
        breathingPhase.value = 'hold';
        breathingCountdown.value = settingsStore.holdTime;
        break;
      case 'hold':
        breathingPhase.value = 'exhale';
        breathingCountdown.value = settingsStore.exhaleTime;
        break;
      case 'exhale':
        breathingPhase.value = 'inhale';
        breathingCountdown.value = settingsStore.inhaleTime;
        break;
    }
  }
};

// 暂停与恢复
const togglePause = () => {
  isPaused.value = !isPaused.value;
  if (isPaused.value) {
    if (timer) clearInterval(timer);
    if (breathingTimer) clearInterval(breathingTimer);
  } else {
    startTimers();
  }
};

// 启动计时器
const startTimers = () => {
  timer = setInterval(() => elapsedTime.value++, 1000);
  breathingTimer = setInterval(updateBreathing, 1000);
};

// 结束训练
const confirmEndSession = async () => {
  try {
    await ElMessageBox.confirm('确定要结束本次训练吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    endSession();
  } catch {
    ElMessage.error('取消结束训练');
  }
};

// 退出训练
const confirmExit = async () => {
  try {
    await ElMessageBox.confirm('确定要退出训练吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    router.push({ name: 'Training' });
  } catch {
    ElMessage.error('取消退出训练');
  }
};

// 结束训练逻辑
const endSession = () => {
  if (timer) clearInterval(timer);
  if (breathingTimer) clearInterval(breathingTimer);
  trainingStore.endTraining();
  router.push({ name: 'TrainingSummary' });
};

// 心率数据更新
const updateHeartRateStats = (newRate: number) => {
  if (newRate > 0) {
    heartRateHistory.value.push(newRate);
    maxHeartRate.value = Math.max(maxHeartRate.value, newRate);
    minHeartRate.value = Math.min(minHeartRate.value, newRate);
    heartRateSum.value += newRate;
    heartRateCount.value++;
    avgHeartRate.value = Math.round(heartRateSum.value / heartRateCount.value);
  }
};

// 监听器
watch(() => deviceStore.currentHeartRate, updateHeartRateStats, { immediate: true });

// 生命周期钩子
onMounted(() => {
  if (!deviceStore.isHeartRateBandConnected) {
    ElMessage.warning('心率带未连接，请先连接设备');
    return;
  }
  startTimers();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (breathingTimer) clearInterval(breathingTimer);
});
</script>


<style lang="scss" scoped>
// 基础样式
.training-session {
  min-height: 100vh;
  background: #f6f8fa;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// 状态栏样式
.status-bar {
  background: white;
  border-radius: 16px;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

  .time-display {
    text-align: center;
    
    .current-time {
      font-size: 32px;
      font-weight: 600;
      color: #409EFF;
      margin-bottom: 8px;
      display: block;
    }

    .session-progress {
      width: 200px;
    }
  }

  .device-indicators {
    display: flex;
    gap: 12px;

    .indicator {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      color: #909399;
      transition: all 0.3s ease;

      &.active {
        background: #67C23A;
        color: white;
      }
    }
  }
}

// 仪表板网格布局
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  flex: 1;
}

// 卡片基础样式
.dashboard-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    color: #606266;

    .el-icon {
      font-size: 20px;
    }
  }
}

// 心率显示样式
.heart-rate-display {
  text-align: center;
  position: relative;
  padding: 40px 0;

  .current-value {
    position: relative;
    z-index: 2;

    .number {
      font-size: 64px;
      font-weight: 700;
      background: linear-gradient(135deg, #409EFF, #36CE9E);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .unit {
      font-size: 20px;
      color: #909399;
      margin-left: 8px;
    }
  }

  .heart-animation {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;

    .pulse-ring {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(64,158,255,0.1) 0%, rgba(64,158,255,0) 70%);
      animation: pulse 2s infinite;
    }
  }
}

// 呼吸引导样式
.breathing-guide {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;

  .breathing-circle {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: linear-gradient(135deg, #36CE9E, #409EFF);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 1s ease-in-out;

    &.inhale {
      transform: scale(1.2);
    }

    &.exhale {
      transform: scale(0.8);
    }

    .circle-content {
      color: white;
      text-align: center;
      z-index: 2;
    }

    .ripple-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
    }
  }
}

// 状态网格样式
.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;

  .status-item {
    text-align: center;

    .status-icon {
      margin-bottom: 12px;
      color: #409EFF;
    }

    .status-value {
      font-size: 24px;
      font-weight: 600;
    }
  }
}

// 间分布样式
.zone-distribution {
  .zone-bars {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .zone-bar {
    height: 32px;
    background: #f5f7fa;
    border-radius: 16px;
    overflow: hidden;
    position: relative;

    .bar-content {
      position: relative;
      height: 100%;
    }

    .bar-progress {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      transition: width 0.3s ease;
    }

    .bar-label {
      position: relative;
      z-index: 2;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 12px;
      height: 100%;
      color: white;
    }
  }
}

// 控制栏样式
.control-bar {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.05);

  .control-buttons {
    display: flex;
    gap: 16px;
  }

  .session-info {
    color: #606266;
    font-size: 16px;
  }
}

// 动画
@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.5;
  }
  50% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.5;
  }
}

// 响应式调整
@media (max-width: 768px) {
  .training-session {
    padding: 12px;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .status-bar {
    .time-display {
      .current-time {
        font-size: 24px;
      }

      .session-progress {
        width: 150px;
      }
    }
  }

  .breathing-guide {
    min-height: 250px;

    .breathing-circle {
      width: 150px;
      height: 150px;
    }
  }
}

.achievement-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .percentage {
    font-size: 20px;
    font-weight: bold;
    color: #303133;
  }
  
  .label {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style> 