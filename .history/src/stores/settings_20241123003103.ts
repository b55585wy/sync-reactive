import { defineStore } from 'pinia'

interface Settings {
  targetHeartRateMin: number
  targetHeartRateMax: number
  inhaleTime: number
  holdTime: number
  exhaleTime: number
  age: number
}

export const useSettingsStore = defineStore('settings', {
  state: (): Settings => ({
    targetHeartRateMin: 60,
    targetHeartRateMax: 80,
    inhaleTime: 4,
    holdTime: 2,
    exhaleTime: 6,
    age: 30
  }),

  actions: {
    updateSettings(settings: Partial<Settings>) {
      Object.assign(this, settings)
    },

    // 计算默认目标心率范围（基于年龄）
    calculateDefaultHeartRateRange() {
      const maxHR = 220 - this.age;
      this.targetHeartRateMin = Math.round(maxHR * 0.5);
      this.targetHeartRateMax = Math.round(maxHR * 0.7);
    }
  },

  persist: true // 持久化存储设置
}) 
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