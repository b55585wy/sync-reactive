<template>
  <div class="home">
    <header class="header">
      <h1>呼吸训练</h1>
      <div class="user-info">
        <span>欢迎, {{ username }}</span>
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
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BluetoothService from '@/services/bluetooth.js'
import { ElMessageBox, ElMessage } from 'element-plus'

console.log('Imports loaded')

export default {
  name: 'Home',
  setup() {
    console.log('Home component setup started')
    
    const router = useRouter()
    const username = ref('用户')
    const todayMinutes = ref(0)
    const streakDays = ref(0)
    const bluetoothService = BluetoothService.getInstance()

    const quickActions = ref([
      { id: 'guide', name: '训练指南', icon: 'fas fa-book' },
      { id: 'stats', name: '统计数据', icon: 'fas fa-chart-bar' },
      { id: 'settings', name: '设置', icon: 'fas fa-cog' }
    ])

    console.log('Data initialized')

    const startExercise = async () => {
      try {
        // 检查蓝牙连接状态
        if (!bluetoothService.getConnectionStatus()) {
          if (window.confirm('设备未连接，是否现在连接设备？')) {
            try {
              // 调用连接心率带的方法
              await bluetoothService.connectHeartRateBelt()
              console.log('设备连接成功')
              // 连接成功后，继续导航到准备页面
              router.push('/breathing/prepare')
            } catch (error) {
              console.error('设备连接失败:', error)
              alert('设备连接失败，请重试')
            }
            return
          }
          return
        }
        
        // 如果已经连接，直接导航到准备页面
        router.push('/breathing/prepare')
      } catch (error) {
        console.error('启动失败:', error)
        alert('启动失败')
      }
    }

    const handleAction = (actionId) => {
      console.log('Action clicked:', actionId)
    }

    return {
      username,
      todayMinutes,
      streakDays,
      quickActions,
      startExercise,
      handleAction
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
</style> 