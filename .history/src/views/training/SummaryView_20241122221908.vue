<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { useTrainingStore } from '@/stores/training';

const route = useRoute();
const router = useRouter();
const trainingStore = useTrainingStore();

// 计算心率区间的函数
const calculateHeartRateZones = (heartRates: number[]) => {
  if (!heartRates.length) return {
    rest: 0,
    warmUp: 0,
    fatBurn: 0,
    cardio: 0,
    peak: 0
  };

  // 假设最大心率为 220 - 年龄（这里假设 30 岁）
  const maxHR = 190;
  
  let zones = {
    rest: 0,   // < 60% max HR
    warmUp: 0, // 60-70% max HR
    fatBurn: 0,// 70-80% max HR
    cardio: 0, // 80-90% max HR
    peak: 0    // 90-100% max HR
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
  const total = heartRates.length;
  return {
    rest: Math.round((zones.rest / total) * 100),
    warmUp: Math.round((zones.warmUp / total) * 100),
    fatBurn: Math.round((zones.fatBurn / total) * 100),
    cardio: Math.round((zones.cardio / total) * 100),
    peak: Math.round((zones.peak / total) * 100)
  };
};

// 计算方差的辅助函数
const calculateVariance = (numbers: number[]) => {
  if (!numbers.length) return 0;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squareDiffs = numbers.map(value => {
    const diff = value - mean;
    return diff * diff;
  });
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / numbers.length);
};

// 训练数据
const trainingData = computed(() => {
  const heartRateHistory = trainingStore.heartRateHistory;
  console.log('心率历史数据:', heartRateHistory);
  
  if (!heartRateHistory || heartRateHistory.length === 0) {
    console.warn('没有心率历史数据');
    return {
      duration: Math.round(Number(route.query.duration || 0) / 60),
      startTime: trainingStore.startTime || new Date().toISOString(),
      mode: route.query.mode || 'heart-monitoring',
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
  
  // 估算卡路里消耗 (简单估算，注意 duration 现在是秒)
  const caloriesBurned = Math.round(
    (Number(route.query.duration || 0) / 60 * averageHeartRate * 0.14)
  );
  
  return {
    duration: Math.round(Number(route.query.duration || 0) / 60),
    startTime: trainingStore.startTime || new Date().toISOString(),
    mode: route.query.mode || 'heart-monitoring',
    averageHeartRate,
    maxHeartRate,
    minHeartRate,
    heartRateZones: zones,
    caloriesBurned,
    heartRateData: heartRateHistory
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
  
  // 计算时长达标率 (duration 现在是秒)
  const targetDuration = Number(route.query.duration || 15);
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

// 图表相关代码
const heartRateChart = ref<echarts.ECharts | null>(null);
const zonesChart = ref<echarts.ECharts | null>(null);
const heartRateChartRef = ref<HTMLElement | null>(null);
const zonesChartRef = ref<HTMLElement | null>(null);

// 更新心率图表
const updateHeartRateChart = () => {
  if (!heartRateChart.value) return;

  const data = trainingData.value.heartRateData.map((record: any) => [
    new Date(record.timestamp).getTime(),
    record.value
  ]);

  // 计算训练总时长（分钟）
  const durationInMinutes = trainingData.value.duration;

  const option = {
    title: {
      text: '心率变化趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any) {
        const date = new Date(params[0].value[0]);
        return `${date.toLocaleTimeString()}<br/>
                心率: ${params[0].value[1]} BPM`;
      }
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: (value: number) => {
          // 如果训练时长大于3分钟，只显示时:分
          if (durationInMinutes > ) {
            return new Date(value).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          // 否则显示时:分:秒
          return new Date(value).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '心率 (BPM)',
      min: (value: { min: number }) => Math.max(0, value.min - 10),
      max: (value: { max: number }) => value.max + 10
    },
    series: [{
      name: '心率',
      type: 'line',
      smooth: true,
      data: data,
      lineStyle: {
        color: '#ff5252'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255, 82, 82, 0.3)' },
          { offset: 1, color: 'rgba(255, 82, 82, 0.1)' }
        ])
      }
    }]
  };

  heartRateChart.value.setOption(option);
};

// 更新心率区间图表
const updateZonesChart = () => {
  if (!zonesChart.value) return;

  const zones = trainingData.value.heartRateZones;
  const option = {
    title: {
      text: '心率区间分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
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
        labelLine: {
          show: false
        },
        data: [
          { value: zones.rest, name: '休息区间 (<60%)' },
          { value: zones.warmUp, name: '热身区间 (60-70%)' },
          { value: zones.fatBurn, name: '燃脂区间 (70-80%)' },
          { value: zones.cardio, name: '有氧区间 (80-90%)' },
          { value: zones.peak, name: '峰值区间 (>90%)' }
        ]
      }
    ],
    color: ['#91CC75', '#FAC858', '#EE6666', '#73C0DE', '#3BA272']
  };

  zonesChart.value.setOption(option);
};

// 初始化图表
const initCharts = () => {
  try {
    // 初始化心率图表
    if (heartRateChartRef.value) {
      heartRateChart.value = echarts.init(heartRateChartRef.value);
      updateHeartRateChart();
    }
    
    // 初始化区间图表
    if (zonesChartRef.value) {
      zonesChart.value = echarts.init(zonesChartRef.value);
      updateZonesChart();
    }
  } catch (error) {
    console.error('初始化图表失败:', error);
  }
};

// 监听窗口大小变化
const handleResize = () => {
  heartRateChart.value?.resize();
  zonesChart.value?.resize();
};

onMounted(() => {
  // 确保DOM元素存在后再初始化图表
  nextTick(() => {
    if (heartRateChartRef.value && zonesChartRef.value) {
      initCharts();
      window.addEventListener('resize', handleResize);
    }
  });
});

// 在组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (heartRateChart.value) {
    heartRateChart.value.dispose();
  }
  if (zonesChart.value) {
    zonesChart.value.dispose();
  }
});

// 监听路由变化
watch(() => route.path, async (newPath, oldPath) => {
  if (newPath !== oldPath) {
    if (heartRateChart.value) {
      heartRateChart.value.dispose();
    }
    if (zonesChart.value) {
      zonesChart.value.dispose();
    }
  }
});

// 分享功能
const shareTraining = () => {
  ElMessage.success('分享功能开发中...');
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
      <div class="chart" ref="heartRateChartRef"></div>
      <div class="chart" ref="zonesChartRef"></div>
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