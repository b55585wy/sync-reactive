import { useSettingsStore } from '@/stores/settings'

<template>
  <div class="training-session">
    <!-- 顶部状态栏增强 -->
    <div class="session-header">
      <div class="session-info">
        <h2>{{ getSessionTitle }}</h2>
        <div class="session-meta">
          <span class="session-timer">{{ formatTime(elapsedTime) }}</span>
          <span class="session-phase">{{ currentPhase }}</span>
        </div>
      </div>
      <div class="session-actions">
        <el-button @click="togglePause" :icon="isPaused ? 'Play' : 'Pause'" circle />
        <el-button class="btn-end" @click="confirmEndSession">结束训练</el-button>
      </div>
    </div>

    <div class="data-display">
      <!-- 心率数据卡片增强 -->
      <div class="data-card heart-rate" v-if="showHeartRate">
        <div class="heart-rate-display">
          <div class="current-value" :class="getHeartRateStatus">
            {{ deviceStore.currentHeartRate || '--' }}
            <span class="unit">BPM</span>
          </div>
          
          <!-- 添加心率变化趋势小图 -->
          <div class="mini-trend">
            <SparklineChart 
              :data="recentHeartRates"
              :target-range="[settingsStore.targetHeartRateMin, settingsStore.targetHeartRateMax]"
            />
          </div>
          
          <!-- 优化目标范围显示 -->
          <div class="target-range">
            <el-progress 
              :percentage="getHeartRatePercentage"
              :color="getHeartRateColor"
              :format="formatHeartRateProgress"
              stroke-width="8"
            />
            <div class="range-labels">
              <span>{{ settingsStore.targetHeartRateMin }}</span>
              <span>目标范围</span>
              <span>{{ settingsStore.targetHeartRateMax }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 呼吸引导卡片增强 -->
      <div class="data-card breathing" v-if="showBreathing">
        <div class="breathing-guide" :class="breathingPhase">
          <!-- 添加动态波纹效果 -->
          <div class="ripple-container">
            <div v-for="i in 3" :key="i" 
                 class="ripple" 
                 :style="{ animationDelay: `${i * 0.5}s` }"
            ></div>
          </div>
          
          <div class="breathing-circle">
            <div class="breathing-animation" :class="breathingPhase">
              <div class="circle-inner">
                <div class="instruction">{{ getBreathingInstruction }}</div>
                <div class="countdown">{{ breathingCountdown }}s</div>
              </div>
            </div>
          </div>
          
          <!-- 添加呼吸频率指示器 -->
          <div class="breathing-rate">
            <span>呼吸频率</span>
            <div class="rate-value">{{ breathingRate }} 次/分</div>
            <el-slider
              v-model="breathingRate"
              :min="4"
              :max="8"
              :step="1"
              show-stops
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 添加智能建议面板 -->
    <div class="advice-panel" v-if="currentAdvice">
      <el-alert
        :title="currentAdvice.title"
        :type="currentAdvice.type"
        :description="currentAdvice.content"
        show-icon
        :closable="false"
      />
    </div>

    <!-- 优化进度条 -->
    <div class="progress-container">
      <div class="progress-stats">
        <span>完成进度 {{ Math.round(progress) }}%</span>
        <span>剩余 {{ formatTime(remainingTime) }}</span>
      </div>
      <el-progress 
        :percentage="progress"
        :stroke-width="12"
        :color="progressColor"
      />
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
</style> 