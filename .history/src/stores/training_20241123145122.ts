import { defineStore } from 'pinia'

export const useTrainingStore = defineStore('training', {
  state: () => ({
    heartRateHistory: [] as { timestamp: number; value: number }[],
    startTime: '',
    isTraining: false
  }),

  actions: {
    addHeartRateRecord(heartRate: number) {
      this.heartRateHistory.push({
        timestamp: Date.now(),
        value: heartRate
      });
      console.log('TrainingStore 记录心率:', heartRate);
    },

    startTraining() {
      this.isTraining = true;
      this.startTime = new Date().toISOString();
      this.heartRateHistory = [];
      console.log('开始训练记录');
    },

    endTraining() {
      this.isTraining = false;
      console.log('结束训练记录');
    }
  }
}) 