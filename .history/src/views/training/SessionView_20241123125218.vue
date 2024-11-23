import { useSettingsStore } from '@/stores/settings'

<template>
  <div class="training-session">
    <!-- 顶部状态栏 - 增加更多状态信息 -->
    <header class="session-header">
      <div class="session-info">
        <h2>{{ getSessionTitle }}</h2>
        <div class="session-meta">
          <div class="time-display">
            <span class="current-time">{{ formatTime(elapsedTime) }}</span>
            <div class="phase-indicator" :class="currentPhase">
              {{ currentPhase }}
              <span v-if="isPaused" class="pause-hint">点击继续训练</span>
            </div>
          </div>
          <div class="device-status">
            <el-tooltip content="心率带信号强度">
              <i class="signal-icon" :class="getSignalStrength"></i>
              {{ deviceStore.signalStrength }}%
            </el-tooltip>
            <el-tooltip content="电池电量">
              <i class="battery-icon" :class="getBatteryLevel"></i>
              {{ deviceStore.batteryLevel }}%
            </el-tooltip>
          </div>
        </div>
      </div>
      <div class="session-actions">
        <el-button-group>
          <el-button 
            @click="togglePause" 
            :type="isPaused ? 'warning' : 'primary'"
            :icon="isPaused ? 'VideoPlay' : 'VideoPause'"
          >
            {{ isPaused ? '继续' : '暂停' }}
          </el-button>
          <el-button 
            type="danger" 
            icon="CircleClose"
            @click="confirmEndSession"
          >
            结束训练
          </el-button>
        </el-button-group>
      </div>
    </header>

    <!-- 主要训练数据显示区域 -->
    <div class="training-dashboard">
      <!-- 心率数据卡片 -->
      <div class="data-panel heart-rate-panel" v-if="showHeartRate">
        <div class="current-heart-rate" :class="getHeartRateStatus">
          <div class="value-display">
            <span class="value">{{ deviceStore.currentHeartRate || '--' }}</span>
            <span class="unit">BPM</span>
          </div>
          <div class="heart-animation" :class="{ beating: isBeating }">
            <i class="heart-icon"></i>
          </div>
        </div>

        <div class="heart-rate-stats">
          <div class="stat-item">
            <span class="label">最高</span>
            <span class="value">{{ maxHeartRate }}</span>
          </div>
          <div class="stat-item">
            <span class="label">平均</span>
            <span class="value">{{ avgHeartRate }}</span>
          </div>
          <div class="stat-item">
            <span class="label">最低</span>
            <span class="value">{{ minHeartRate }}</span>
          </div>
        </div>

        <!-- 心率区间分布 -->
        <div class="zone-distribution">
          <div class="zone-label">心率区间分布</div>
          <div class="zone-bars">
            <div 
              v-for="zone in heartRateZones" 
              :key="zone.name"
              class="zone-bar"
              :class="{ active: isInZone(zone.range) }"
              :style="{ 
                width: `${getZonePercentage(zone.range)}%`,
                backgroundColor: zone.color 
              }"
            >
              <span class="zone-name">{{ zone.name }}</span>
              <span class="zone-value">{{ getZonePercentage(zone.range) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 呼吸引导面板 -->
      <div class="breathing-panel" v-if="showBreathing">
        <div class="breathing-animation" :class="breathingPhase">
          <div class="breath-circle">
            <div class="circle-content">
              <div class="instruction">{{ getBreathingInstruction }}</div>
              <div class="timer">{{ breathingCountdown }}s</div>
            </div>
            <div class="ripples">
              <div v-for="i in 3" :key="i" class="ripple"></div>
            </div>
          </div>
        </div>

        <div class="breathing-controls">
          <div class="breathing-pattern">
            <span class="label">呼吸模式</span>
            <el-radio-group v-model="breathingPattern" size="small">
              <el-radio-button label="relax">放松</el-radio-button>
              <el-radio-button label="focus">专注</el-radio-button>
              <el-radio-button label="custom">自定义</el-radio-button>
            </el-radio-group>
          </div>

          <div class="breathing-settings" v-if="breathingPattern === 'custom'">
            <div class="setting-item">
              <span>吸气时长</span>
              <el-slider v-model="inhaleTime" :min="2" :max="6" :step="0.5" />
            </div>
            <div class="setting-item">
              <span>屏息时长</span>
              <el-slider v-model="holdTime" :min="0" :max="4" :step="0.5" />
            </div>
            <div class="setting-item">
              <span>呼气时长</span>
              <el-slider v-model="exhaleTime" :min="2" :max="8" :step="0.5" />
            </div>
          </div>
        </div>
      </div>

      <!-- 实时反馈和建议 -->
      <div class="feedback-panel">
        <div class="training-advice" v-if="currentAdvice">
          <el-alert
            :title="currentAdvice.title"
            :type="currentAdvice.type"
            :description="currentAdvice.content"
            show-icon
            :closable="false"
          />
        </div>

        <div class="achievement-cards">
          <div class="achievement-card">
            <div class="achievement-icon">
              <i class="target-icon"></i>
            </div>
            <div class="achievement-info">
              <div class="label">目标心率达成率</div>
              <div class="value">{{ targetAchievementRate }}%</div>
            </div>
          </div>
          
          <div class="achievement-card">
            <div class="achievement-icon">
              <i class="calorie-icon"></i>
            </div>
            <div class="achievement-info">
              <div class="label">预计消耗</div>
              <div class="value">{{ estimatedCalories }} 千卡</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部进度条 -->
    <div class="progress-container">
      <div class="progress-info">
        <span class="progress-text">
          训练进度 {{ Math.round(progress) }}%
        </span>
        <span class="time-remaining">
          剩余 {{ formatTime(remainingTime) }}
        </span>
      </div>
      <el-progress 
        :percentage="progress"
        :stroke-width="12"
        :color="progressColor"
      >
        <template #default="{ percentage }">
          <span class="progress-label">{{ percentage }}%</span>
        </template>
      </el-progress>
    </div>
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

// 状态管理
const elapsedTime = ref(0);
const currentHeartRate = ref(0);
const maxHeartRate = ref(0);
const minHeartRate = ref(deviceStore.currentHeartRate || 999);
const avgHeartRate = ref(0);
const heartRateSum = ref(0);
const heartRateCount = ref(0);
const breathingPhase = ref('inhale');
const breathingRate = ref(6);
const breathingCountdown = ref(settingsStore.inhaleTime);

// 计时器
let timer: number;
let breathingIntervalTimer: number;

// 新增状态
const isPaused = ref(false);
const currentPhase = ref('准备阶段');
const recentHeartRates = ref<number[]>([]);
const currentAdvice = ref(null);

// 计算属性
const getSessionTitle = computed(() => {
  switch (props.mode) {
    case 'heartRate': return '心率训练';
    case 'breathing': return '呼吸训练';
    case 'combined': return '综合训练';
    default: return '训练会话';
  }
});

const progress = computed(() => {
  return (elapsedTime.value / (props.duration * 60)) * 100;
});

const breathingText = computed(() => {
  return breathingPhase.value === 'inhale' ? '吸气' : '呼气';
});

const getHeartRateStatus = computed(() => {
  if (!deviceStore.currentHeartRate) return 'no-data';
  if (deviceStore.currentHeartRate > settingsStore.targetHeartRateMax) return 'too-high';
  if (deviceStore.currentHeartRate < settingsStore.targetHeartRateMin) return 'too-low';
  return 'optimal';
});

const getGuidanceMessage = computed(() => {
  if (!deviceStore.currentHeartRate) return '等待心率数据...';
  if (deviceStore.currentHeartRate > settingsStore.targetHeartRateMax) {
    return '心率偏高，请跟随呼吸引导放松';
  }
  if (deviceStore.currentHeartRate < settingsStore.targetHeartRateMin) {
    return '心率偏低，可以稍微提升呼吸频率';
  }
  return '心率处于理想范围，请保持当前节奏';
});

const getBreathingInstruction = computed(() => {
  switch(breathingPhase.value) {
    case 'inhale': return `吸气 (${breathingCountdown.value}s)`;
    case 'hold': return `屏息 (${breathingCountdown.value}s)`;
    case 'exhale': return `呼气 (${breathingCountdown.value}s)`;
  }
});

const getHeartRatePercentage = computed(() => {
  if (!deviceStore.currentHeartRate) return 0;
  const range = settingsStore.targetHeartRateMax - settingsStore.targetHeartRateMin;
  const current = deviceStore.currentHeartRate - settingsStore.targetHeartRateMin;
  return Math.min(100, Math.max(0, (current / range) * 100));
});

const getHeartRateColor = computed(() => {
  const status = getHeartRateStatus.value;
  return {
    'too-high': '#f56c6c',
    'too-low': '#e6a23c',
    'optimal': '#67c23a',
    'no-data': '#909399'
  }[status];
});

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
    currentHeartRate.value = newRate;
    maxHeartRate.value = Math.max(maxHeartRate.value, newRate);
    minHeartRate.value = Math.min(minHeartRate.value, newRate);
    heartRateSum.value += newRate;
    heartRateCount.value++;
    avgHeartRate.value = Math.round(heartRateSum.value / heartRateCount.value);
  }
}, { immediate: true });

// 生命周期钩子
onMounted(() => {
  // 开始训练
  trainingStore.startTraining();
  
  // 初始化心率数据
  if (deviceStore.currentHeartRate > 0) {
    currentHeartRate.value = deviceStore.currentHeartRate;
    minHeartRate.value = deviceStore.currentHeartRate;
    maxHeartRate.value = deviceStore.currentHeartRate;
    heartRateSum.value = deviceStore.currentHeartRate;
    heartRateCount.value = 1;
    avgHeartRate.value = deviceStore.currentHeartRate;
  }

  // 开始计时
  timer = setInterval(() => {
    elapsedTime.value++;
    if (deviceStore.currentHeartRate > 0) {
      trainingStore.addHeartRateRecord(deviceStore.currentHeartRate);
    }
  }, 1000);

  // 呼吸引导
  if (props.mode === 'breathing' || props.mode === 'combined') {
    breathingIntervalTimer = setInterval(() => {
      updateBreathing();
    }, 1000);
  }
});

onUnmounted(() => {
  // 确保组件卸载时清理资源
  clearInterval(timer);
  if (breathingIntervalTimer) clearInterval(breathingIntervalTimer);
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
    pauseTraining();
  } else {
    resumeTraining();
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
  // 重新开始计时
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



const targetAchievementRate = computed(() => {
  if (!heartRateHistory.value.length) return 0;
  const inTargetCount = heartRateHistory.value.filter(hr => 
    hr >= settingsStore.targetHeartRateMin && 
    hr <= settingsStore.targetHeartRateMax
  ).length;
  return Math.round((inTargetCount / heartRateHistory.value.length) * 100);
});

const estimatedCalories = computed(() => {
  // 基于心率、体重和运动时间的卡路里消耗估算
  const weight = settingsStore.weight;
  const avgHR = avgHeartRate.value;
  const duration = elapsedTime.value / 60; // 转换为分钟
  
  return Math.round((duration * (0.6309 * avgHR + 0.1988 * weight + 0.2017 * settingsStore.age - 55.0969) / 4.184));
});

// 呼吸模式处理
const breathingPatterns = {
  relax: {
    inhale: 4,
    hold: 4,
    exhale: 6
  },
  focus: {
    inhale: 5,
    hold: 0,
    exhale: 5
  },
  custom: {
    inhale: ref(4),
    hold: ref(2),
    exhale: ref(6)
  }
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
    description: '提升心肺耐力，增强体能'
  },
  {
    name: '无氧',
    range: [90, 100],
    color: '#73C0DE',
    description: '高强度训练，提升运动表现'
  }
]);

// 添加心率相关的方法
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

// 添加呼吸模式相关的响应式变量
const breathingPattern = ref('relax');
const inhaleTime = ref(4);
const holdTime = ref(2);
const exhaleTime = ref(6);


// 监听呼吸模式变化
watch(() => breathingPattern.value, (newPattern) => {
  if (newPattern !== 'custom') {
    const pattern = breathingPatterns[newPattern];
    inhaleTime.value = pattern.inhale;
    holdTime.value = pattern.hold;
    exhaleTime.value = pattern.exhale;
  }
});

// 添加其他必要的响应式变量
const heartRateHistory = ref<number[]>([]);
const isPaused = ref(false);
</script>

<style scoped>
.training-session {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  background: #f5f7fa;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.session-info h2 {
  margin: 0;
  color: #2c3e50;
}

.session-timer {
  font-size: 24px;
  font-weight: bold;
  color: #4CAF50;
}

.btn-end {
  padding: 8px 24px;
  background: #ff5252;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.data-display {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.data-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.heart-rate-display {
  position: relative;
}

.current-value {
  font-size: 64px;
  font-weight: bold;
  text-align: center;
  transition: color 0.3s ease;
}

.current-value.too-high { color: #f56c6c; }
.current-value.too-low { color: #e6a23c; }
.current-value.optimal { color: #67c23a; }
.current-value.no-data { color: #909399; }

.target-range {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.guidance-message {
  margin-top: 16px;
  font-size: 16px;
  padding: 8px;
  border-radius: 4px;
}

.breathing-guide {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

.breathing-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  transition: all 1s ease;
}

.breathing-circle.inhale {
  background: linear-gradient(135deg, #4CAF50, #81C784);
  transform: scale(1.1);
}

.breathing-circle.exhale {
  background: linear-gradient(135deg, #81C784, #4CAF50);
  transform: scale(0.9);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 24px;
}

.stat-item {
  text-align: center;
}

.stat-item label {
  display: block;
  color: #666;
  margin-bottom: 4px;
}

.stat-item span {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #81C784);
  transition: width 1s linear;
}

@media (max-width: 768px) {
  .training-session {
    padding: 16px;
  }
  
  .data-display {
    grid-template-columns: 1fr;
  }
  
  .current-value {
    font-size: 48px;
  }
  
  .breathing-circle {
    width: 150px;
    height: 150px;
  }
}

/* 新增样式 */
.breathing-animation {
  position: relative;
  width: 200px;
  height: 200px;
}

.breathing-animation.inhale {
  animation: breathe-in 4s ease-in-out;
}

.breathing-animation.exhale {
  animation: breathe-out 6s ease-in-out;
}

.ripple {
  position: absolute;
}

.breathing-animation {
  .breath-circle {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4CAF50, #81C784);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 1s ease-in-out;

    &.inhale {
      transform: scale(1.2);
    }

    &.exhale {
      transform: scale(0.8);
    }

    .ripple {
      position: absolute;
      border: 2px solid rgba(76, 175, 80, 0.3);
      border-radius: 50%;
      animation: ripple 4s ease-out infinite;
    }
  }
}

.achievement-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;

  .achievement-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }
}

@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
</style> 