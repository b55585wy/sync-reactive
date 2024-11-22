import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { useSettingsStore } from '@/stores/settings'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 创建一个异步的初始化函数
const initializeApp = async () => {
  try {
    const settingsStore = useSettingsStore()
    await settingsStore.initializeSettings()
    app.mount('#app')
  } catch (error) {
    console.error('初始化失败:', error)
  }
}

// 调用初始化函数
initializeApp() 