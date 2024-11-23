import { defineStore } from 'pinia'

export const useTrainingStore = defineStore('training', {
  state: () => ({
    startTime: '',
    heartRateHistory: [] as { timestamp: number; value: number }[],
    isTraining: false,
    trainingHistory: [] as any[]
  }),

  actions: {
    startTraining() {
      this.isTraining = true;
      this.startTime = new Date().toISOString();
      this.heartRateHistory = [];
    },

    endTraining() {
      this.isTraining = false;
      // 保存训练记录
      this.trainingHistory.push({
        startTime: this.startTime,
        endTime: new Date().toISOString(),
        heartRateHistory: [...this.heartRateHistory]
      });
    },

    addHeartRateRecord(heartRate: number) {
      this.heartRateHistory.push({
        timestamp: Date.now(),
        value: heartRate
      });
    }
  }
}) 