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
  state: () => ({
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

    calculateDefaultHeartRateRange() {
      const maxHR = 220 - this.age
      this.targetHeartRateMin = Math.round(maxHR * 0.5)
      this.targetHeartRateMax = Math.round(maxHR * 0.7)
    },

    async initializeSettings() {
      try {
        const savedSettings = localStorage.getItem('userSettings')
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)
          this.targetHeartRateMin = settings.targetHeartRateMin || 60
          this.targetHeartRateMax = settings.targetHeartRateMax || 80
          this.inhaleTime = settings.inhaleTime || 4
          this.holdTime = settings.holdTime || 2
          this.exhaleTime = settings.exhaleTime || 6
          this.age = settings.age || 30
        }
      } catch (error) {
        console.error('初始化设置失败:', error)
      }
    },

    async saveSettings(settings) {
      try {
        this.targetHeartRateMin = settings.targetHeartRateMin || 60
        this.targetHeartRateMax = settings.targetHeartRateMax || 80
        this.inhaleTime = settings.inhaleTime || 4
        this.holdTime = settings.holdTime || 2
        this.exhaleTime = settings.exhaleTime || 6
        this.age = settings.age || 30

        localStorage.setItem('userSettings', JSON.stringify({
          targetHeartRateMin: this.targetHeartRateMin,
          targetHeartRateMax: this.targetHeartRateMax,
          inhaleTime: this.inhaleTime,
          holdTime: this.holdTime,
          exhaleTime: this.exhaleTime,
          age: this.age
        }))
      } catch (error) {
        console.error('保存设置失败:', error)
        throw error
      }
    }
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'settings',
        storage: localStorage
      }
    ]
  }
}) 