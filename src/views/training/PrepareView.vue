<template>
  <div class="training-prepare">
    <!-- 设备状态区域 -->
    <section class="device-status-section">
      <h2>设备状态</h2>
      <div class="device-cards">
        <div class="device-card" :class="{ active: deviceStore.isBreathingBandConnected }">
          <div class="device-icon">
            <i class="icon-breathing"></i>
          </div>
          <div class="device-info">
            <h3>呼吸带</h3>
            <p>{{ deviceStore.isBreathingBandConnected ? '已连接' : '未连接' }}</p>
          </div>
          <button @click="connectDevice('breathing')" :disabled="isConnecting">
            {{ deviceStore.isBreathingBandConnected ? '断开连接' : '连接设备' }}
          </button>
        </div>

        <div class="device-card" :class="{ active: deviceStore.isHeartRateBandConnected }">
          <div class="device-icon">
            <i class="icon-heart-rate"></i>
          </div>
          <div class="device-info">
            <h3>心率带</h3>
            <p>{{ deviceStore.isHeartRateBandConnected ? '已连接' : '未连接' }}</p>
          </div>
          <button @click="connectDevice('heartRate')" :disabled="isConnecting">
            {{ deviceStore.isHeartRateBandConnected ? '断开连接' : '连接设备' }}
          </button>
        </div>
      </div>
    </section>

    <!-- 训练模式选择 -->
    <section class="training-modes-section">
      <h2>选择训练模式</h2>
      <div class="mode-cards">
        <!-- 基础呼吸训练 -->
        <div class="mode-card" 
          :class="{ available: deviceStore.isBreathingBandConnected }"
          @click="selectMode('breathing')"
        >
          <div class="mode-icon">
            <i class="icon-breathing-training"></i>
          </div>
          <h3>基础呼吸训练</h3>
          <p>通过呼吸带指导，帮助您掌握正确的呼吸节奏</p>
          <div class="mode-requirements">
            <span class="required-device">需要呼吸带</span>
          </div>
        </div>

        <!-- 心率监测训练 -->
        <div class="mode-card" 
          :class="{ available: deviceStore.isHeartRateBandConnected }"
          @click="selectMode('heartRate')"
        >
          <div class="mode-icon">
            <i class="icon-heart-training"></i>
          </div>
          <h3>心率监测训练</h3>
          <p>实时监测心率变化，优化您的训练强度</p>
          <div class="mode-requirements">
            <span class="required-device">需要心率带</span>
          </div>
        </div>

        <!-- 高级综合训练 -->
        <div class="mode-card premium" 
          :class="{ available: deviceStore.isBreathingBandConnected && deviceStore.isHeartRateBandConnected }"
          @click="selectMode('combined')"
        >
          <div class="premium-badge">高级模式</div>
          <div class="mode-icon">
            <i class="icon-combined-training"></i>
          </div>
          <h3>高级综合训练</h3>
          <p>结合呼吸和心率数据，提供专业级训练体验</p>
          <div class="mode-requirements">
            <span class="required-device">需要呼吸带</span>
            <span class="required-device">需要心率带</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 训练设置 -->
    <section class="training-settings" v-if="selectedMode">
      <h2>训练设置</h2>
      <div class="settings-card">
        <div class="setting-item">
          <label>训练时长</label>
          <div class="duration-selector">
            <button 
              v-for="duration in [3, 5, 10, 15, 20]" 
              :key="duration"
              :class="{ active: selectedDuration === duration }"
              @click="selectedDuration = duration"
            >
              {{ duration }}分钟
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 开始训练按钮 -->
    <div class="action-area">
      <button 
        class="btn-start" 
        :disabled="!canStartTraining"
        @click="startTraining"
      >
        开始训练
      </button>
      <p class="hint-text" v-if="!canStartTraining">
        {{ getStartHintText }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDeviceStore } from '@/stores/device';

const router = useRouter();
const deviceStore = useDeviceStore();

const isConnecting = ref(false);
const selectedMode = ref<string | null>(null);
const selectedDuration = ref(3);

// 连接设备
const connectDevice = async (type: 'breathing' | 'heartRate') => {
  if (isConnecting.value) return;
  
  isConnecting.value = true;
  try {
    if (type === 'breathing') {
      if (deviceStore.isBreathingBandConnected) {
        await deviceStore.disconnectBreathingBand();
      } else {
        await deviceStore.connectBreathingBand();
      }
    } else {
      if (deviceStore.isHeartRateBandConnected) {
        await deviceStore.disconnectHeartRateBand();
      } else {
        await deviceStore.connectHeartRateBand();
      }
    }
  } catch (error) {
    console.error('设备操作失败:', error);
  } finally {
    isConnecting.value = false;
  }
};

// 选择训练模式
const selectMode = (mode: string) => {
  if (mode === 'breathing' && !deviceStore.isBreathingBandConnected) return;
  if (mode === 'heartRate' && !deviceStore.isHeartRateBandConnected) return;
  if (mode === 'combined' && (!deviceStore.isBreathingBandConnected || !deviceStore.isHeartRateBandConnected)) return;
  
  selectedMode.value = mode;
};

// 检查是否可以开始训练
const canStartTraining = computed(() => {
  if (!selectedMode.value) return false;
  
  switch (selectedMode.value) {
    case 'breathing':
      return deviceStore.isBreathingBandConnected;
    case 'heartRate':
      return deviceStore.isHeartRateBandConnected;
    case 'combined':
      return deviceStore.isBreathingBandConnected && deviceStore.isHeartRateBandConnected;
    default:
      return false;
  }
});

// 获取提示文本
const getStartHintText = computed(() => {
  if (!selectedMode.value) return '请选择训练模式';
  if (!canStartTraining.value) return '请连接所需设备';
  return '';
});

// 开始训练
const startTraining = async () => {
  if (!canStartTraining.value) return;
  
  try {
    await router.push({
      name: 'TrainingSession',
      query: {
        mode: selectedMode.value,
        duration: selectedDuration.value
      }
    });
  } catch (error) {
    console.error('启动训练失败:', error);
  }
};
</script>

<style scoped>
.training-prepare {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* 设备卡片样式 */
.device-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.device-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.device-card.active {
  border: 2px solid #4CAF50;
  background: linear-gradient(to right, #f8fff8, white);
}

/* 训练模式卡片样式 */
.mode-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.mode-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  opacity: 0.7;
}

.mode-card.available {
  opacity: 1;
  cursor: pointer;
}

.mode-card.available:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.mode-card.premium {
  background: linear-gradient(135deg, #f6f0ff, #fff);
  border: 2px solid #e0d6ff;
}

.premium-badge {
  position: absolute;
  top: -10px;
  right: 20px;
  background: linear-gradient(135deg, #7c4dff, #448aff);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

/* 设置区域样式 */
.settings-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-top: 20px;
}

.duration-selector {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.duration-selector button {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #eee;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.duration-selector button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .training-prepare {
    padding: 16px;
  }
  
  .device-cards,
  .mode-cards {
    grid-template-columns: 1fr;
  }
}

/* 动画效果 */
.mode-card {
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 