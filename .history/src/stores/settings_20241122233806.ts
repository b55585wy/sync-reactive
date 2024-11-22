import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    username: localStorage.getItem('settings_username') || '',
    age: Number(localStorage.getItem('settings_age')) || 25,
    gender: localStorage.getItem('settings_gender') || 'male',
    height: Number(localStorage.getItem('settings_height')) || 170,
    weight: Number(localStorage.getItem('settings_weight')) || 65,
    // ... 其他设置项
  }),

  actions: {
    // 获取设置
    async getSettings() {
      return {
        username: this.username,
        age: this.age,
        gender: this.gender,
        height: this.height,
        weight: this.weight,
        // ... 其他设置项
      }
    },

    // 保存设置
    async saveSettings(settings) {
      try {
        // 更新 store 状态
        this.$patch(settings)
        
        // 保存到本地存储
        Object.entries(settings).forEach(([key, value]) => {
          localStorage.setItem(`settings_${key}`, value.toString())
        })
        
        return true
      } catch (error) {
        console.error('保存设置失败:', error)
        throw error
      }
    },

    // 初始化设置
    async initializeSettings() {
      // 从本地存储加载所有设置
      this.username = localStorage.getItem('settings_username') || ''
      this.age = Number(localStorage.getItem('settings_age')) || 25
      this.gender = localStorage.getItem('settings_gender') || 'male'
      this.height = Number(localStorage.getItem('settings_height')) || 170
      this.weight = Number(localStorage.getItem('settings_weight')) || 65
      // ... 加载其他设置
    }
  }
}) 