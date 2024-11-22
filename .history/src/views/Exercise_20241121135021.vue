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
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useHeartRateChart } from '@/composables/useHeartRateChart'
import { useExerciseTimer } from '@/composables/useExerciseTimer'
import { calculateCaloriesBurned, getHeartRateZone } from '@/utils/exerciseUtils'
import { HeartRateZone } from '@/types/exercise'
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
            color: '#409EFF'
          }
        }]
      }
      chart.setOption(option)
    }

    const updateChart = () => {
      if (!chart) return
      
      const data = heartRateHistory.value
      const times = Array.from({ length: data.length }, (_, i) => 
        formatTime(i * 5)
      )

      chart.setOption({
        xAxis: {
          data: times
        },
        series: [{
          data: data
        }]
      })
    }

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const isInZone = (zone) => {
      return currentHeartRate.value >= zone.min && currentHeartRate.value < zone.max
    }

    const startExercise = () => {
      hasStarted.value = true
      isExercising.value = true
      startTimer()
      // 模拟心跳动画
      setInterval(() => {
        isBeating.value = true
        setTimeout(() => {
          isBeating.value = false
        }, 200)
      }, 1000)
    }

    const pauseExercise = () => {
      isExercising.value = false
      stopTimer()
    }

    const toggleExercise = () => {
      if (isExercising.value) {
        pauseExercise()
      } else {
        startExercise()
      }
    }

    const startTimer = () => {
      timer = setInterval(() => {
        elapsedTime.value++
        // 每5秒记录一次心率数据
        if (elapsedTime.value % 5 === 0) {
          heartRateHistory.value.push(currentHeartRate.value)
          updateChart()
        }
        // 定期更新训练提示
        if (elapsedTime.value % 30 === 0) {
          currentTip.value = trainingTips[Math.floor(Math.random() * trainingTips.length)]
        }
      }, 1000)
    }

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const confirmStop = async () => {
      try {
        await ElMessageBox.confirm(
          '确定要结束本次训练吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        stopTimer()
        // 这里可以添加保存训练数据的逻辑
        router.push('/')
      } catch {
        // 用户取消
      }
    }

    const confirmExit = async () => {
      if (hasStarted.value) {
        await confirmStop()
      } else {
        router.back()
      }
    }

    // 生命周期钩子
    onMounted(() => {
      initChart()
      // 模拟心率数据更新
      setInterval(() => {
        // 这里替换为实际的心率数据
        currentHeartRate.value = Math.floor(70 + Math.random() * 30)
      }, 1000)
    })

    onUnmounted(() => {
      stopTimer()
      if (chart) {
        chart.dispose()
      }
    })

    return {
      router,
      chartContainer,
      isExercising,
      hasStarted,
      elapsedTime,
      currentHeartRate,
      averageHeartRate,
      caloriesBurned,
      heartRateZones,
      currentTip,
      isBeating,
      formatTime,
      isInZone,
      toggleExercise,
      confirmStop,
      confirmExit
    }
  }
}
</script>

<style scoped>
.exercise {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.exercise-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.metrics-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.metric-card {
  padding: 20px;
  text-align: center;
}

.heart-rate {
  position: relative;
  overflow: hidden;
}

.metric-value {
  font-size: 48px;
  font-weight: bold;
  color: #409EFF;
}

.metric-value .unit {
  font-size: 24px;
  color: #666;
  margin-left: 8px;
}

.metric-label {
  color: #666;
  margin-top: 10px;
}

.training-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.stat-label {
  color: #666;
  margin-top: 5px;
  font-size: 14px;
}

.chart-card {
  margin-bottom: 20px;
}

.heart-rate-chart {
  height: 300px;
}

.zone-indicator {
  margin-bottom: 20px;
}

.zone-label {
  margin-bottom: 10px;
  color: #666;
}

.zone-bars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.zone-bar {
  padding: 10px;
  border-radius: 4px;
  text-align: center;
  color: white;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.zone-bar.active {
  opacity: 1;
}

.zone-bar span {
  display: block;
  font-size: 12px;
  margin-top: 4px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

.heart-animation {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(64,158,255,0.2) 0%, rgba(64,158,255,0) 70%);
  border-radius: 50%;
  z-index: 0;
  opacity: 0;
  transition: transform 0.2s, opacity 0.2s;
}

.heart-animation.beating {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2);
}

.training-tips {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 600px;
  z-index: 100;
}

.is-exercising {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .metrics-container {
    grid-template-columns: 1fr;
  }

  .zone-bars {
    grid-template-columns: 1fr;
  }
}
</style> 