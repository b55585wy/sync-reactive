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

    <!-- 仪表板 -->
    <main class="dashboard-grid">
      <div class="dashboard-card primary-card" v-if="showHeartRate">
        <div class="card-header">
          <el-icon><Monitor /></el-icon>
          <span>实时心率</span>
        </div>
        <div class="heart-rate-display">
          <div class="current-value">
            <span class="number">{{ deviceStore.currentHeartRate || '--' }}</span>
            <span class="unit">BPM</span>
          </div>
        </div>
      </div>
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
    </main>

    <!-- 底部控制栏 -->
    <footer class="control-bar">
      <div class="control-buttons">
        <el-button-group>
          <el-button type="primary" circle size="large" @click="togglePause">
            <el-icon>
              <component :is="isPaused ? VideoPlay : VideoPause" />
            </el-icon>
          </el-button>
          <el-button type="danger" circle size="large" @click="confirmEndSession">
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
import { ElMessageBox } from 'element-plus';
import { useTrainingStore } from '@/stores/training';
import { useDeviceStore } from '@/stores/device';
import { useSettingsStore } from '@/stores/settings';
import BreathingFlower from '@/components/breathing/BreathingFlower.vue';
import { ArrowLeft, Monitor, Odometer, WindPower, VideoPlay, VideoPause, CircleClose } from '@element-plus/icons-vue';

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

const router = useRouter();
const trainingStore = useTrainingStore();
const deviceStore = useDeviceStore();
const settingsStore = useSettingsStore();

// 响应式变量
const elapsedTime = ref(0); // 已训练时间（秒）
const isPaused = ref(false); // 暂停状态
const breathingPhase = ref('inhale'); // 当前呼吸阶段
const breathingCountdown = ref(10); // 呼吸倒计时

let timer: number | null = null;

// 计算属性
const progress = computed(() => Math.round((elapsedTime.value / (props.duration * 60)) * 100));
const remainingTime = computed(() => (props.duration * 60) - elapsedTime.value);
const progressColor = computed(() => {
  const progressValue = progress.value;
  if (progressValue < 30) return '#67c23a';
  if (progressValue < 60) return '#e6a23c';
  return '#f56c6c';
});
const showHeartRate = computed(() => props.mode === 'heartRate' || props.mode === 'combined');
const showBreathing = computed(() => props.mode === 'breathing' || props.mode === 'combined');

// 方法
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const togglePause = () => {
  isPaused.value = !isPaused.value;
  if (isPaused.value) {
    if (timer) clearInterval(timer);
  } else {
    startTimers();
  }
};

const startTimers = () => {
  timer = setInterval(() => elapsedTime.value++, 1000);
};

const confirmEndSession = async () => {
  try {
    await ElMessageBox.confirm('确定要结束本次训练吗？', '结束训练', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    endSession();
  } catch {
    // 用户取消操作
  }
};

const endSession = () => {
  if (timer) clearInterval(timer);
  router.push({ name: 'TrainingSummary' });
};

const confirmExit = async () => {
  try {
    await ElMessageBox.confirm('确定要退出训练吗？', '退出训练', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    router.push({ name: 'Training' });
  } catch {
    // 用户取消操作
  }
};

// 生命周期
onMounted(() => {
  console.log('组件挂载，Props:', props);
  startTimers();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.training-session {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f9f9f9;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 16px;
  flex-grow: 1;
  overflow-y: auto;
}

.dashboard-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-bar {
  padding: 16px;
  background-color: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
}

.indicator {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.indicator.active {
  background: #67c23a;
  color: white;
}
</style>
