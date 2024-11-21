<template>
  <div class="exercise">
    <header class="exercise-header">
      <el-button @click="confirmExit" icon="el-icon-arrow-left" plain>
        返回
      </el-button>
      <h1>呼吸训练</h1>
    </header>

    <main class="exercise-content">
      <!-- 心率实时显示卡片 -->
      <div class="metrics-container">
        <el-card class="metric-card heart-rate">
          <div class="metric-value">
            <span class="value">{{ currentHeartRate }}</span>
            <span class="unit">BPM</span>
          </div>
          <div class="metric-label">实时心率</div>
          <div class="heart-animation" :class="{ beating: isBeating }"></div>
        </el-card>

        <!-- 训练数据卡片 -->
        <el-card class="metric-card">
          <div class="training-stats">
            <div class="stat-item">
              <div class="stat-value">{{ formatTime(elapsedTime) }}</div>
              <div class="stat-label">训练时长</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ averageHeartRate }}</div>
              <div class="stat-label">平均心率</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ caloriesBurned }}</div>
              <div class="stat-label">消耗热量</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 心率趋势图 -->
      <el-card class="chart-card">
        <div ref="chartContainer" class="heart-rate-chart"></div>
      </el-card>

      <!-- 心率区间指示器 -->
      <el-card class="zone-indicator">
        <div class="zone-label">心率区间</div>
        <div class="zone-bars">
          <div 
            v-for="zone in heartRateZones" 
            :key="zone.name"
            class="zone-bar"
            :class="{ active: isInZone(zone) }"
            :style="{ backgroundColor: zone.color }"
          >
            {{ zone.name }}
            <span>{{ zone.range }}</span>
          </div>
        </div>
      </el-card>

      <!-- 控制按钮 -->
      <div class="controls">
        <el-button 
          type="primary" 
          size="large" 
          round
          :class="{ 'is-exercising': isExercising }"
          @click="toggleExercise"
        >
          {{ isExercising ? '暂停训练' : '开始训练' }}
        </el-button>
        <el-button 
          type="danger" 
          size="large" 
          round
          @click="confirmStop"
          :disabled="!hasStarted"
        >
          结束训练
        </el-button>
      </div>
    </main>

    <!-- 训练提示 -->
    <div class="training-tips" v-if="isExercising">
      <el-alert
        :title="currentTip"
        type="info"
        :closable="false"
        show-icon
      >
      </el-alert>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import BluetoothService from '@/services/BluetoothService'

export default {
  name: 'Exercise',
  setup() {
    const router = useRouter()
    const bluetoothService = BluetoothService.getInstance()
    const chartContainer = ref(null)
    let chart = null

    // 状态变量
    const isExercising = ref(false)
    const hasStarted = ref(false)
    const elapsedTime = ref(0)
    const currentHeartRate = ref(0)
    const heartRateHistory = ref([])
    const isBeating = ref(false)
    let timer = null

    // 心率区间定义
    const heartRateZones = [
      { name: '热身', range: '60-70', min: 60, max: 70, color: '#91CC75' },
      { name: '燃脂', range: '70-80', min: 70, max: 80, color: '#FAC858' },
      { name: '有氧', range: '80-90', min: 80, max: 90, color: '#EE6666' },
      { name: '无氧', range: '90+', min: 90, max: 200, color: '#73C0DE' },
    ]

    // 训练提示
    const trainingTips = [
      '保持深呼吸，感受心率的变化',
      '注意呼吸节奏，保持放松状态',
      '调整呼吸频率，使心率保持在目标区间',
      '如果感觉不适，请及时暂停休息'
    ]
    const currentTip = ref(trainingTips[0])

    // 计算属性
    const averageHeartRate = computed(() => {
      if (heartRateHistory.value.length === 0) return 0
      const sum = heartRateHistory.value.reduce((a, b) => a + b, 0)
      return Math.round(sum / heartRateHistory.value.length)
    })

    const caloriesBurned = computed(() => {
      // 简单的卡路里计算公式（仅供参考）
      return Math.round((elapsedTime.value / 60) * 4.5)
    })

    // 方法
    const initChart = () => {
      if (!chartContainer.value) return

      chart = echarts.init(chartContainer.value)
      const option = {
        grid: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 50
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: []
        },
        yAxis: {
          type: 'value',
          min: 40,
          max: 200
        },
        series: [{
          name: '心率',
          type: 'line',
          smooth: true,
          data: [],
          areaStyle: {
            opacity: 0.3
          },
          lineStyle: {
            width: 2
          },
          itemStyle: {
    <!-- 呼吸动画 -->
    <breathing-animation 
      :phase="currentPhase"
      :is-active="isActive"
      :current-time="currentTime"
    />

    <!-- 准备步骤 -->
    <div class="preparation-steps">
      <div 
        v-for="(step, index) in preparationSteps" 
        :key="index"
        class="step-item"
        :class="{ 
          'completed': currentStepIndex > index,
          'active': currentStepIndex === index 
        }"
        @click="handleStepClick(index)"
      >
        <div class="step-number">{{ index + 1 }}</div>
        <div class="step-content">
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </div>
        <div class="step-status">
          <i v-if="currentStepIndex > index" class="icon-check"></i>
        </div>
      </div>
    </div>

    <!-- 开始按钮 -->
    <div class="action-buttons">
      <button 
        class="start-button"
        :disabled="!canStart"
        @click="startTraining"
      >
        {{ startButtonText }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BreathingAnimation from '@/components/breathing/BreathingAnimation.vue'
import { useBreathingStore } from '@/stores/breathing'

export default {
  name: 'Exercise',
  
  components: {
    BreathingAnimation
  },

  setup() {
    const router = useRouter()
    const store = useBreathingStore()
    const currentStepIndex = ref(0)
    const isActive = ref(false)
    const currentTime = ref(0)
    const deviceConnected = ref(false)

    const preparationSteps = [
      {
        title: '调整姿势',
        description: '找一个安静的地方，采用舒适的坐姿或躺姿',
        action: () => { /* 姿势调整逻辑 */ }
      },
      {
        title: '佩戴设备',
        description: '将呼吸带轻轻系在腹部，确保不会滑动',
        action: async () => {
          // 尝试连接设备
          try {
            await store.connectDevice()
            deviceConnected.value = true
          } catch (error) {
            console.error('设备连接失败:', error)
          }
        }
      },
      {
        title: '设备检查',
        description: '等待设备连接并校准完成',
        action: async () => {
          // 设备校准逻辑
          await store.calibrateDevice()
        }
      }
    ]

    const handleStepClick = async (index) => {
      if (index <= currentStepIndex.value + 1) {
        currentStepIndex.value = index
        await preparationSteps[index].action()
      }
    }

    const startTraining = () => {
      if (canStart.value) {
        store.startSession()
        router.push('/training')
      }
    }

    const pageTitle = computed(() => '准备开始')
    const currentPhase = computed(() => 'prepare')
    const canStart = computed(() => 
      currentStepIndex.value === preparationSteps.length - 1 && 
      deviceConnected.value
    )
    const startButtonText = computed(() => 
      canStart.value ? '开始训练' : '请完成准备步骤'
    )

    return {
      currentStepIndex,
      preparationSteps,
      isActive,
      currentTime,
      currentPhase,
      pageTitle,
      canStart,
      startButtonText,
      handleStepClick,
      startTraining
    }
  }
}
</script>

<style scoped>
.exercise-container {
  padding: 20px;
  height: 100vh;
}

.exercise-header {
  text-align: center;
  margin-bottom: 20px;
}

.exercise-header h1 {
  font-size: 24px;
  color: #333;
}

.preparation-steps {
  margin-top: 20px;
}

.step-item {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: #f9f9f9;
  transition: all 0.3s ease;
}

.step-item.completed {
  background: #e6f3ff;
  border: 1px solid #4a90e2;
}

.step-item.active {
  background: #e6f3ff;
  border: 1px solid #4a90e2;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #4a90e2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.step-content h3 {
  font-size: 16px;
  margin-bottom: 4px;
}

.step-content p {
  font-size: 14px;
  color: #666;
}

.step-status {
  margin-left: 16px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.start-button {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-button:disabled {
  background: #f5f5f5;
  color: #666;
}
</style> 