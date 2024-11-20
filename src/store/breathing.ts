import { defineStore } from 'pinia'
import { BreathingPattern, ExerciseSettings, CalibrationData } from '../types'

export const useBreathingStore = defineStore('breathing', {
  state: () => ({
    currentPattern: null as BreathingPattern | null,
    calibrationData: null as CalibrationData | null,
    exerciseSettings: {
      duration: 3,
      mode: 'press',
      pressureLevel: 5,
      customBreathing: false,
      inhaleTime: 4,
      exhaleTime: 4
    } as ExerciseSettings,
    statistics: {
      todayMinutes: 0,
      weeklyMinutes: 0,
      totalSessions: 0
    }
  }),

  actions: {
    async startExercise(settings: ExerciseSettings) {
      this.exerciseSettings = settings
      // 实现开始训练逻辑
    },

    async saveCalibrationData(data: CalibrationData) {
      this.calibrationData = data
      // 保存校准数据到本地存储
      uni.setStorageSync('calibration_data', data)
    },

    async resetCalibration() {
      this.calibrationData = null
      uni.removeStorageSync('calibration_data')
    }
  }
}) 