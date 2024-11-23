<template>
  <div class="settings-view">
    <el-form :model="formData" label-width="120px">
      <!-- 基本设置 -->
      <el-form-item label="用户名">
        <el-input v-model="formData.username" />
      </el-form-item>
      
      <el-form-item label="年龄">
        <el-input-number v-model="formData.age" :min="12" :max="100" />
      </el-form-item>
      
      <el-form-item label="身高(cm)">
        <el-input-number v-model="formData.height" :min="140" :max="220" />
      </el-form-item>
      
      <el-form-item label="体重(kg)">
        <el-input-number v-model="formData.weight" :min="30" :max="200" />
      </el-form-item>

      <!-- 训练设置 -->
      <el-form-item label="每周目标(分钟)">
        <el-input-number v-model="formData.weeklyGoal" :min="30" :max="1000" :step="30" />
      </el-form-item>
      
      <el-form-item label="目标心率范围">
        <div class="heart-rate-range">
          <el-input-number v-model="formData.targetHeartRateMin" :min="40" :max="180" />
          <span class="separator">-</span>
          <el-input-number v-model="formData.targetHeartRateMax" :min="40" :max="180" />
          <span class="unit">BPM</span>
        </div>
      </el-form-item>

      <el-form-item label="默认训练时长">
        <el-input-number v-model="formData.defaultTrainingDuration" :min="5" :max="60" :step="5" />
        <span class="unit">分钟</span>
      </el-form-item>

      <!-- 按钮组 -->
      <el-form-item>
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
        <el-button @click="resetSettings">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { ElMessage } from 'element-plus';

const settingsStore = useSettingsStore();

// 创建响应式的表单数据
const formData = ref({
  username: '',
  age: 30,
  height: 170,
  weight: 60,
  weeklyGoal: 150,
  targetHeartRateMin: 60,
  targetHeartRateMax: 80,
  inhaleTime: 4,
  holdTime: 2,
  exhaleTime: 6,
  breathingPattern: 'beginner',
  reminderEnabled: false,
  reminderTime: '08:00',
  reminderDays: [1,2,3,4,5],
  defaultTrainingDuration: 15
});

// 在组件挂载时加载设置
onMounted(async () => {
  try {
    // 初始化设置
    await settingsStore.initializeSettings();
    
    // 使用 getAllSettings getter 获取所有设置
    const currentSettings = settingsStore.getAllSettings;
    
    // 更新表单数据
    formData.value = {
      username: currentSettings.username,
      age: currentSettings.age,
      height: currentSettings.height,
      weight: currentSettings.weight,
      weeklyGoal: currentSettings.weeklyGoal,
      targetHeartRateMin: currentSettings.targetHeartRateMin,
      targetHeartRateMax: currentSettings.targetHeartRateMax,
      inhaleTime: currentSettings.inhaleTime,
      holdTime: currentSettings.holdTime,
      exhaleTime: currentSettings.exhaleTime,
      breathingPattern: currentSettings.breathingPattern,
      reminderEnabled: currentSettings.reminderEnabled,
      reminderTime: currentSettings.reminderTime,
      reminderDays: currentSettings.reminderDays,
      defaultTrainingDuration: currentSettings.defaultTrainingDuration
    };
  } catch (error) {
    console.error('加载设置失败:', error);
    ElMessage.error('加载设置失败');
  }
});

// 保存设置
const saveSettings = async () => {
  try {
    await settingsStore.saveSettings(formData.value);
    ElMessage.success('设置保存成功');
  } catch (error) {
    console.error('保存设置失败:', error);
    ElMessage.error('保存设置失败');
  }
};

// 重置设置
const resetSettings = () => {
  formData.value = {
    username: '',
    age: 30,
    height: 170,
    weight: 60,
    weeklyGoal: 150,
    targetHeartRateMin: 60,
    targetHeartRateMax: 80,
    inhaleTime: 4,
    holdTime: 2,
    exhaleTime: 6,
    breathingPattern: 'beginner',
    reminderEnabled: false,
    reminderTime: '08:00',
    reminderDays: [1,2,3,4,5],
    defaultTrainingDuration: 15
  };
};
</script>

<style scoped>
.settings-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.heart-rate-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.separator {
  color: #909399;
}

.unit {
  margin-left: 8px;
  color: #909399;
}
</style> 