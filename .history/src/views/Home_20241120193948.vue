<template>
  <div class="home">
    <div v-if="loading" class="loading-state">
      加载中...
    </div>
    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="loadUserData" class="retry-btn">重试</button>
    </div>
    
    <template v-else>
      <header class="header">
        <h1>呼吸训练</h1>
        <div class="user-info">
          <span>欢迎, {{ username || '访客' }}</span>
        </div>
      </header>

      <main class="main-content">
        <div class="breathing-card">
          <div class="stats">
            <div class="stat-item">
              <h3>今日训练</h3>
              <p>{{ todayMinutes }} 分钟</p>
            </div>
            <div class="stat-item">
              <h3>连续天数</h3>
              <p>{{ streakDays }} 天</p>
            </div>
          </div>
          <button class="start-btn" @click="startExercise">
            开始训练
          </button>
        </div>

        <div class="quick-actions">
          <div v-for="action in quickActions" 
               :key="action.id" 
               class="action-item"
               @click="handleAction(action.id)">
            <i :class="action.icon"></i>
            <span>{{ action.name }}</span>
          </div>
        </div>
      </main>
    </template>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BluetoothService }  from '@/services/bluetooth.js'
import { ElMessageBox, ElMessage } from 'element-plus'

console.log('Imports loaded')

export default {
  name: 'Home',
  setup() {
    console.log('Home component setup started')
    
    const router = useRouter()
    const loading = ref(false)
    const error = ref(null)
    const username = ref('访客')
    const todayMinutes = ref(0)
    const streakDays = ref(0)
    const bluetoothService = BluetoothService.getInstance()

    const quickActions = ref([
      { id: 'guide', name: '训练指南', icon: 'fas fa-book' },
      { id: 'stats', name: '统计数据', icon: 'fas fa-chart-bar' },
      { id: 'settings', name: '设置', icon: 'fas fa-cog' }
    ])

    console.log('Data initialized')

    const loadUserData = async () => {
      loading.value = true
      error.value = null
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        username.value = '测试用户'
        todayMinutes.value = 30
        streakDays.value = 5
        
        console.log('数据加载成功')
      } catch (err) {
        console.error('数据加载失败:', err)
        error.value = '数据加载失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }

    const startExercise = async () => {
      try {
        if (!bluetoothService.getConnectionStatus()) {
          const result = await ElMessageBox.confirm(
            '设备未连接，是否现在连接设备？',
            '提示',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning',
            }
          )
          
          if (result === 'confirm') {
            try {
              await bluetoothService.connectHeartRateBelt()
              ElMessage.success('设备连接成功')
              router.push('/breathing/prepare')
            } catch (error) {
              console.error('设备连接失败:', error)
              ElMessage.error('设备连接失败，请重试')
            }
          }
          return
        }
        
        router.push('/breathing/prepare')
      } catch (error) {
        console.error('启动失败:', error)
        ElMessage.error('启动失败')
      }
    }

    const handleAction = (actionId) => {
      console.log('Action clicked:', actionId)
    }

    onMounted(() => {
      loadUserData()
    })

    return {
      loading,
      error,
      username,
      todayMinutes,
      streakDays,
      quickActions,
      startExercise,
      handleAction,
      loadUserData
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 24px;
  color: #333;
}

.user-info {
  color: #666;
}

.breathing-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
}

.stat-item {
  text-align: center;
}

.stat-item h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-item p {
  font-size: 24px;
  color: #333;
  font-weight: bold;
}

.start-btn {
  width: 100%;
  padding: 16px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.3s;
}

.start-btn:hover {
  background: #357abd;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.action-item {
  background: white;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.action-item:hover {
  transform: translateY(-2px);
}

.action-item i {
  font-size: 24px;
  color: #4a90e2;
  margin-bottom: 8px;
  display: block;
}

.action-item span {
  font-size: 14px;
  color: #666;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 20px;
  margin: 20px 0;
  border-radius: 8px;
  background: #f8f9fa;
}

.error-state {
  color: #dc3545;
}

.retry-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #357abd;
}
</style> 