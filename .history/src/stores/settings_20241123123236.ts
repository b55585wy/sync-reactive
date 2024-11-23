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
  // 添加其他状态的类型...
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
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
    reminderDays: [1,2,3,4,5]
  }),

  getters: {
    // 根据年龄计算建议心率范围
    suggestedHeartRateRange: (state) => {
      const maxHR = 220 - state.age;
      return {
        min: Math.round(maxHR * 0.5),
        max: Math.round(maxHR * 0.7)
      };
    },
    
    // 获取当前呼吸模式的具体参数
    breathingParameters: (state) => {
      const patterns = {
        beginner: { inhale: 4, hold: 2, exhale: 6 },
        intermediate: { inhale: 4, hold: 4, exhale: 8 },
        advanced: { inhale: 6, hold: 4, exhale: 10 }
      };
      return patterns[state.breathingPattern];
    }
  },

  actions: {
    async initializeSettings(): Promise<void> {
      try {
        const savedSettings = localStorage.getItem('userSettings')
        if (savedSettings) {
          const settings: Settings = JSON.parse(savedSettings)
          console.log('加载保存的设置:', settings)
          this.username = settings.username || ''
          this.age = settings.age || 30
          this.height = settings.height || 170
          this.weight = settings.weight || 60
          this.weeklyGoal = settings.weeklyGoal || 150
          this.targetHeartRateMin = settings.targetHeartRateMin || 60
          this.targetHeartRateMax = settings.targetHeartRateMax || 80
          this.inhaleTime = settings.inhaleTime || 4
          this.holdTime = settings.holdTime || 2
          this.exhaleTime = settings.exhaleTime || 6
          this.breathingPattern = settings.breathingPattern || 'beginner'
          this.reminderEnabled = settings.reminderEnabled || false
          this.reminderTime = settings.reminderTime || '08:00'
          this.reminderDays = settings.reminderDays || [1,2,3,4,5]
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
        if (settings.age !== undefined) {
          this.age = settings.age
        }
        if (settings.height !== undefined) {
          this.height = settings.height
        }
        if (settings.weight !== undefined) {
          this.weight = settings.weight
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
        if (settings.inhaleTime !== undefined) {
          this.inhaleTime = settings.inhaleTime
        }
        if (settings.holdTime !== undefined) {
          this.holdTime = settings.holdTime
        }
        if (settings.exhaleTime !== undefined) {
          this.exhaleTime = settings.exhaleTime
        }
        if (settings.breathingPattern !== undefined) {
          this.breathingPattern = settings.breathingPattern
        }
        if (settings.reminderEnabled !== undefined) {
          this.reminderEnabled = settings.reminderEnabled
        }
        if (settings.reminderTime !== undefined) {
          this.reminderTime = settings.reminderTime
        }
        if (settings.reminderDays !== undefined) {
          this.reminderDays = settings.reminderDays
        }
        
        localStorage.setItem('userSettings', JSON.stringify({
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
          reminderDays: this.reminderDays
        }))
      } catch (error) {
        console.error('保存设置失败:', error)
        throw error
      }
    }
  }
}) 