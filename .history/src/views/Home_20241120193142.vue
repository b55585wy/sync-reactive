<template>
  <div class="home">
    <h1 style="color: red;">测试标题</h1>
    
    <!-- 只保留最基础的数据显示 -->
    <div style="border: 1px solid blue; padding: 10px; margin: 10px;">
      <p>用户名: {{ username }}</p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'Home',
  setup() {
    const username = ref('测试用户')

    return {
      username
    }
  }
}
</script>

<style scoped>
.home {
  padding: 20px;
}
</style> 