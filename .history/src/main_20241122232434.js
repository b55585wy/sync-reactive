import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 初始化设置
const settingsStore = useSettingsStore()
await settingsStore.initializeSettings()
app.mount('#app') 