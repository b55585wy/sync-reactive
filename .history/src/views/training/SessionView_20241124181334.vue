<template>
  <div class="training-session">
    <!-- 顶部状态栏 -->
    <header class="status-bar">
      <div class="left-controls">
        <el-button circle class="back-btn" @click="confirmExit">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
      </div>
      <div class="center-info">
        <div class="time-display">
          <span class="current-time">{{ formatTime(elapsedTime) }}</span>
          <div class="session-progress">
            <el-progress 
              :percentage="progress" 
              :show-text="false"
              :stroke-width="4"
              :color="progressColor"
            />
          </div>
        </div>
      </div>
      <div class="right-status">
        <div class="device-indicators">
          <el-tooltip content="心率监测" placement="bottom">
            <div class="indicator" :class="{ active: deviceStore.isHeartRateBandConnected }">
              <el-icon><Monitor /></el-icon>
            </div>
          </el-tooltip>
          <el-tooltip content="呼吸监测" placement="bottom">
            <div class="indicator" :class="{ active: deviceStore.isBreathingBandConnected }">
              <el-icon><Odometer /></el-icon>
            </div>
          </el-tooltip>
        </div>
      </div>
    </header>

    <!-- 仪表板 -->
    <main class="dashboard-grid">
      <!-- 心率监测卡片 -->
      <div class="dashboard-card primary-card" v-if="showHeartRate">
        <div class="card-header">
          <el-icon><Monitor /></el-icon>
          <span>实时心率</span>
        </div>
        <div class="heart-rate-display">
          <div class="current-value">
            <span class="number">{{ deviceStore.currentHeartRate || '--' }}</span>
            <span class="unit">BPM</span>
          </div>
          <div class="heart-rate-stats">
            <div class="stat-item">
              <span>最高:</span> {{ maxHeartRate }}
            </div>
            <div class="stat-item">
              <span>最低:</span> {{ minHeartRate }}
            </div>
            <div class="stat-item">
              <span>平均:</span> {{ avgHeartRate }}
            </div>
          </div>
        </div>
      </div>

      <!-- 呼吸引导卡片 -->
      <div class="dashboard-card" v-if="showBreathing">
        <div class="card-header">
          <el-icon><WindPower /></el-icon>
          <span>呼吸引导</span>
        </div>
        <BreathingFlower
          :breathing-phase="breathingPhase"
          :breathing-countdown="breathingCountdown"
        />
      </div>
    </main>

    <!-- 底部控制栏 -->
    <footer class="control-bar">
      <div class="control-buttons">
        <el-button-group>
          <el-button type="primary" circle size="large" @click="togglePause">
            <el-icon>
              <component :is="isPaused ? VideoPlay : VideoPause" />
            </el-icon>
          </el-button>
          <el-button type="danger" circle size="large" @click="confirmEndSession">
            <el-icon><CircleClose /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      <div class="session-info">
        <div class="remaining-time">
          剩余 {{ formatTime(remainingTime) }}
        </div>
      </div>
    </footer>
  </div>
</template>
