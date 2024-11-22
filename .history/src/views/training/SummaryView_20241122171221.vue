<template>
  <div class="training-summary">
    <!-- 训练总结内容 -->
    <button @click="backToSession">继续训练</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// 获取之前的训练数据
const trainingData = route.state || {
  mode: 'heartRate',
  duration: 3
};

const backToSession = () => {
  router.push({
    name: 'TrainingSession',
    params: { mode: trainingData.mode },
    query: { duration: trainingData.duration }
  });
};
</script> 