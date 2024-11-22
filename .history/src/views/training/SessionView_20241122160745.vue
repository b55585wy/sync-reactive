<template>
  <div class="training-session">
    <!-- 顶部状态栏 -->
    <div class="session-header">
      <div class="session-info">
        <h2>{{ getSessionTitle }}</h2>
        <span class="session-timer">{{ formatTime(elapsedTime) }}</span>
      </div>
      <button class="btn-end" @click="confirmEndSession">结束训练</button>
    </div>

    <!-- 主要数据展示区 -->
    <div class="data-display">
      <!-- 心率数据卡片 -->
      <div class="data-card heart-rate" v-if="mode === 'heartRate' || mode === 'combined'">
        <div class="card-header">
          <i class="icon-heart-rate"></i>
          <h3>实时心率</h3>
        </div>
        <div class="heart-rate-display">
          <div class="current-value">{{ bluetoothService.getHeartRate() }}</div>
          <div class="unit">BPM</div>
        </div>
        <div class="heart-rate-chart">
          <!-- 这里可以添加心率图表组件 -->
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <label>最高心率</label>
            <span>{{ maxHeartRate }}</span>
          </div>
          <div class="stat-item">
            <label>最低心率</label>
            <span>{{ minHeartRate }}</span>
          </div>
          <div class="stat-item">
            <label>平均心率</label>
            <span>{{ avgHeartRate }}</span>
          </div>
        </div>
      </div>

      <!-- 呼吸数据卡片 -->
      <div class="data-card breathing" v-if="mode === 'breathing' || mode === 'combined'">
        <div class="card-header">
          <i class="icon-breathing"></i>
          <h3>呼吸训练</h3>
        </div>
        <div class="breathing-guide">
          <div class="breathing-circle" :class="breathingPhase">
            {{ breathingText }}
          </div>
        </div>
        <div class="breathing-stats">
          <div class="stat-item">
            <label>呼吸频率</label>
            <span>{{ breathingRate }} 次/分</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 训练进度条 -->
    <div class="progress-bar">
      <div class="progress" :style="{ width: `${progress}%` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import BluetoothService from '@/services/BluetoothService';
import { ElMessageBox } from 'element-plus';

const props = defineProps<{
  mode: 'breathing' | 'heartRate' | 'combined';
  duration: number;
}>();
</template> 