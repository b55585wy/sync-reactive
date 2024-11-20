import { defineStore } from 'pinia'

export const useBreathingStore = defineStore('breathing', {
  state: () => ({
    currentSession: {
      isActive: false,
      phase: 'inhale', // 'inhale' | 'hold' | 'exhale'
      duration: 0,
      startTime: null
    },
    settings: {
      inhaleTime: 4,
      holdTime: 7,
      exhaleTime: 8,
      cycles: 5
    },
    stats: {
      todayMinutes: 0,
      totalSessions: 0,
      streakDays: 0,
      lastSessionDate: null
    }
  }),

  actions: {
    startSession() {
      this.currentSession.isActive = true
      this.currentSession.startTime = Date.now()
      this.currentSession.phase = 'inhale'
      this.currentSession.duration = 0
    },

    stopSession() {
      this.currentSession.isActive = false
      this.updateStats()
    },

    updateStats() {
      if (this.currentSession.startTime) {
        const duration = (Date.now() - this.currentSession.startTime) / 1000 / 60
        this.stats.todayMinutes += duration
        this.stats.totalSessions += 1
        this.stats.lastSessionDate = new Date().toISOString()
      }
    },

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