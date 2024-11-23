import { defineStore } from 'pinia'

interface Settings {
  username: string
  weeklyGoal: number
  targetHeartRateMin: number
  targetHeartRateMax: number
  // 添加其他设置项的类型...
}

interface SettingsState {
  username: string
  weeklyGoal: number
  targetHeartRateMin: number
  targetHeartRateMax: number
  // 添加其他状态的类型...
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    username: '',
    weeklyGoal: 150, // 默认周目标150分钟
    targetHeartRateMin: 60, // 默认最小心率
    targetHeartRateMax: 80, // 应该是 80 而不是 100
  }),

  actions: {
    async initializeSettings(): Promise<void> {
      try {
        const savedSettings = localStorage.getItem('userSettings')
        if (savedSettings) {
          const settings: Settings = JSON.parse(savedSettings)
          this.username = settings.username || ''
          this.weeklyGoal = settings.weeklyGoal || 150
          this.targetHeartRateMin = settings.targetHeartRateMin || 60
          this.targetHeartRateMax = settings.targetHeartRateMax || 100
        }
      } catch (error) {
        console.error('初始化设置失败:', error)
      }
    },

    async saveSettings(settings: Partial<Settings>): Promise<void> {
      try {
        if (settings.username !== undefined) {
          this.username = settings.username
        }
        if (settings.weeklyGoal !== undefined) {
          this.weeklyGoal = settings.weeklyGoal
        }
        if (settings.targetHeartRateMin !== undefined) {
          this.targetHeartRateMin = settings.targetHeartRateMin
        }
        if (settings.targetHeartRateMax !== undefined) {
          this.targetHeartRateMax = settings.targetHeartRateMax
        }
        
        localStorage.setItem('userSettings', JSON.stringify({
          username: this.username,
          weeklyGoal: this.weeklyGoal,
          targetHeartRateMin: this.targetHeartRateMin,
          targetHeartRateMax: this.targetHeartRateMax,
        }))
      } catch (error) {
        console.error('保存设置失败:', error)
        throw error
      }
    }
  }
}) 