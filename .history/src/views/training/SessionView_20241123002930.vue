<template>
  <div class="training-session">
    <!-- 顶部状态栏 -->
    <div class="session-header">
      <div class="session-info">
        <h2>{{ getSessionTitle }}</h2>
        <span class="session-timer">{{ formatTime(elapsedTime) }}</span>
      </div>
      <button class="btn-end" @click="confirmEndSession">结束训练</button>
    </div>

    <!-- 主要数据展示区 -->
    <div class="data-display">
      <!-- 心率数据卡片 -->
      <div class="data-card heart-rate" v-if="mode === 'heartRate' || mode === 'combined'">
        <div class="card-header">
          <i class="icon-heart-rate"></i>
          <h3>实时心率</h3>
        </div>
        <div class="heart-rate-display">
          <div class="current-value" :class="getHeartRateStatus">
            {{ currentHeartRate }}
          </div>
          <div class="target-indicator">
            <div class="target-range">
              目标: {{ targetHeartRateMin }} - {{ targetHeartRateMax }} BPM
            </div>
            <div class="guidance-message">{{ getGuidanceMessage }}</div>
          </div>
        </div>
        <div class="heart-rate-chart">
          <!-- 这里可以添加心率图表组件 -->
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <label>最高心率</label>
            <span>{{ maxHeartRate }}</span>
          </div>
          <div class="stat-item">
            <label>最低心率</label>
            <span>{{ minHeartRate }}</span>
          </div>
          <div class="stat-item">
            <label>平均心率</label>
            <span>{{ avgHeartRate }}</span>
          </div>
        </div>
      </div>

      <!-- 呼吸数据卡片 -->
      <div class="data-card breathing" v-if="mode === 'breathing' || mode === 'combined'">
        <div class="card-header">
          <i class="icon-breathing"></i>
          <h3>呼吸训练</h3>
        </div>
        <div class="breathing-guide" :class="breathingPhase">
          <div class="breathing-circle">
            <div class="instruction">{{ getBreathingInstruction }}</div>
            <div class="timer">{{ breathingTimer }}</div>
          </div>
        </div>
        <div class="breathing-stats">
          <div class="stat-item">
            <label>呼吸频率</label>
            <span>{{ breathingRate }} 次/分</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 训练进度条 -->
    <div class="progress-bar">
      <div class="progress" :style="{ width: `${progress}%` }"></div>
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

// 计时器
let timer: number;
let breathingTimer: number;

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
  if (currentHeartRate.value > targetHeartRateMax.value) return 'too-high';
  if (currentHeartRate.value < targetHeartRateMin.value) return 'too-low';
  return 'optimal';
});

const getGuidanceMessage = computed(() => {
  if (currentHeartRate.value > targetHeartRateMax.value) {
    return '心率偏高，请跟随呼吸引导放松';
  }
  if (currentHeartRate.value < targetHeartRateMin.value) {
    return '心率偏低，可以稍微提升呼吸频率';
  }
  return '心率处于理想范围，请保持当前节奏';
});

const getBreathingInstruction = computed(() => {
  switch(breathingPhase.value) {
    case 'inhale': return '吸气';
    case 'hold': return '屏息';
    case 'exhale': return '呼气';
    default: return '准备';
  }
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
    if (breathingTimer) clearInterval(breathingTimer);
    
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
    breathingTimer = setInterval(() => {
      breathingPhase.value = breathingPhase.value === 'inhale' ? 'exhale' : 'inhale';
    }, 5000); // 5秒一次呼吸循环
  }
});

onUnmounted(() => {
  // 确保组件卸载时清理资源
  clearInterval(timer);
  if (breathingTimer) clearInterval(breathingTimer);
});
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

.target-indicator {
  text-align: center;
  margin-top: 12px;
}

.target-range {
  font-size: 14px;
  color: #666;
}

.guidance-message {
  margin-top: 8px;
  font-size: 16px;
  color: #409EFF;
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
  flex-direction: column;
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
</style> 