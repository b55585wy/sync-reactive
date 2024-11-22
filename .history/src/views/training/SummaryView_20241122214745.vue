<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';

const route = useRoute();
const router = useRouter();

// 训练数据
const trainingData = ref({
  duration: route.query.duration || 0,
  startTime: route.query.startTime || new Date().toISOString(),
  mode: route.query.mode || 'heart-monitoring',
  averageHeartRate: 75,
  maxHeartRate: 95,
  minHeartRate: 65,
  heartRateZones: {
    rest: 25,      // 休息区间占比
    warmUp: 30,    // 热身区间占比
    fatBurn: 35,   // 燃脂区间占比
    cardio: 10,    // 有氧区间占比
    peak: 0        // 峰值区间占比
  },
  caloriesBurned: 156,
  heartRateData: [] // 将从后端获取详细的心率数据
});

// 计算训练效果评分（示例算法）
const trainingScore = computed(() => {
  const score = {
    overall: 85,        // 总体评分
    stability: 88,      // 心率稳定性
    intensity: 82,      // 训练强度
    duration: 85        // 时长达标率
  };
  return score;
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