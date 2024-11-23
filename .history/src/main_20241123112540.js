import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { useSettingsStore } from '@/stores/settings'
import { useDeviceStore } from '@/stores/device'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { useTrainingStore } from '@/stores/training'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 创建一个异步的初始化函数
const initializeApp = async () => {
  try {
    const settingsStore = useSettingsStore()
    const deviceStore = useDeviceStore()
    const trainingStore = useTrainingStore()
    
    await Promise.all([
      settingsStore.initializeSettings(),
      deviceStore.initializeDevices(),
      trainingStore.initialize()
    ])
    
    app.mount('#app')
  } catch (error) {
    console.error('初始化失败:', error)
    app.mount('#app')
  }
}

// 调用初始化函数
initializeApp() 