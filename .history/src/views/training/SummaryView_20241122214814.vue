<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';

const route = useRoute();
const router = useRouter();

// 训练数据
const trainingData = computed(() => {
  const heartRateHistory = trainingStore.heartRateHistory || [];
  const startTime = trainingStore.startTime;
  const duration = Number(route.query.duration || 0);
  
  // 添加安全检查
  if (!heartRateHistory.length) {
    return {
      duration,
      startTime: startTime || new Date().toISOString(),
      mode: route.params.mode || 'heart-monitoring',
      averageHeartRate: 0,
      maxHeartRate: 0,
      minHeartRate: 0,
      heartRateZones: {
        rest: 0,
        warmUp: 0,
        fatBurn: 0,
        cardio: 0,
        peak: 0
      },
      caloriesBurned: 0,
      heartRateData: []
    };
  }
  
  // 计算心率统计数据
  const heartRates = heartRateHistory.map(h => h.value);
  const averageHeartRate = Math.round(
    heartRates.reduce((a, b) => a + b, 0) / heartRates.length
  );
  const maxHeartRate = Math.max(...heartRates);
  const minHeartRate = Math.min(...heartRates);
  
  // 计算心率区间分布
  const zones = calculateHeartRateZones(heartRates);
  
  // 估算卡路里消耗
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

// 计算训练效果评分（示例算法）
const trainingScore = computed(() => {
  const heartRateData = trainingData.value.heartRateData;
  
  // 如果没有数据，返回默认值
  if (!heartRateData || heartRateData.length === 0) {
    return {
      overall: 0,
      stability: 0,
      intensity: 0,
      duration: 0
    };
  }
  
  // 计算心率稳定性
  const hrValues = heartRateData.map(h => h.value);
  const hrVariance = calculateVariance(hrValues);
  const stabilityScore = Math.min(100, Math.max(0, 100 - (hrVariance / 2)));
  
  // 计算训练强度
  const intensityScore = Math.min(100, 
    (trainingData.value.heartRateZones.fatBurn + 
     trainingData.value.heartRateZones.cardio) * 1.2
  );
  
  // 计算时长达标率
  const targetDuration = Number(route.query.duration || 15) * 60;
  const actualDuration = heartRateData.length;
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

// 生成建议
const recommendations = computed(() => {
  const suggestions = [];
  
  if (trainingData.value.averageHeartRate > 85) {
    suggestions.push({
      type: 'warning',
      title: '心率偏高',
      content: '建议下次训练时适当降低运动强度，保持在舒适区间。'
    });
  }
  
  if (trainingData.value.heartRateZones.fatBurn > 30) {
    suggestions.push({
      type: 'success',
      title: '良好的燃脂效果',
      content: '本次训练中有效燃脂时间占比较高，继续保持！'
    });
  }
  
  // 添加基础建议
  suggestions.push({
    type: 'info',
    title: '训练建议',
    content: '建议每周进行3-4次类似强度的训练，每次训练时长15-30分钟。'
  });
  
  return suggestions;
});

// 初始化图表
onMounted(() => {
  initHeartRateChart();
  initZonesChart();
});

const initHeartRateChart = () => {
  const chartDom = document.getElementById('heartRateChart');
  if (!chartDom) return;
  
  const myChart = echarts.init(chartDom);
  
  // 确保有数据
  if (!trainingData.value.heartRateData.length) {
    myChart.setOption({
      title: {
        text: '暂无心率数据',
        left: 'center',
        top: 'center'
      }
    });
    return;
  }
  
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
  if (!chartDom) return;
  
  const myChart = echarts.init(chartDom);
  
  // 确保有数据
  if (!trainingData.value.heartRateData.length) {
    myChart.setOption({
      title: {
        text: '暂无区间数据',
        left: 'center',
        top: 'center'
      }
    });
    return;
  }
  
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

// 在组件卸载时清理
onUnmounted(() => {
  const heartRateChart = echarts.getInstanceByDom(
    document.getElementById('heartRateChart')
  );
  const zonesChart = echarts.getInstanceByDom(
    document.getElementById('zonesChart')
  );
  
  if (heartRateChart) {
    heartRateChart.dispose();
  }
  if (zonesChart) {
    zonesChart.dispose();
  }
});
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