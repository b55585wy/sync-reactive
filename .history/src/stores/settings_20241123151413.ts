import { defineStore } from 'pinia'
export interface Settings {
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
  goal: string[];
  gender: 'male' | 'female' | 'other';
  theme: 'light' | 'dark' | 'auto';
  autoSync: boolean;
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
>>>>>>> Stashed changes
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
<<<<<<< Updated upstream
=======
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
<<<<<<< Updated upstream
    age: 30
=======
    breathingPattern: 'beginner',
    reminderEnabled: false,
    reminderTime: '08:00',
    reminderDays: [1,2,3,4,5],
    defaultTrainingDuration: 15
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    updateSettings(settings: Partial<Settings>) {
      Object.assign(this, settings)
    },

    calculateDefaultHeartRateRange() {
      const maxHR = 220 - this.age
      this.targetHeartRateMin = Math.round(maxHR * 0.5)
      this.targetHeartRateMax = Math.round(maxHR * 0.7)
=======
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
>>>>>>> Stashed changes
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