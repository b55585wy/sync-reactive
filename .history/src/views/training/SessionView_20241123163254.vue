<template>
  <div class="training-session">
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

    <main class="dashboard-grid">
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
          <div class="stat-item" v-for="(stat, index) in heartRateStats" :key="index">
            <el-icon :component="stat.icon" />
            <div class="stat-content">
              <span class="label">{{ stat.label }}</span>
              <span class="value">{{ stat.value }}</span>
            </div>
          </div>
        </div>

        <div class="heart-rate-chart" ref="chartRef"></div>
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

      <div class="dashboard-card status-card">
        <div class="card-header">
          <el-icon><DataAnalysis /></el-icon>
          <span>训练状态</span>
        </div>

        <div class="breathing-status">
          <div class="breathing-visualization">
            <div class="breathing-circle" :class="breathingPhase">
              <div class="circle-core">
                <div class="stats">
                  <div class="stat-value">{{ targetAchievementRate }}%</div>
                  <div class="stat-label">目标达成</div>
                </div>
              </div>
              <div class="breathing-rings">
                <div class="ring" v-for="i in 3" :key="i"></div>
              </div>
              <div class="breathing-hint" :class="breathingPhase">
                {{ getBreathingText }}
              </div>
            </div>
          </div>

          <div class="training-metrics">
            <div class="metric-item" v-for="(metric, index) in trainingMetrics" :key="index">
              <el-icon :component="metric.icon" />
              <div class="metric-content">
                <span class="value" :class="metric.valueClass">{{ metric.value }}</span>
                <span class="label">{{ metric.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

    <footer class="control-bar">
      <div class="control-buttons">
        <el-button-group>
          <el-button type="primary" circle size="large" @click="togglePause">
            <el-icon><component :is="isPaused ? 'VideoPlay' : 'VideoPause'" /></el-icon>
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
  ArrowLeft,
  Monitor,
  Odometer,
  DataAnalysis,
  ChatDotRound,
  VideoPlay,
  VideoPause,
  CircleClose
} from '@element-plus/icons-vue';

const router = useRouter();
const trainingStore = useTrainingStore();
const deviceStore = useDeviceStore();
const settingsStore = useSettingsStore();

const elapsedTime = ref(0);
const breathingPhase = ref('inhale');
const breathingCountdown = ref(settingsStore.inhaleTime);
const isPaused = ref(false);
const currentAdvice = ref(null);
let timer: number | null = null;

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const progress = computed(() => Math.round((elapsedTime.value / (props.duration * 60)) * 100));

onMounted(() => {
  timer = setInterval(() => elapsedTime.value++, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const togglePause = () => {
  isPaused.value = !isPaused.value;
  if (isPaused.value && timer) {
    clearInterval(timer);
    timer = null;
  } else {
    timer = setInterval(() => elapsedTime.value++, 1000);
  }
};

const confirmEndSession = async () => {
  try {
    await ElMessageBox.confirm('确定要结束本次训练吗？', '结束训练', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    router.push({ name: 'TrainingSummary' });
  } catch (error) {
    ElMessage.error('操作取消');
  }
};
</script>

<style scoped>
/* Add your styles here */
</style>
