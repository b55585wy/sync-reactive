<template>
  <div class="device-connection">
    <!-- 设备连接状态卡片 -->
    <div class="status-cards">
      <div class="device-grid">
        <!-- 呼吸带卡片 -->
        <div class="device-card" :class="{ active: isBreathingBandConnected }">
          <div class="device-icon">
            <i class="icon-breathing"></i>
          </div>
          <div class="device-info">
            <h3>呼吸带</h3>
            <span :class="['status', isBreathingBandConnected ? 'connected' : '']">
              {{ isBreathingBandConnected ? '已连接' : '未连接' }}
            </span>
          </div>
          <button @click="handleDeviceAction('breathing')" :class="{ connected: isBreathingBandConnected }">
            {{ isBreathingBandConnected ? '断开连接' : '连接设备' }}
          </button>
        </div>

        <!-- 心率带卡片 -->
        <div class="device-card" :class="{ active: isHeartRateBandConnected }">
          <div class="device-icon">
            <i class="icon-heart"></i>
          </div>
          <div class="device-info">
            <h3>心率带</h3>
            <span :class="['status', isHeartRateBandConnected ? 'connected' : '']">
              {{ isHeartRateBandConnected ? '已连接' : '未连接' }}
            </span>
          </div>
          <button @click="handleDeviceAction('heartRate')" :class="{ connected: isHeartRateBandConnected }">
            {{ isHeartRateBandConnected ? '断开连接' : '连接设备' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 功能展示区域 -->
    <div class="features-section" v-if="hasAnyDeviceConnected">
      <!-- 呼吸带功能 -->
      <div class="feature-group" v-if="isBreathingBandConnected">
        <h2>呼吸训练</h2>
        <div class="feature-cards">
          <div class="feature-card" @click="startFeature('guided-breathing')">
            <div class="feature-icon">
              <i class="icon-guided"></i>
            </div>
            <h4>引导式呼吸</h4>
            <p>跟随节奏进行呼吸训练</p>
          </div>
          
          <div class="feature-card" @click="startFeature('box-breathing')">
            <div class="feature-icon">
              <i class="icon-box"></i>
            </div>
            <h4>箱式呼吸</h4>
            <p>4-4-4-4节奏呼吸法</p>
          </div>
          
          <div class="feature-card" @click="startFeature('relaxation')">
            <div class="feature-icon">
              <i class="icon-relax"></i>
            </div>
            <h4>放松训练</h4>
            <p>缓解压力的呼吸练习</p>
          </div>
        </div>
      </div>

      <!-- 心率带功能 -->
      <div class="feature-group" v-if="isHeartRateBandConnected">
        <h2>心率监测</h2>
        <div class="feature-cards">
          <div class="feature-card" @click="startFeature('heart-monitor')">
            <div class="feature-icon">
              <i class="icon-monitor"></i>
            </div>
            <h4>实时心率</h4>
            <p>查看实时心率数据</p>
          </div>
          
          <div class="feature-card" @click="startFeature('hrv-analysis')">
            <div class="feature-icon">
              <i class="icon-hrv"></i>
            </div>
            <h4>HRV分析</h4>
            <p>心率变异性分析</p>
          </div>
          
          <div class="feature-card" @click="startFeature('stress-level')">
            <div class="feature-icon">
              <i class="icon-stress"></i>
            </div>
            <h4>压力水平</h4>
            <p>基于心率的压力评估</p>
          </div>
        </div>
      </div>

      <!-- 双设备高级功能 -->
      <div class="feature-group premium" v-if="isBreathingBandConnected && isHeartRateBandConnected">
        <h2>高级训练模式</h2>
        <div class="feature-cards">
          <div class="feature-card premium" @click="startFeature('coherence')">
            <div class="feature-icon">
              <i class="icon-coherence"></i>
            </div>
            <h4>心肺协调训练</h4>
            <p>提升心肺协调能力</p>
            <span class="premium-badge">双设备专属</span>
          </div>
          
          <div class="feature-card premium" @click="startFeature('meditation')">
            <div class="feature-icon">
              <i class="icon-meditation"></i>
            </div>
            <h4>冥想指导</h4>
            <p>心率反馈辅助冥想</p>
            <span class="premium-badge">双设备专属</span>
          </div>
          
          <div class="feature-card premium" @click="startFeature('performance')">
            <div class="feature-icon">
              <i class="icon-performance"></i>
            </div>
            <h4>性能评估</h4>
            <p>综合心肺功能评估</p>
            <span class="premium-badge">双设备专属</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 未连接设备时的提示 -->
    <div class="empty-state" v-else>
      <div class="empty-icon">
        <i class="icon-connect"></i>
      </div>
      <h3>请连接设备开始训练</h3>
      <p>连接呼吸带或心率带以解锁相应功能</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import BluetoothService from '@/services/BluetoothService'

const router = useRouter();
const isBreathingBandConnected = ref(false);
const isHeartRateBandConnected = ref(false);

const hasAnyDeviceConnected = computed(() => 
  isBreathingBandConnected.value || isHeartRateBandConnected.value
);

const handleDeviceAction = async (type: 'breathing' | 'heartRate') => {
  if (type === 'breathing') {
    if (isBreathingBandConnected.value) {
      // 断开连接逻辑
      isBreathingBandConnected.value = false;
    } else {
      // 连接逻辑
      isBreathingBandConnected.value = true;
    }
  } else {
    if (isHeartRateBandConnected.value) {
      // 断开连接逻辑
      isHeartRateBandConnected.value = false;
    } else {
      // 连接逻辑
      isHeartRateBandConnected.value = true;
    }
  }
};

const startFeature = (feature: string) => {
  router.push(`/training/${feature}`);
};

const bluetoothService = new BluetoothService()

// 组件销毁时清理
onUnmounted(() => {
  bluetoothService.destroy()
})
</script>

<style scoped>
.device-connection {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.device-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.device-card.active {
  border: 2px solid #4CAF50;
}

.device-icon {
  width: 48px;
  height: 48px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.feature-card.premium {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.premium-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255,255,255,0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.feature-group {
  margin-bottom: 32px;
}

.feature-group h2 {
  margin-bottom: 16px;
  color: #333;
  font-size: 24px;
}

.empty-state {
  text-align: center;
  padding: 48px;
  background: #f5f5f5;
  border-radius: 12px;
  margin-top: 32px;
}

.empty-icon {
  font-size: 48px;
  color: #999;
  margin-bottom: 16px;
}

button {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: #1976D2;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

button.connected {
  background: #4CAF50;
}

.status {
  font-size: 14px;
  color: #666;
}

.status.connected {
  color: #4CAF50;
}

/* 添加响应式设计 */
@media (max-width: 768px) {
  .device-grid {
    grid-template-columns: 1fr;
  }
  
  .feature-cards {
    grid-template-columns: 1fr;
  }
}
</style> 