<template>
  <div class="sparkline-chart" ref="chartRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';

const props = defineProps<{
  data: number[];
  targetRange: [number, number];
}>();

const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

const initChart = () => {
  if (!chartRef.value) return;
  
  chart = echarts.init(chartRef.value);
  updateChart();
};

const updateChart = () => {
  if (!chart) return;
  
  const option = {
    grid: {
      top: 2,
      right: 2,
      bottom: 2,
      left: 2
    },
    xAxis: {
      type: 'category',
      show: false
    },
    yAxis: {
      type: 'value',
      show: false,
      min: Math.min(...props.data) - 5,
      max: Math.max(...props.data) + 5
    },
    series: [
      {
        data: props.data,
        type: 'line',
        smooth: true,
        symbol: 'none',
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(76, 175, 80, 0.3)' },
            { offset: 1, color: 'rgba(76, 175, 80, 0.1)' }
          ])
        },
        lineStyle: {
          color: '#4CAF50',
          width: 2
        }
      }
    ]
  };
  
  chart.setOption(option);
};

watch(() => props.data, updateChart, { deep: true });

onMounted(initChart);
</script>

<style scoped>
.sparkline-chart {
  width: 100%;
  height: 40px;
}
</style> 