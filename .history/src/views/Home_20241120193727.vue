<template>
  <div class="home">
    <header class="header">
      <h1>呼吸训练</h1>
      <div class="user-info" v-if="username">
        <span>欢迎, {{ username }}</span>
      </div>
    </header>
    
    <!-- 添加加载状态显示 -->
    <div v-if="loading">加载中...</div>
    <div v-if="error" style="color: red;">{{ error }}</div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios' // 确保已安装 axios

export default {
  name: 'Home',
  setup() {
    const username = ref('')
    const loading = ref(false)
    const error = ref(null)

    const loadUserData = async () => {
      loading.value = true
      error.value = null
      
      try {
        // 使用 axios 进行 API 调用
        const response = await axios.get('/api/user') // 替换为你的实际 API 地址
        username.value = response.data.username
        console.log('数据加载成功:', response.data)
      } catch (err) {
        console.error('API 调用失败:', err)
        error.value = '数据加载失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadUserData()
    })

    return {
      username,
      loading,
      error
    }
  }
}
</script>

<style scoped>
.home {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}
</style> 