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