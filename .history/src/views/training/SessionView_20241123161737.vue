<template>
  <div class="training-session">
    <!-- Header and status bar -->
    <header class="status-bar">
      <!-- ... (header content remains the same) ... -->
    </header>

    <!-- Main content area -->
    <main class="dashboard-grid">
      <!-- Heart rate monitoring card -->
      <div v-if="showHeartRate" class="dashboard-card primary-card">
        <!-- ... (heart rate card content remains the same) ... -->
      </div>

      <!-- Breathing guidance card -->
      <div v-if="showBreathing" class="dashboard-card">
        <!-- ... (breathing card content remains the same) ... -->
      </div>

      <!-- Training status card -->
      <div class="dashboard-card status-card">
        <!-- ... (status card content remains the same) ... -->
      </div>

      <!-- Real-time advice card -->
      <div v-if="currentAdvice" class="dashboard-card advice-card">
        <!-- ... (advice card content remains the same) ... -->
      </div>
    </main>

    <!-- Footer control bar -->
    <footer class="control-bar">
      <!-- ... (footer content remains the same) ... -->
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
import { generateTrainingAdvice } from '@/utils/trainingAdvice';
import {
  ArrowLeft, Monitor, Odometer, TopRight, BottomRight, TrendCharts,
  WindPower, Timer, DataAnalysis, ChatDotRound, VideoPlay, VideoPause, CircleClose
} from '@element-plus/icons-vue';

// Props
const props = withDefaults(defineProps<{
  mode?: 'breathing' | 'heartRate' | 'combined';
  duration?: number;
}>(), {
  mode: 'heartRate',
  duration: 3
});

// Store instances
const router = useRouter();
const trainingStore = useTrainingStore();
const deviceStore = useDeviceStore();
const settingsStore = useSettingsStore();

// Reactive state
const elapsedTime = ref(0);
const heartRateHistory = ref<number[]>([]);
const maxHeartRate = ref(0);
const minHeartRate = ref(999);
const avgHeartRate = ref(0);
const heartRateSum = ref(0);
const heartRateCount = ref(0);
const breathingPhase = ref('inhale');
const breathingCountdown = ref(settingsStore.inhaleTime);
const isPaused = ref(false);
const currentPhase = ref('准备阶段');
const currentAdvice = ref(null);
const isBeating = ref(false);

// Timers
let mainTimer: number | null = null;

// Computed properties
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

const showHeartRate = computed(() => props.mode === 'heartRate' || props.mode === 'combined');
const showBreathing = computed(() => props.mode === 'breathing' || props.mode === 'combined');
const remainingTime = computed(() => (props.duration * 60) - elapsedTime.value);
const progressColor = computed(() => {
  const progress = (elapsedTime.value / (props.duration * 60)) * 100;
  if (progress < 30) return '#ff9800';
  if (progress < 60) return '#4caf50';
  if (progress < 90) return '#2196f3';
  return '#9c27b0';
});

const getIntensityText = computed(() => {
  switch (getIntensityLevel.value) {
    case 'high': return '过高';
    case 'low': return '过低';
    case 'optimal': return '适中';
    default: return '未知';
  }
});

// Methods
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const updateHeartRateStats = (newRate: number) => {
  if (newRate > 0) {
    heartRateHistory.value.push(newRate);
    maxHeartRate.value = Math.max(maxHeartRate.value, newRate);
    minHeartRate.value = Math.min(minHeartRate.value, newRate);
    heartRateSum.value += newRate;
    heartRateCount.value++;
    avgHeartRate.value = Math.round(heartRateSum.value / heartRateCount.value);
    trainingStore.addHeartRateRecord(newRate);
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
    breathingRate: 0, // You might want to calculate this
    elapsedTime: elapsedTime.value
  });
};

const togglePause = () => {
  isPaused.value = !isPaused.value;
  if (isPaused.value) {
    if (mainTimer) clearInterval(mainTimer);
    currentPhase.value = '已暂停';
  } else {
    startMainTimer();
    currentPhase.value = '训练中';
  }
};

const confirmEndSession = async () => {
  try {
    await ElMessageBox.confirm('确定要结束本次训练吗？', '结束训练', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    if (mainTimer) clearInterval(mainTimer);
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

const confirmExit = async () => {
  try {
    await ElMessageBox.confirm('确定要退出训练吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    router.back();
  } catch {
    // User cancelled
  }
};

const startMainTimer = () => {
  mainTimer = setInterval(() => {
    elapsedTime.value++;
    if (deviceStore.currentHeartRate > 0) {
      updateHeartRateStats(deviceStore.currentHeartRate);
    }
    if (props.mode === 'breathing' || props.mode === 'combined') {
      updateBreathing();
    }
    updateAdvice();
    isBeating.value = true;
    setTimeout(() => {
      isBeating.value = false;
    }, 200);
  }, 1000);
};

// Watchers
watch(() => deviceStore.currentHeartRate, (newRate) => {
  if (newRate > 0) {
    console.log('SessionView 接收到新心率:', newRate);
    updateHeartRateStats(newRate);
  }
}, { immediate: true });

// Lifecycle hooks
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
    startMainTimer();
  } catch (error) {
    console.error('初始化训练失败:', error);
    ElMessage.error('初始化训练失败');
  }
});

onUnmounted(() => {
  if (mainTimer) clearInterval(mainTimer);
});
</script>

<style scoped>
/* ... (styles remain the same) ... */
</style>