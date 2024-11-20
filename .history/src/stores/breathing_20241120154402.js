import { defineStore } from 'pinia'

export const useBreathingStore = defineStore('breathing', {
  state: () => ({
    // 用户训练状态
    userStats: {
      todayMinutes: 0,
      weeklyMinutes: 0,
      monthlyMinutes: 0,
      streakDays: 0,
      lastTrainingDate: null
    },
    
    // 当前训练状态
    currentSession: {
      isActive: false,
      mode: null, // 'guided' | 'freestyle' | 'custom'
      phase: 'prepare', // 'prepare' | 'inhale' | 'hold' | 'exhale' | 'rest'
      elapsedTime: 0,
      totalTime: 0
    },
    
    // 呼吸数据
    breathingData: {
      baselineInhale: 0,
      baselineExhale: 0,
      currentValue: 0,
      maxInhale: 0,
      maxExhale: 0
    },
    
    // 训练设置
    settings: {
      guidedMode: {
        inhaleTime: 4,
        holdTime: 7,
        exhaleTime: 8,
        restTime: 2,
        cycles: 5
      },
      customMode: {
        inhaleTime: 4,
        holdTime: 0,
        exhaleTime: 4,
        restTime: 2,
        cycles: 10
      }
    }
  }),

  actions: {
    startSession(mode, duration) {
      this.currentSession = {
        isActive: true,
        mode,
        phase: 'prepare',
        elapsedTime: 0,
        totalTime: duration * 60 // 转换为秒
      }
    },

    updatePhase(phase) {
      this.currentSession.phase = phase
    },

    updateBreathingValue(value) {
      this.breathingData.currentValue = value
      
      if (this.currentSession.phase === 'inhale') {
        this.breathingData.maxInhale = Math.max(this.breathingData.maxInhale, value)
      } else if (this.currentSession.phase === 'exhale') {
        this.breathingData.maxExhale = Math.min(this.breathingData.maxExhale, value)
      }
    },

    completeSession() {
      // 更新训练统计
      const duration = this.currentSession.elapsedTime / 60 // 转换为分钟
      this.userStats.todayMinutes += duration
      this.userStats.weeklyMinutes += duration
      this.userStats.monthlyMinutes += duration
      this.userStats.lastTrainingDate = new Date().toISOString()
    setPhase(phase) {
      this.currentSession.phase = phase
    },

    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings }
    }
  },

  getters: {
    currentPhase: (state) => state.currentSession.phase,
    isSessionActive: (state) => state.currentSession.isActive,
    sessionDuration: (state) => {
      if (!state.currentSession.startTime) return 0
      return (Date.now() - state.currentSession.startTime) / 1000
    }
  }
}) 