<template>
  <div class="settings">
    <!-- 个人信息设置 -->
    <el-form>
      <el-form-item label="年龄">
        <el-input-number v-model="userAge" :min="12" :max="100" />
      </el-form-item>
      
      <el-form-item label="身高">
        <el-input-number v-model="userHeight" :min="140" :max="220" />
      </el-form-item>
      
      <el-form-item label="体重">
        <el-input-number v-model="userWeight" :min="30" :max="200" />
      </el-form-item>
    </el-form>

    <!-- 心率目标设置 -->
    <div class="heart-rate-settings">
      <h3>心率目标设置</h3>
      <!-- 根据年龄自动计算建议范围 -->
      <div class="suggested-range">
        建议心率范围: {{ suggestedMinRate }} - {{ suggestedMaxRate }} BPM
        <el-tooltip content="根据您的年龄计算的安全心率范围">
          <i class="el-icon-question"></i>
        </el-tooltip>
      </div>
      
      <el-slider
        v-model="heartRateRange"
        range
        :min="40"
        :max="180"
        :marks="heartRateMarks">
      </el-slider>
    </div>

    <!-- 呼吸训练设置 -->
    <div class="breathing-settings">
      <h3>呼吸训练设置</h3>
      <el-form>
        <el-form-item label="吸气时长">
          <el-slider v-model="inhaleTime" :min="2" :max="6" :step="0.5" />
        </el-form-item>
        
        <el-form-item label="屏息时长">
          <el-slider v-model="holdTime" :min="0" :max="4" :step="0.5" />
        </el-form-item>
        
        <el-form-item label="呼气时长">
          <el-slider v-model="exhaleTime" :min="2" :max="8" :step="0.5" />
        </el-form-item>
      </el-form>
    </div>

    <!-- 训练提醒设置 -->
    <div class="training-reminder">
      <h3>训练提醒</h3>
      <el-time-picker
        v-model="reminderTime"
        format="HH:mm"
        placeholder="选择提醒时间">
      </el-time-picker>
      <el-checkbox-group v-model="reminderDays">
        <el-checkbox label="1">周一</el-checkbox>
        <el-checkbox label="2">周二</el-checkbox>
        <!-- ... -->
      </el-checkbox-group>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 根据年龄计算建议心率范围
const suggestedMinRate = computed(() => {
  const maxHR = 220 - userAge.value;
  return Math.round(maxHR * 0.5); // 最小心率为最大心率的50%
});

const suggestedMaxRate = computed(() => {
  const maxHR = 220 - userAge.value;
  return Math.round(maxHR * 0.7); // 最大心率为最大心率的70%
});
</script> 