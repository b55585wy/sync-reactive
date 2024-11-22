import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { useSettingsStore } from '@/stores/settings'
import { useDeviceStore } from '@/stores/device'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 创建一个异步的初始化函数
const initializeApp = async () => {
  try {
    const settingsStore = useSettingsStore()
    const deviceStore = useDeviceStore()
    
    // 确保两个初始化方法都存在
    if (settingsStore.initializeSettings && deviceStore.initializeDevices) {
      await Promise.all([
        settingsStore.initializeSettings(),
        deviceStore.initializeDevices()
      ])
    }
    
    app.mount('#app')
  } catch (error) {
    console.error('初始化失败:', error)
    // 即使初始化失败也挂载应用
    app.mount('#app')
  }
}

// 调用初始化函数
initializeApp() 