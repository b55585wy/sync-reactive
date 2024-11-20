<template>
  <view class="container">
    <view class="header">
      <text class="greeting">下午好，{{ username }}</text>
      <view class="menu-icon">☰</view>
    </view>

    <view class="main-card">
      <view class="circle-progress">
        <text class="progress-text">{{ breathCount }}</text>
        <text class="progress-label">锻炼次数</text>
      </view>
      <button class="start-button" @click="startBreathing">开始锻炼</button>
    </view>

    <view class="quick-actions">
      <view v-for="(action, index) in quickActions" :key="index" 
            class="action-item" @click="handleQuickAction(action.name)">
        <image :src="action.icon" mode="aspectFit" class="action-icon"></image>
        <text class="action-text">{{ action.name }}</text>
      </view>
    </view>

    <view class="health-data">
      <view class="data-title">
        <text>呼吸训练</text>
        <text class="manage-link">记录 ></text>
      </view>
      <view class="data-row">
        <view class="data-item">
          <text class="data-label">今日训练</text>
          <text class="data-value">{{ todayTraining }}/10分钟</text>
        </view>
        <view class="data-item">
          <text class="data-label">本周训练</text>
          <text class="data-value">{{ weeklyTraining }}/70分钟</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const username = ref('测试用户')
const breathCount = ref(0)
const todayTraining = ref(0)
const weeklyTraining = ref(0)

const quickActions = ref([
  {
    name: '呼吸指导',
    icon: '/static/icons/guidance.png'
  },
  {
    name: '训练计划',
    icon: '/static/icons/plan.png'
  },
  {
    name: '统计分析',
    icon: '/static/icons/stats.png'
  },
  {
    name: '添加设备',
    icon: '/static/icons/add-devices.png'
  }
])

const startBreathing = () => {
  uni.navigateTo({
    url: '/pages/exercise/exercise'
  })
}

const handleQuickAction = (actionName: string) => {
  console.log('Clicked action:', actionName)
  // 处理各个快捷操作的逻辑
}
</script>

<style scoped>
.container {
  padding: 20px;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.greeting {
  font-size: 18px;
  font-weight: bold;
}

.menu-icon {
  font-size: 24px;
}

.main-card {
  background-color: #4a90e2;
  border-radius: 15px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.circle-progress {
  width: 150px;
  height: 150px;
  border-radius: 75px;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
}

.progress-text {
  font-size: 36px;
  color: white;
  font-weight: bold;
}

.progress-label {
  font-size: 14px;
  color: white;
}

.start-button {
  background-color: white;
  color: #4a90e2;
  padding: 10px 30px;
  border-radius: 25px;
  font-weight: bold;
}

.quick-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.action-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 5px;
}

.action-text {
  font-size: 12px;
  color: #333;
}

.health-data {
  background-color: white;
  border-radius: 10px;
  padding: 15px;
}

.data-title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.manage-link {
  color: #4a90e2;
}

.data-row {
  display: flex;
  justify-content: space-between;
}

.data-item {
  display: flex;
  flex-direction: column;
}

.data-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 5px;
}

.data-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
</style> 