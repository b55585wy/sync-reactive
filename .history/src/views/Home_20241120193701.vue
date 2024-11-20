<template>
  <div class="home">
    <header class="header">
      <h1>呼吸训练</h1>
      <div v-if="loading">加载中...</div>
      <div v-else-if="error" style="color: red;">{{ error }}</div>
      <div v-else class="user-info">
        <span>欢迎, {{ username || '访客' }}</span>
      </div>
    </header>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'

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
        // 如果后端 API 还没准备好，可以先使用模拟数据
        // 开发时可以先注释掉 API 调用，使用假数据
        /*
        const response = await axios.get('/api/user')
        username.value = response.data.username
        */
        
        // 使用模拟数据
        username.value = '测试用户'
        
      } catch (err) {
        console.error('API 错误:', err)
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