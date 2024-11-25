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
import { useRouter, useRoute } from 'vue-router';
import BluetoothService from '@/services/BluetoothService';
import { ElMessageBox } from 'element-plus';
import { useTrainingStore } from '@/stores/training';
import { useDeviceStore } from '@/stores/device';
import { useSettingsStore } from '@/stores/settings';
import SparklineChart from '@/components/charts/SparklineChart.vue';
import { generateTrainingAdvice } from '@/utils/trainingAdvice';
import { ElMessage } from 'element-plus';
import BreathingFlower from '@/components/breathing/BreathingFlower.vue';
import { 
  ArrowLeft,
  Monitor,
  Odometer,
  TopRight,
  BottomRight,
  TrendCharts,
  WindPower,
  Sunny,
  Aim,
  Setting,
  Timer,
  DataAnalysis,
  Trophy,
  Histogram,
  InfoFilled,
  ChatDotRound,
  VideoPlay,
  VideoPause,
  CircleClose
} from '@element-plus/icons-vue';

const props = withDefaults(defineProps<{
  mode?: 'breathing' | 'heartRate' | 'combined';
  duration?: number;
}>(), {
  mode: 'heartRate',
  duration: 3
});

const router = useRouter();
const bluetoothService = new BluetoothService();
const trainingStore = useTrainingStore();
const deviceStore = useDeviceStore();
const settingsStore = useSettingsStore();

// 1. 首先声明所有响应式变量
const elapsedTime = ref(0);
const heartRateHistory = ref<number[]>([]);
const maxHeartRate = ref(0);
const minHeartRate = ref(deviceStore.currentHeartRate || 999);
const avgHeartRate = ref(0);
const heartRateSum = ref(0);
const heartRateCount = ref(0);
const breathingPhase = ref('inhale');
const breathingRate = ref(6);
const breathingCountdown = ref(settingsStore.inhaleTime);
const isPaused = ref(false);
const currentPhase = ref('准备阶段');
const recentHeartRates = ref<number[]>([]);
const currentAdvice = ref(null);

// 2. ���算属性
const targetAchievementRate = computed(() => {
  if (!heartRateHistory.value.length) return 0;
  
  const inTargetCount = heartRateHistory.value.filter(hr => 
    hr >= settingsStore.targetHeartRateMin && 
    hr <= settingsStore.targetHeartRateMax
  ).length;
  
  return Math.round((inTargetCount / heartRateHistory.value.length) * 100);
});

const estimatedCalories = computed(() => {
  const weight = settingsStore.weight;
  const avgHR = avgHeartRate.value;
  const duration = elapsedTime.value / 60;
  
  return Math.round((duration * (0.6309 * avgHR + 0.1988 * weight + 0.2017 * settingsStore.age - 55.0969) / 4.184));
});

const getIntensityLevel = computed(() => {
  const hr = deviceStore.currentHeartRate;
  if (!hr) return 'none';
  if (hr > settingsStore.targetHeartRateMax + 10) return 'high';
  if (hr < settingsStore.targetHeartRateMin - 10) return 'low';
  return 'optimal';
});

// 3. 然后添加 watch
watch(() => deviceStore.currentHeartRate, (newRate) => {
  try {
    if (newRate > 0) {
      console.log('SessionView 接收到新心率:', newRate);
      
      // 添加到心率历史
      heartRateHistory.value.push(newRate);
      
      // 更新统计数据
      maxHeartRate.value = Math.max(maxHeartRate.value, newRate);
      minHeartRate.value = Math.min(minHeartRate.value, newRate);
      heartRateSum.value += newRate;
      heartRateCount.value++;
      avgHeartRate.value = Math.round(heartRateSum.value / heartRateCount.value);
      
      // 添加到训练记录
      trainingStore.addHeartRateRecord(newRate);
    }
  } catch (error) {
    console.error('处理心率数据时出错:', error);
    ElMessage.error('数据处理出错');
  }
}, { 
  immediate: true,
  onError: (error) => {
    console.error('心率监听器错误:', error);
  }
});

// 4. 方法定义
const isInZone = (range: [number, number]) => {
  const hr = deviceStore.currentHeartRate;
  return hr >= range[0] && hr <= range[1];
};

const getZonePercentage = (range: [number, number]) => {
  const totalTime = heartRateHistory.value.length;
  if (totalTime === 0) return 0;
  
  const timeInZone = heartRateHistory.value.filter(hr => 
    hr >= range[0] && hr <= range[1]
  ).length;
  
  return Math.round((timeInZone / totalTime) * 100);
};

const getDashboardColor = (percentage: number) => {
  if (percentage < 30) return '#909399';
  if (percentage < 60) return '#e6a23c';
  if (percentage < 80) return '#67c23a';
  return '#409eff';
};





// 方法
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const updateHeartRateStats = () => {
  const currentRate = bluetoothService.getHeartRate();
  if (currentRate > 0) {
    maxHeartRate.value = Math.max(maxHeartRate.value, currentRate);
    minHeartRate.value = Math.min(minHeartRate.value, currentRate);
    heartRateSum.value += currentRate;
    heartRateCount.value++;
    avgHeartRate.value = Math.round(heartRateSum.value / heartRateCount.value);
    
    // 添加到 store
    trainingStore.addHeartRateRecord(currentRate);
  }
};

const confirmEndSession = async () => {
  try {
    await ElMessageBox.confirm('确定要结束本次训练吗？', '结束训练', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    // 1. 先停止计时器
    clearInterval(timer);
    if (breathingIntervalTimer) clearInterval(breathingIntervalTimer);
    
    // 2. 保存训练数据
    trainingStore.endTraining();
    
    // 3. 导航到总结页面
    await router.push({
      name: 'TrainingSummary',
      query: {
        duration: String(elapsedTime.value),
        targetDuration: String(props.duration * 60),
        mode: props.mode
      }
    });
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('结束训练失败:', error);
      ElMessage.error('结束训练失败');
    }
  }
};

// 监听心率变化
watch(() => deviceStore.currentHeartRate, (newRate) => {
  if (newRate > 0) {
    console.log('SessionView 接收到新心率:', newRate);
    // 添加到心率历史
    heartRateHistory.value.push(newRate);
    
    // 更新统计数据
    maxHeartRate.value = Math.max(maxHeartRate.value, newRate);
    minHeartRate.value = Math.min(minHeartRate.value, newRate);
    heartRateSum.value += newRate;
    heartRateCount.value++;
    avgHeartRate.value = Math.round(heartRateSum.value / heartRateCount.value);
    
    // 添加到训练记录
    trainingStore.addHeartRateRecord(newRate);
  }
}, { immediate: true });

// 生命周期钩子
onMounted(async () => {
  try {
    if (!deviceStore.isHeartRateBandConnected) {
      console.warn('心率带未连接！');
      ElMessage.warning('心率带未连接，请先连接设备');
      return;
    }

    console.log('心率带连接状态:', deviceStore.isHeartRateBandConnected);
    console.log('当前心率:', deviceStore.currentHeartRate);
    
    // 开始训练记录
    trainingStore.startTraining();
    
    // 开始计时
    timer = setInterval(() => {
      elapsedTime.value++;
      if (deviceStore.currentHeartRate > 0) {
        trainingStore.addHeartRateRecord(deviceStore.currentHeartRate);
      }
    }, 1000);

    // 如果是呼吸训练模式，开始呼吸引导
    if (props.mode === 'breathing' || props.mode === 'combined') {
      breathingIntervalTimer = setInterval(() => {
        updateBreathing();
      }, 1000);
    }
  } catch (error) {
    console.error('初始化训练失败:', error);
    ElMessage.error('初始化训练失败');
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (breathingIntervalTimer) clearInterval(breathingIntervalTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
});

// 更新呼吸计时
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
}

// 添加一个监听器来确保设置更新时视图会更新
watch(() => [settingsStore.targetHeartRateMin, settingsStore.targetHeartRateMax], 
  ([newMin, newMax]) => {
    console.log('心率范围更新:', newMin, '-', newMax);
  }
);

// 新增方法
const togglePause = () => {
  isPaused.value = !isPaused.value;
  if (isPaused.value) {
    if (timer) clearInterval(timer);
    if (breathingIntervalTimer) clearInterval(breathingIntervalTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    currentPhase.value = '已暂停';
  } else {
    // 重新开始计时
    timer = setInterval(() => {
      elapsedTime.value++;
      if (deviceStore.currentHeartRate > 0) {
        trainingStore.addHeartRateRecord(deviceStore.currentHeartRate);
      }
    }, 1000);

    // 重新开始呼吸引导
    if (props.mode === 'breathing' || props.mode === 'combined') {
      breathingIntervalTimer = setInterval(() => {
        updateBreathing();
      }, 1000);
    }

    // 重新开始心跳动画
    updateHeartbeatAnimation();
    
    currentPhase.value = '训练中';
  }
};

const updateAdvice = () => {
  currentAdvice.value = generateTrainingAdvice({
    currentHeartRate: deviceStore.currentHeartRate,
    targetMin: settingsStore.targetHeartRateMin,
    targetMax: settingsStore.targetHeartRateMax,
    breathingRate: breathingRate.value,
    elapsedTime: elapsedTime.value
  });
};

const showHeartRate = computed(() => {
  return props.mode === 'heartRate' || props.mode === 'combined';
});

const showBreathing = computed(() => {
  return props.mode === 'breathing' || props.mode === 'combined';
});

const remainingTime = computed(() => {
  return (props.duration * 60) - elapsedTime.value;
});

const progressColor = computed(() => {
  const progress = (elapsedTime.value / (props.duration * 60)) * 100;
  if (progress < 30) return '#ff9800';
  if (progress < 60) return '#4caf50';
  if (progress < 90) return '#2196f3';
  return '#9c27b0';
});

// 添加格式化心率进度的方法
const formatHeartRateProgress = (percentage: number) => {
  return `${Math.round(percentage)}%`;
};

// 添加暂停和恢复方法
const pauseTraining = () => {
  clearInterval(timer);
  if (breathingIntervalTimer) {
    clearInterval(breathingIntervalTimer);
  }
  currentPhase.value = '已暂停';
};

const resumeTraining = () => {
  // 重新开始时
  timer = setInterval(() => {
    elapsedTime.value++;
    if (deviceStore.currentHeartRate > 0) {
      trainingStore.addHeartRateRecord(deviceStore.currentHeartRate);
    }
  }, 1000);

  // 如果是呼吸训练模式，重新开始呼吸引导
  if (props.mode === 'breathing' || props.mode === 'combined') {
    breathingIntervalTimer = setInterval(() => {
      updateBreathing();
    }, 1000);
  }
  
  currentPhase.value = '训练中';
};

// 添加心率区间相关的计算属性
const heartRateZones = computed(() => [
  {
    name: '热身',
    range: [60, 70],
    color: '#91CC75',
    description: '基础热身阶段，提升心肺功能'
  },
  {
    name: '燃脂',
    range: [70, 80],
    color: '#FAC858',
    description: '最佳燃脂区间，提高新陈代谢'
  },
  {
    name: '有氧',
    range: [80, 90],
    color: '#EE6666',
    description: '提升���肺耐力，增强体能'
  },
  {
    name: '无氧',
    range: [90, 100],
    color: '#73C0DE',
    description: '高强度训练，提升运动表现'
  }
]);

// 添加设备状态相关的计算属性
const getSignalStrength = computed(() => {
  const strength = deviceStore.signalStrength || 0;
  if (strength > 80) return 'signal-strong';
  if (strength > 50) return 'signal-medium';
  if (strength > 20) return 'signal-weak';
  return 'signal-none';
});

const getBatteryLevel = computed(() => {
  const level = deviceStore.batteryLevel || 0;
  if (level > 80) return 'battery-full';
  if (level > 50) return 'battery-medium';
  if (level > 20) return 'battery-low';
  return 'battery-critical';
});

// 添加心跳动画态
const isBeating = ref(false);
let heartbeatTimer: number;

// 添加确认退出方法
const confirmExit = async () => {
  try {
    await ElMessageBox.confirm('确定要退出训练吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    router.back();
  } catch {
    // 用户取消
  }
};

// 添加强度文本计算
const getIntensityText = computed(() => {
  switch (getIntensityLevel.value) {
    case 'high': return '过高';
    case 'low': return '过低';
    case 'optimal': return '适中';
    default: return '未知';
  }
});

// 添加实时提示
const getAchievementTip = computed(() => {
  const rate = targetAchievementRate.value;
  if (rate < 30) return '建议调整呼吸节奏，帮助心率达到目标范围';
  if (rate < 60) return '正在接近目标，继续保持';
  if (rate < 80) return '表现不错，继续保持当前状态';
  return '完美！心率控制得很好';
});

// 1. 添加定时器变量
let timer: number | null = null;
let breathingIntervalTimer: number | null = null;

// 2. 添加进度计算属性
const progress = computed(() => {
  return Math.round((elapsedTime.value / (props.duration * 60)) * 100);
});





// 5. 添加心跳动画更新函数
const updateHeartbeatAnimation = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
  
  const heartRate = deviceStore.currentHeartRate;
  if (heartRate > 0) {
    const interval = 60000 / heartRate; // 根据心率计算间隔时间
    heartbeatTimer = setInterval(() => {
      isBeating.value = true;
      setTimeout(() => {
        isBeating.value = false;
      }, 200);
    }, interval);
  }
};

// 6. 监听心率变化更新动画
watch(() => deviceStore.currentHeartRate, updateHeartbeatAnimation, { immediate: true });

// 7. 修改 onMounted 钩子
onMounted(async () => {
  try {
    if (!deviceStore.isHeartRateBandConnected) {
      console.warn('心率带未连接！');
      ElMessage.warning('心率带未连接，请先连接设备');
      return;
    }

    console.log('心率带连接状态:', deviceStore.isHeartRateBandConnected);
    console.log('当前心率:', deviceStore.currentHeartRate);
    
    // 开始训练记录
    trainingStore.startTraining();
    
    // 开始计时
    timer = setInterval(() => {
      elapsedTime.value++;
      if (deviceStore.currentHeartRate > 0) {
        trainingStore.addHeartRateRecord(deviceStore.currentHeartRate);
      }
    }, 1000);

    // 如果是呼吸训练模式，开始呼吸引导
    if (props.mode === 'breathing' || props.mode === 'combined') {
      breathingIntervalTimer = setInterval(() => {
        updateBreathing();
      }, 1000);
    }
  } catch (error) {
    console.error('初始化训练失败:', error);
    ElMessage.error('初始化训练失败');
  }
});

// 8. 修改 onUnmounted 钩子
onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (breathingIntervalTimer) clearInterval(breathingIntervalTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
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