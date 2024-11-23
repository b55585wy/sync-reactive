import { defineStore } from 'pinia'

interface Settings {
  username: string
  age: number
  height: number
  weight: number
  weeklyGoal: number
  targetHeartRateMin: number
  targetHeartRateMax: number
  inhaleTime: number
  holdTime: number
  exhaleTime: number
  breathingPattern: 'beginner' | 'intermediate' | 'advanced'
  reminderEnabled: boolean
  reminderTime: string
  reminderDays: number[]
  defaultTrainingDuration: number
  // 添加其他设置项的类型...
}

interface SettingsState {
  username: string
  age: number
  height: number
  weight: number
  weeklyGoal: number
  targetHeartRateMin: number
  targetHeartRateMax: number
  inhaleTime: number
  holdTime: number
  exhaleTime: number
  breathingPattern: 'beginner' | 'intermediate' | 'advanced'
  reminderEnabled: boolean
  reminderTime: string
  reminderDays: number[]
  defaultTrainingDuration: number
  // 添加其他状态的类型...
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    username: '',
    age: 30,
    height: 170,
    weight: 60,
    weeklyGoal: 150,
    targetHeartRateMin: 60,
    targetHeartRateMax: 80,
    inhaleTime: 4,
    holdTime: 2,
    exhaleTime: 6,
    breathingPattern: 'beginner',
    reminderEnabled: false,
    reminderTime: '08:00',
    reminderDays: [1,2,3,4,5],
    defaultTrainingDuration: 15
  }),

  getters: {
    // 添加一个 getter 来获取所有设置
    getAllSettings(): Settings {
      return {
        username: this.username,
        age: this.age,
        height: this.height,
        weight: this.weight,
        weeklyGoal: this.weeklyGoal,
        targetHeartRateMin: this.targetHeartRateMin,
        targetHeartRateMax: this.targetHeartRateMax,
        inhaleTime: this.inhaleTime,
        holdTime: this.holdTime,
        exhaleTime: this.exhaleTime,
        breathingPattern: this.breathingPattern,
        reminderEnabled: this.reminderEnabled,
        reminderTime: this.reminderTime,
        reminderDays: this.reminderDays,
        defaultTrainingDuration: this.defaultTrainingDuration
      };
    }
  },

  actions: {
    // 初始化设置
    async initializeSettings(): Promise<void> {
      try {
        const savedSettings = localStorage.getItem('userSettings')
        if (savedSettings) {
          const settings: Settings = JSON.parse(savedSettings)
          Object.assign(this, settings);
        }
      } catch (error) {
        console.error('初始化设置失败:', error)
      }
    },

    // 保存设置
    async saveSettings(settings: Partial<Settings>): Promise<void> {
      try {
        // 更新状态
        Object.assign(this, settings);
        
        // 保存到 localStorage
        localStorage.setItem('userSettings', JSON.stringify(this.getAllSettings));
      } catch (error) {
        console.error('保存设置失败:', error)
        throw error
      }
    }
  }
}) 