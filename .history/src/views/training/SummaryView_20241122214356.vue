<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { useTrainingStore } from '@/stores/training';

const route = useRoute();
const router = useRouter();
const trainingStore = useTrainingStore();

// 训练数据，从 store 中获取实际数据
const trainingData = computed(() => {
  const heartRateHistory = trainingStore.heartRateHistory;
  const startTime = trainingStore.startTime;
  const duration = Number(route.query.duration || 0);
  
  // 计算心率统计数据
  const heartRates = heartRateHistory.map(h => h.value);
  const averageHeartRate = Math.round(
    heartRates.reduce((a, b) => a + b, 0) / heartRates.length
  );
  const maxHeartRate = Math.max(...heartRates);
  const minHeartRate = Math.min(...heartRates);
  
  // 计算心率区间分布
  const zones = calculateHeartRateZones(heartRates);
  
  // 估算卡路里消耗（简单示例，实际应考虑更多因素）
  const caloriesBurned = Math.round(
    (duration * averageHeartRate * 0.14)
  );
  
  return {
    duration,
    startTime: startTime || new Date().toISOString(),
    mode: route.params.mode || 'heart-monitoring',
    averageHeartRate,
    maxHeartRate,
    minHeartRate,
    heartRateZones: zones,
    caloriesBurned,
    heartRateData: heartRateHistory.map(h => ({
      value: h.value,
      timestamp: h.timestamp
    }))
  };
});

// 计算心率区间分布
const calculateHeartRateZones = (heartRates: number[]) => {
  const maxHR = 220 - 25; // 假设用户25岁，实际应该从用户信息获取
  const total = heartRates.length;
  
  const zones = {
    rest: 0,      // <60% max HR
    warmUp: 0,    // 60-70% max HR
    fatBurn: 0,   // 70-80% max HR
    cardio: 0,    // 80-90% max HR
    peak: 0       // >90% max HR
  };
  
  heartRates.forEach(hr => {
    const percentage = (hr / maxHR) * 100;
    if (percentage < 60) zones.rest++;
    else if (percentage < 70) zones.warmUp++;
    else if (percentage < 80) zones.fatBurn++;
    else if (percentage < 90) zones.cardio++;
    else zones.peak++;
  });
  
  // 转换为百分比
  return {
    rest: Math.round((zones.rest / total) * 100),
    warmUp: Math.round((zones.warmUp / total) * 100),
    fatBurn: Math.round((zones.fatBurn / total) * 100),
    cardio: Math.round((zones.cardio / total) * 100),
    peak: Math.round((zones.peak / total) * 100)
  };
};

// 训练评分计算（基于实际数据）
const trainingScore = computed(() => {
  const heartRateData = trainingData.value.heartRateData;
  
  // 计算心率稳定性（方差越小越稳定）
  const hrValues = heartRateData.map(h => h.value);
  const hrVariance = calculateVariance(hrValues);
  const stabilityScore = Math.min(100, Math.max(0, 100 - (hrVariance / 2)));
  
  // 计算训练强度（基于目标心率区间的时间）
  const intensityScore = Math.min(100, 
    (trainingData.value.heartRateZones.fatBurn + 
     trainingData.value.heartRateZones.cardio) * 1.2
  );
  
  // 计算时长达标率
  const targetDuration = Number(route.query.duration || 15) * 60; // 转换为秒
  const actualDuration = heartRateData.length; // 假设每秒一个数据点
  const durationScore = Math.min(100, (actualDuration / targetDuration) * 100);
  
  // 总体评分
  const overall = Math.round(
    (stabilityScore * 0.3) + 
    (intensityScore * 0.4) + 
    (durationScore * 0.3)
  );
  
  return {
    overall,
    stability: Math.round(stabilityScore),
    intensity: Math.round(intensityScore),
    duration: Math.round(durationScore)
  };
});

// 基于实际数据生成建议
const recommendations = computed(() => {
  const suggestions = [];
  const { averageHeartRate, heartRateZones } = trainingData.value;
  const { stability, intensity } = trainingScore.value;
  
  // 心率相关建议
  if (averageHeartRate > 85) {
    suggestions.push({
      type: 'warning',
      title: '心率偏高',
      content: '建议下次训练时适当降低运动强度，保持在舒适区间。'
    });
  }
  
  // 训练强度建议
  if (intensity < 60) {
    suggestions.push({
      type: 'info',
      title: '训练强度偏低',
      content: '为达到更好的训练效果，建议适当提高训练强度。'
    });
  } else if (intensity > 90) {
    suggestions.push({
      type: 'warning',
      title: '训练强度较高',
      content: '注意不要过度训练，建议适当调整强度。'
    });
  }
  
  // 心率稳定性建议
  if (stability < 70) {
    suggestions.push({
      type: 'info',
      title: '心率波动较大',
      content: '建议通过呼吸调节来稳定心率，保持匀速运动。'
    });
  }
  
  // 燃脂效果建议
  if (heartRateZones.fatBurn > 30) {
    suggestions.push({
      type: 'success',
      title: '良好的燃脂效果',
      content: '本次训练中有效燃脂时间占比较高，继续保持！'
    });
  }
  
  return suggestions;
});

// 辅助函数：计算方差
const calculateVariance = (numbers: number[]) => {
  const mean = numbers.reduce((a, b) => a + b) / numbers.length;
  return numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
};

// 初始化图表
onMounted(() => {
  initHeartRateChart();
  initZonesChart();
});

const initHeartRateChart = () => {
  const chartDom = document.getElementById('heartRateChart');
  const myChart = echarts.init(chartDom);
  
  const option = {
    title: {
      text: '心率变化趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: '{HH}:{mm}:{ss}'
      }
    },
    yAxis: {
      type: 'value',
      name: '心率 (BPM)'
    },
    series: [{
      name: '心率',
      type: 'line',
      smooth: true,
      data: trainingData.value.heartRateData,
      itemStyle: {
        color: '#FF5722'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
          offset: 0,
          color: 'rgba(255,87,34,0.3)'
        }, {
          offset: 1,
          color: 'rgba(255,87,34,0.1)'
        }])
      }
    }]
  };
  
  myChart.setOption(option);
};

const initZonesChart = () => {
  const chartDom = document.getElementById('zonesChart');
  const myChart = echarts.init(chartDom);
  
  const option = {
    title: {
      text: '心率区间分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    series: [{
      name: '心率区间',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '20',
          fontWeight: 'bold'
        }
      },
      data: [
        { value: trainingData.value.heartRateZones.rest, name: '休息区间' },
        { value: trainingData.value.heartRateZones.warmUp, name: '热身区间' },
        { value: trainingData.value.heartRateZones.fatBurn, name: '燃脂区间' },
        { value: trainingData.value.heartRateZones.cardio, name: '有氧区间' },
        { value: trainingData.value.heartRateZones.peak, name: '峰值区间' }
      ]
    }]
  };
  
  myChart.setOption(option);
};

// 返回首页
const backToHome = () => {
  router.push('/');
};

// 分享训练结果
const shareResults = () => {
  ElMessage.success('分享功能开发中...');
};
</script>

<template>
  <div class="summary-container">
    <!-- 顶部概览 -->
    <div class="overview-section">
      <h1>训练总结</h1>
      <div class="training-meta">
        <div class="meta-item">
          <i class="el-icon-time"></i>
          <span>{{ new Date(trainingData.startTime).toLocaleString() }}</span>
        </div>
        <div class="meta-item">
          <i class="el-icon-timer"></i>
          <span>{{ trainingData.duration }}分钟</span>
        </div>
      </div>
    </div>

    <!-- 核心指标 -->
    <div class="metrics-grid">
      <div class="metric-card">
        <h3>平均心率</h3>
        <div class="metric-value">{{ trainingData.averageHeartRate }}</div>
        <div class="metric-unit">BPM</div>
      </div>
      <div class="metric-card">
        <h3>最高心率</h3>
        <div class="metric-value">{{ trainingData.maxHeartRate }}</div>
        <div class="metric-unit">BPM</div>
      </div>
      <div class="metric-card">
        <h3>消耗热量</h3>
        <div class="metric-value">{{ trainingData.caloriesBurned }}</div>
        <div class="metric-unit">千卡</div>
      </div>
    </div>

    <!-- 训练评分 -->
    <div class="score-section">
      <h2>训练评分</h2>
      <div class="score-grid">
        <div class="score-item">
          <el-progress
            type="dashboard"
            :percentage="trainingScore.overall"
            :color="'#67C23A'"
          >
            <template #default="{ percentage }">
              <span class="score-label">总体评分</span>
              <span class="score-value">{{ percentage }}</span>
            </template>
          </el-progress>
        </div>
        <div class="score-details">
          <div class="detail-item">
            <span>心率稳定性</span>
            <el-progress :percentage="trainingScore.stability" />
          </div>
          <div class="detail-item">
            <span>训练强度</span>
            <el-progress :percentage="trainingScore.intensity" />
          </div>
          <div class="detail-item">
            <span>时长达标率</span>
            <el-progress :percentage="trainingScore.duration" />
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div id="heartRateChart" class="chart"></div>
      <div id="zonesChart" class="chart"></div>
    </div>

    <!-- 训练建议 -->
    <div class="recommendations-section">
      <h2>训练建议</h2>
      <div class="recommendations-list">
        <el-alert
          v-for="(rec, index) in recommendations"
          :key="index"
          :title="rec.title"
          :type="rec.type"
          :description="rec.content"
          show-icon
          :closable="false"
          class="recommendation-item"
        />
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="actions-section">
      <el-button @click="backToHome">返回首页</el-button>
      <el-button type="primary" @click="shareResults">
        分享结果
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.summary-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.overview-section {
  text-align: center;
  margin-bottom: 32px;
}

.training-meta {
  display: flex;
  justify-content: center;
  gap: 24px;
  color: #666;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.metric-value {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  margin: 8px 0;
}

.metric-unit {
  color: #666;
  font-size: 14px;
}

.score-section {
  margin-bottom: 32px;
}

.score-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 32px;
  align-items: center;
}

.score-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.chart {
  height: 400px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.recommendations-section {
  margin-bottom: 32px;
}

.recommendation-item {
  margin-bottom: 12px;
}

.actions-section {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .score-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .chart {
    height: 300px;
  }
}
</style>