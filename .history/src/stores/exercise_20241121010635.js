import { defineStore } from 'pinia'

export const useExerciseStore = defineStore('exercise', {
  state: () => ({
    currentHeartRate: 0,
    exerciseTime: 0,
    isExercising: false,
    exerciseHistory: [],
  }),
  
  actions: {
    setHeartRate(rate) {
      this.currentHeartRate = rate
    },
    startExercise() {
      this.isExercising = true
    },
    stopExercise() {
      this.isExercising = false
    },
    updateTime(time) {
      this.exerciseTime = time
    },
    addToHistory(exerciseData) {
      this.exerciseHistory.push(exerciseData)
    }
  },
  
  getters: {
    averageHeartRate: (state) => {
      if (state.exerciseHistory.length === 0) return 0
      const sum = state.exerciseHistory.reduce((acc, curr) => acc + curr.heartRate, 0)
      return Math.round(sum / state.exerciseHistory.length)
    }
  }
})