import { useSettingsStore } from '@/stores/settings'

<template>
  <div class="training-session">
    <!-- 顶部状态栏 -->
    <header class="session-header glass-effect">
      <div class="session-info">
        <div class="title-area">
          <h2>{{ getSessionTitle }}</h2>
          <div class="device-badges">
            <div class="device-badge" :class="{ active: deviceStore.isHeartRateBandConnected }">
              <i class="heart-icon"></i>
              <span>心率监测</span>
            </div>
            <div class="device-badge" :class="{ active: deviceStore.isBreathingBandConnected }">
              <i class="breath-icon"></i>
              <span>呼吸监测</span>
            </div>
          </div>
        </div>
        <div class="status-area">
          <div class="time-display">
            <span class="current-time">{{ formatTime(elapsedTime) }}</span>
            <div class="phase-badge" :class="currentPhase">
              {{ currentPhase }}
              <span v-if="isPaused" class="pause-hint">点击继续训练</span>
            </div>
          </div>
          <div class="device-status">
            <el-tooltip content="信号强度" placement="bottom">
              <div class="status-indicator">
                <i class="signal-icon" :class="getSignalStrength"></i>
                <span>{{ deviceStore.signalStrength }}%</span>
              </div>
            </el-tooltip>
            <el-tooltip content="电池电量" placement="bottom">
              <div class="status-indicator">
                <i class="battery-icon" :class="getBatteryLevel"></i>
                <span>{{ deviceStore.batteryLevel }}%</span>
              </div>
            </el-tooltip>
          </div>
        </div>
      </div>
      <div class="session-actions">
        <el-button-group>
          <el-button 
            class="control-btn"
            @click="togglePause" 
            :type="isPaused ? 'warning' : 'primary'"
          >
            <i :class="isPaused ? 'play-icon' : 'pause-icon'"></i>
            {{ isPaused ? '继续' : '暂停' }}
          </el-button>
          <el-button 
            class="control-btn danger"
            @click="confirmEndSession"
          >
            <i class="stop-icon"></i>
            结束训练
          </el-button>
        </el-button-group>
      </div>
    </header>

    <!-- 主要训练区域 -->
    <div class="training-dashboard">
      <div class="dashboard-grid">
        <!-- 心率监测卡片 -->
        <div class="dashboard-card heart-rate-card" v-if="showHeartRate">
          <div class="card-header">
            <h3>实时心率</h3>
            <div class="card-actions">
              <el-tooltip content="查看详细数据">
                <i class="expand-icon"></i>
              </el-tooltip>
            </div>
          </div>
          <div class="card-content">
            <div class="heart-rate-display" :class="getHeartRateStatus">
              <div class="current-value">
                <span class="number">{{ deviceStore.currentHeartRate || '--' }}</span>
                <span class="unit">BPM</span>
              </div>
              <div class="heart-animation" :class="{ beating: isBeating }">
                <div class="heart-icon"></div>
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
            <div class="zone-distribution">
              <h4>心率区间</h4>
              <div class="zone-bars">
                <div 
                  v-for="zone in heartRateZones" 
                  :key="zone.name"
                  class="zone-bar"
                  :class="{ active: isInZone(zone.range) }"
                >
                  <div class="zone-progress" 
                    :style="{ 
                      width: `${getZonePercentage(zone.range)}%`,
                      backgroundColor: zone.color 
                    }"
                  ></div>
                  <div class="zone-info">
                    <span class="zone-name">{{ zone.name }}</span>
                    <span class="zone-value">{{ getZonePercentage(zone.range) }}%</span>
                  </div>
                  <el-tooltip :content="zone.description" placement="right">
                    <i class="info-icon"></i>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 呼吸引导卡片 -->
        <div class="dashboard-card breathing-card" v-if="showBreathing">
          <div class="card-header">
            <h3>呼吸引导</h3>
            <div class="breathing-mode">
              <el-radio-group v-model="breathingPattern" size="small">
                <el-radio-button label="relax">放松模式</el-radio-button>
                <el-radio-button label="focus">专注模式</el-radio-button>
                <el-radio-button label="custom">自定义</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="card-content">
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
            <div class="breathing-controls" v-if="breathingPattern === 'custom'">
              <div class="control-item">
                <span>吸气时长</span>
                <el-slider 
                  v-model="inhaleTime" 
                  :min="2" 
                  :max="6" 
                  :step="0.5"
                  :marks="{ 2: '2s', 4: '4s', 6: '6s' }"
                />
              </div>
              <div class="control-item">
                <span>屏息时长</span>
                <el-slider 
                  v-model="holdTime" 
                  :min="0" 
                  :max="4" 
                  :step="0.5"
                  :marks="{ 0: '0s', 2: '2s', 4: '4s' }"
                />
              </div>
              <div class="control-item">
                <span>呼气时长</span>
                <el-slider 
                  v-model="exhaleTime" 
                  :min="2" 
                  :max="8" 
                  :step="0.5"
                  :marks="{ 2: '2s', 5: '5s', 8: '8s' }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 训练反馈卡片 -->
        <div class="dashboard-card feedback-card">
          <div class="card-header">
            <h3>训练反馈</h3>
          </div>
          <div class="card-content">
            <div class="training-advice" v-if="currentAdvice">
              <el-alert
                :title="currentAdvice.title"
                :type="currentAdvice.type"
                :description="currentAdvice.content"
                show-icon
                :closable="false"
                class="advice-alert"
              />
            </div>
            <div class="achievement-grid">
              <div class="achievement-card">
                <div class="achievement-icon target-icon"></div>
                <div class="achievement-info">
                  <div class="label">目标心率达成率</div>
                  <div class="value">{{ targetAchievementRate }}%</div>
                </div>
              </div>
              <div class="achievement-card">
                <div class="achievement-icon calorie-icon"></div>
                <div class="achievement-info">
                  <div class="label">预计消耗</div>
                  <div class="value">{{ estimatedCalories }} 千卡</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部进度条 -->
    <div class="progress-container glass-effect">
      <div class="progress-info">
        <span class="progress-text">训练进度 {{ Math.round(progress) }}%</span>
        <span class="time-remaining">剩余 {{ formatTime(remainingTime) }}</span>
      </div>
      <el-progress 
        :percentage="progress"
        :stroke-width="12"
        :color="progressColor"
        class="training-progress"
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
    return '心率偏低，���以稍微提升呼吸频率';
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

  // 根据实际心率设置心跳动画
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

  // 监听心率变化
  watch(() => deviceStore.currentHeartRate, updateHeartbeatAnimation, { immediate: true });
});

onUnmounted(() => {
  // 确保组件卸载时清理资源
  clearInterval(timer);
  if (breathingIntervalTimer) clearInterval(breathingIntervalTimer);
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
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

// 添加心跳动画状态
const isBeating = ref(false);
let heartbeatTimer: number;
</script>

<style lang="scss" scoped>
.training-session {
  min-height: 100vh;
  background: linear-gradient(135deg, #f6f9fc 0%, #e9f2f9 100%);
  color: #2c3e50;
  padding: 20px;
  position: relative;
}

// 毛玻璃效果卡片
.glass-effect {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
}

.session-header {
  padding: 20px;
  margin-bottom: 24px;

  .title-area {
    display: flex;
    align-items: center;
    gap: 20px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
  }

  .device-badges {
    display: flex;
    gap: 12px;

    .device-badge {
      padding: 6px 12px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0.5;
      transition: all 0.3s ease;

      &.active {
        opacity: 1;
        background: rgba(103, 194, 58, 0.2);
        border: 1px solid rgba(103, 194, 58, 0.3);
      }
    }
  }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.dashboard-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }
  }
}

.heart-rate-display {
  text-align: center;
  position: relative;
  padding: 40px 0;

  .current-value {
    font-size: 64px;
    font-weight: 700;
    
    .unit {
      font-size: 24px;
      opacity: 0.7;
    }
  }

  &.optimal { color: #67c23a; }
  &.too-high { color: #f56c6c; }
  &.too-low { color: #e6a23c; }
}

.zone-distribution {
  margin-top: 24px;

  .zone-bars {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .zone-bar {
    position: relative;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    overflow: hidden;

    .zone-progress {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      transition: width 0.3s ease;
    }

    .zone-info {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 12px;
      height: 100%;
    }
  }
}

.breathing-animation {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;

  .breath-circle {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4CAF50, #81C784);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
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

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;

  .achievement-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-2px);
    }

    .value {
      font-size: 24px;
      font-weight: 600;
      color: #409EFF;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .session-header {
    flex-direction: column;
    gap: 16px;
  }

  .breathing-animation {
    min-height: 200px;

    .breath-circle {
      width: 150px;
      height: 150px;
    }
  }
}

// 动画
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

@keyframes heartbeat {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
</style> 