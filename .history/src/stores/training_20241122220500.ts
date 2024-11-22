import { defineStore } from 'pinia';

interface HeartRateRecord {
  value: number;
  timestamp: string;
}

export const useTrainingStore = defineStore('training', {
  state: () => ({
    startTime: '',
    heartRateHistory: [] as HeartRateRecord[],
    isTraining: false
  }),

  actions: {
    startTraining() {
      this.startTime = new Date().toISOString();
      this.heartRateHistory = [];
      this.isTraining = true;
    },

    addHeartRateRecord(heartRate: number) {
      if (this.isTraining && heartRate > 0) {
        this.heartRateHistory.push({
          value: heartRate,
          timestamp: new Date().toISOString()
        });
      }
    },

    endTraining() {
      this.isTraining = false;
      // 不要清空历史数据，让总结页面可以使用
      // this.heartRateHistory = [];
    }
  },

  getters: {
    getHeartRateHistory: (state) => state.heartRateHistory,
    getStartTime: (state) => state.startTime
  }
}); 