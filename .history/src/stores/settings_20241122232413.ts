import { defineStore } from 'pinia'

interface UserSettings {
  // 个人信息
  username: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number
  weight: number
  
  // 训练偏好
  defaultDuration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  goal: string[]
  enableReminders: boolean
  reminderTime: string | null
  
  // 其他设置
  language: 'zh-CN' | 'en-US'
  theme: 'light' | 'dark' | 'auto'
  autoSync: boolean
}

export const useSettingsStore = defineStore('settings', {
  state: (): UserSettings => ({
    // 个人信息默认值
    username: localStorage.getItem('settings_username') || '',
    age: 25,
    gender: 'male',
    height: 170,
    weight: 65,
    
    // 训练偏好默认值
    defaultDuration: 5,
    difficulty: 'beginner',
    goal: ['relaxation'],
    enableReminders: false,
    reminderTime: null,
    
    // 其他设置默认值
    language: 'zh-CN',
    theme: 'light',
    autoSync: true
  }),

  getters: {
    // 获取BMI
    bmi(): number {
      const heightInMeters = this.height / 100
      return Number((this.weight / (heightInMeters * heightInMeters)).toFixed(1))
    },

    // 获取最大心率（220-年龄）
    maxHeartRate(): number {
      return 220 - this.age
    }
  },

  actions: {
    // 获取设置
    async getSettings() {
      try {
        // 从本地存储获取设置
        const savedSettings = localStorage.getItem('userSettings')
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)
          this.$patch(settings)
        }
        return this.$state
      } catch (error) {
        console.error('获取设置失败:', error)
        return null
      }
    },

    // 保存设置
    async saveSettings(settings: Partial<UserSettings>) {
      try {
        // 更新 store
        this.$patch(settings)
        
        // 保存到本地存储
        if (settings.username !== undefined) {
          localStorage.setItem('settings_username', settings.username)
        }
        
        return true
      } catch (error) {
        console.error('保存设置失败:', error)
        throw error
      }
    },

    // 重置设置
    resetSettings() {
      this.$reset()
      localStorage.removeItem('userSettings')
    },

    // 同步数据到服务器（示例）
    async syncData() {
      try {
        // 这里添加与后端同步的逻辑
        await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟异步操作
        return true
      } catch (error) {
        console.error('同步数据失败:', error)
        throw error
      }
    },

    // 解除设备配对
    async forgetDevice(deviceId: number) {
      try {
        // 这里添加解除设备配对的逻辑
        await new Promise(resolve => setTimeout(resolve, 500)) // 模拟异步操作
        return true
      } catch (error) {
        console.error('解除设备配对失败:', error)
        throw error
      }
    },

    // 更新语言设置
    setLanguage(language: 'zh-CN' | 'en-US') {
      this.language = language
      // 这里可以添加其他语言设置的逻辑
    },

    // 初始化设置
    async initializeSettings() {
      // 从本地存储加载所有设置
      this.username = localStorage.getItem('settings_username') || ''
      // ... 加载其他设置
    }
  }
}) 