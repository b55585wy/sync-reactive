import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import './assets/styles/main.css'
import axios from 'axios'

// 设置 axios 的基础 URL，替换成你的实际后端地址
axios.defaults.baseURL = 'http://localhost:你的后端端口'

// 添加请求拦截器用于调试
axios.interceptors.request.use(config => {
  console.log('发送请求:', config.url)
  return config
})

// 添加响应拦截器用于调试
axios.interceptors.response.use(
  response => {
    console.log('收到响应:', response)
    return response
  },
  error => {
    console.log('请求错误:', error)
    return Promise.reject(error)
  }
)

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(pinia)

app.mount('#app') 