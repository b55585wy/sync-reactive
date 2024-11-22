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
          <div class="current-value">{{ bluetoothService.getHeartRate() }}</div>
          <div class="unit">BPM</div>
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
        <div class="breathing-guide">
          <div class="breathing-circle" :class="breathingPhase">
            {{ breathingText }}
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import BluetoothService from '@/services/BluetoothService';
import { ElMessageBox } from 'element-plus';
import { useTrainingStore } from '@/stores/training';

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

// 状态管理
const elapsedTime = ref(0);
const maxHeartRate = ref(0);
const minHeartRate = ref(999);
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
    
    // 清理定时器
    clearInterval(timer);
    clearInterval(breathingTimer);
    
    // 结束训练并断开设备连接
    trainingStore.endTraining();
    await bluetoothService.disconnectHeartRateBand();
    
    // 导航到总结页面
    await router.push({
      name: 'TrainingSummary',
      query: {
        duration: elapsedTime.value.toString(),
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

// 生命周期钩子
onMounted(() => {
  trainingStore.startTraining();
  
  // 开始计时
  timer = setInterval(() => {
    elapsedTime.value++;
    updateHeartRateStats();
    
    if (elapsedTime.value >= props.duration * 60) {
      endSession();
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
  clearInterval(timer);
  clearInterval(breathingTimer);
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
  text-align: center;
  margin: 24px 0;
}

.current-value {
  font-size: 64px;
  font-weight: bold;
  color: #ff5252;
  line-height: 1;
}

.breathing-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  margin: 24px auto;
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
</style> 