好的,我将为你整理并发送完整的代码,删除重复部分并保持逻辑完整性。以下是整理后的完整代码:

```vue
<template>
  <div class="training-session">
    <!-- 顶部状态栏 -->
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

    <!-- 主要内容区域 -->
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

        <div class="heart-rate-stats">
          <div class="stat-item">
            <el-icon><TopRight /></el-icon>
            <div class="stat-content">
              <span class="label">最高</span>
              <span class="value">{{ maxHeartRate }}</span>
            </div>
          </div>
          <div class="stat-item">
            <el-icon><TrendCharts /></el-icon>
            <div class="stat-content">
              <span class="label">平均</span>
              <span class="value">{{ avgHeartRate }}</span>
            </div>
          </div>
          <div class="stat-item">
            <el-icon><BottomRight /></el-icon>
            <div class="stat-content">
              <span class="label">最低</span>
              <span class="value">{{ minHeartRate }}</span>
            </div>
          </div>
        </div>

        <div class="heart-rate-chart" ref="chartRef"></div>
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

      <!-- 训练状态卡片 -->
      <div class="dashboard-card status-card">
        <div class="card-header">
          <el-icon><DataAnalysis /></el-icon>
          <span>训练状态</span>
        </div>

        <div class="status-grid">
          <div class="status-item">
            <el-progress 
              type="dashboard" 
              :percentage="targetAchievementRate"
              :color="getDashboardColor(targetAchievementRate)"
            />
          </div>

          <div class="status-item">
            <span class="number">{{ estimatedCalories }}</span>
            <span class="unit">千卡</span>
          </div>

          <div class="status-item">
            <span class="intensity-indicator" :class="getIntensityLevel">
              {{ getIntensityText }}
            </span>
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

      <!-- 实时建议卡片 -->
      <div class="dashboard-card advice-card" v-if="currentAdvice">
        <div class="card-header">
          <el-icon><ChatDotRound /></el-icon>
          <span>训练建议</span>
        </div>
        
        <div class="advice-content">
          <el-alert
            :title="currentAdvice.title"
            :type="currentAdvice.type"
            :description="currentAdvice.content"
            show-icon
            :closable="false"
          />
        </div>
      </div>
    </main>

    <!-- 底部控制栏 -->
    <footer class="control-bar">
      <div class="control-buttons">
        <el-button-group>
          <el-button 
            type="primary" 
            circle 
            size="large"
            @click="togglePause"
          >
            <el-icon>
              <component :is="isPaused ? 'VideoPlay' : 'VideoPause'" />
            </el-icon>
          </el-button>
          <el-button 
            type="danger" 
            circle 
            size="large"
            @click="confirmEndSession"
          >
            <el-icon><CircleClose /></el-icon>
          </el-button>
        </el-button-group>
      </div>

      <div class="session-info">
        <div class="remaining-time">
          剩余 {{ formatTime(remainingTime) }}
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import BluetoothService from '@/services/BluetoothService';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useTrainingStore } from '@/stores/training';
import { useDeviceStore } from '@/stores/device';
import { useSettingsStore } from '@/stores/settings';
import { generateTrainingAdvice } from '@/utils/trainingAdvice';
import BreathingFlower from '@/components/breathing/BreathingFlower.vue';
import { 
  ArrowLeft, Monitor, Odometer, TopRight, BottomRight, TrendCharts,
  WindPower, DataAnalysis, ChatDotRound, VideoPlay, VideoPause, CircleClose
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

const elapsedTime = ref(0);
const heartRateHistory = ref<number[]>([]);
const maxHeartRate = ref(0);
const minHeartRate = ref(999);
const avgHeartRate = ref(0);
const heartRateSum = ref(0);
const heartRateCount = ref(0);
const breathingPhase = ref('inhale');
const breathingRate = ref(6);
const breathingCountdown = ref(settingsStore.inhaleTime);
const isPaused = ref(false);
const currentPhase = ref('准备阶段');
const currentAdvice = ref(null);
const isBeating = ref(false);

let timer: number | null = null;
let breathingIntervalTimer: number | null = null;
let heartbeatTimer: number | null = null;

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

const getIntensityText = computed(() => {
  switch (getIntensityLevel.value) {
    case 'high': return '过高';
    case 'low': return '过低';
    case 'optimal': return '适中';
    default: return '未知';
  }
});

const showHeartRate = computed(() => {
  return props.mode === 'heartRate' || props.mode === 'combined';
});

const showBreathing = computed(() => {
  return props.mode === 'breathing' || props.mode === 'combined';
});

const remainingTime = computed(() => {
  return (props.duration * 60) - elapsedTime.value;
});

const progress = computed(() => {
  return Math.round((elapsedTime.value / (props.duration * 60)) * 100);
});

const progressColor = computed(() => {
  const progress = (elapsedTime.value / (props.duration * 60)) * 100;
  if (progress < 30) return '#ff9800';
  if (progress < 60) return '#4caf50';
  if (progress < 90) return '#2196f3';
  return '#9c27b0';
});

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
    description: '提升心肺耐力，增强体能'
  },
  {
    name: '无氧',
    range: [90, 100],
    color: '#73C0DE',
    description: '高强度训练，提升运动表现'
  }
]);

watch(() => deviceStore.currentHeartRate, (newRate) => {
  if (newRate > 0) {
    console.log('SessionView 接收到新心率:', newRate);
    heartRateHistory.value.push(newRate);
    maxHeartRate.value = Math.max(maxHeartRate.value, newRate);
    minHeartRate.value = Math.min(minHeartRate.value, newRate);
    heartRateSum.value += newRate;
    heartRateCount.value++;
    avgHeartRate.value = Math.round(heartRateSum.value / heartRateCount.value);
    trainingStore.addHeartRateRecord(newRate);
  }
}, { immediate: true });

watch(() => [settingsStore.targetHeartRateMin, settingsStore.targetHeartRateMax], 
  ([newMin, newMax]) => {
    console.log('心率范围更新:', newMin, '-', newMax);
  }
);

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

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

const confirmEndSession = async () => {
  try {
    await ElMessageBox.confirm('确定要结束本次训练吗？', '结束训练', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    clearInterval(timer!);
    if (breathingIntervalTimer) clearInterval(breathingIntervalTimer);
    trainingStore.endTraining();
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

const togglePause = () => {
  isPaused.value = !isPaused.value;
  好的,我继续提供代码的后半部分:

```javascript
  if (isPaused.value) {
    if (timer) clearInterval(timer);
    if (breathingIntervalTimer) clearInterval(breathingIntervalTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    currentPhase.value = '已暂停';
  } else {
    timer = setInterval(() => {
      elapsedTime.value++;
      if (deviceStore.currentHeartRate > 0) {
        trainingStore.addHeartRateRecord(deviceStore.currentHeartRate);
      }
    }, 1000);

    if (props.mode === 'breathing' || props.mode === 'combined') {
      breathingIntervalTimer = setInterval(() => {
        updateBreathing();
      }, 1000);
    }

    updateHeartbeatAnimation();
    currentPhase.value = '训练中';
  }
};

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

const updateAdvice = () => {
  currentAdvice.value = generateTrainingAdvice({
    currentHeartRate: deviceStore.currentHeartRate,
    targetMin: settingsStore.targetHeartRateMin,
    targetMax: settingsStore.targetHeartRateMax,
    breathingRate: breathingRate.value,
    elapsedTime: elapsedTime.value
  });
};

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

const updateHeartbeatAnimation = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
  
  const heartRate = deviceStore.currentHeartRate;
  if (heartRate > 0) {
    const interval = 60000 / heartRate;
    heartbeatTimer = setInterval(() => {
      isBeating.value = true;
      setTimeout(() => {
        isBeating.value = false;
      }, 200);
    }, interval);
  }
};

onMounted(async () => {
  try {
    if (!deviceStore.isHeartRateBandConnected) {
      console.warn('心率带未连接！');
      ElMessage.warning('心率带未连接，请先连接设备');
      return;
    }

    console.log('心率带连接状态:', deviceStore.isHeartRateBandConnected);
    console.log('当前心率:', deviceStore.currentHeartRate);
    
    trainingStore.startTraining();
    
    timer = setInterval(() => {
      elapsedTime.value++;
      if (deviceStore.currentHeartRate > 0) {
        trainingStore.addHeartRateRecord(deviceStore.currentHeartRate);
      }
    }, 1000);

    if (props.mode === 'breathing' || props.mode === 'combined') {
      breathingIntervalTimer = setInterval(() => {
        updateBreathing();
      }, 1000);
    }

    updateHeartbeatAnimation();
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

</script>

<style lang="scss" scoped>
// 这里是你的样式代码，保持不变
// ...
</style>
```

这个版本的代码已经去除了重复部分,并保持了逻辑的完整性。主要的变化包括:

1. 删除了重复的 watch, onMounted 和 onUnmounted 钩子。
2. 合并了重复的方法定义,如 updateBreathing, togglePause 等。
3. 删除了重复的计算属性定义。
4. 统一了变量声明,如 timer, breathingIntervalTimer 等。
5. 整理了导入语句,删除了重复的部分。

这个版本的代码应该更加清晰和易于维护。如果你还有任何问题或需要进一步的修改,请随时告诉我。