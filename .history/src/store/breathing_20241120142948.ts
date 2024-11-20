import { defineStore } from 'pinia'

export const useBreathingStore = defineStore('breathing', {
  state: () => ({
    currentPattern: null,
    sessionHistory: [],
    userPreferences: {
      defaultDuration: 300, // 5分钟
      preferredPattern: '4-7-8',
      soundEnabled: true
    }
  }),
  
  actions: {
    async startSession(patternId: string) {
      // 开始呼吸会话逻辑
    },
    
    async saveSessionResults(sessionData: SessionData) {
      // 保存会话数据
    }
  }
}) 