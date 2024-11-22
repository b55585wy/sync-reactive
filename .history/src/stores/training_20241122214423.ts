import { defineStore } from 'pinia';

interface HeartRateRecord {
  value: number;
  timestamp: number;
}

export const useTrainingStore = defineStore('training', {
  state: () => ({
    heartRateHistory: [] as HeartRateRecord[],
    startTime: null as string | null,
    isTraining: false
  }),
  
  actions: {
    startTraining() {
      this.heartRateHistory = [];
      this.startTime = new Date().toISOString();
      this.isTraining = true;
    },
    
    addHeartRateRecord(heartRate: number) {
      this.heartRateHistory.push({
        value: heartRate,
        timestamp: Date.now()
      });
    },
    
    endTraining() {
      this.isTraining = false;
    },
    
    clearTrainingData() {
      this.heartRateHistory = [];
      this.startTime = null;
      this.isTraining = false;
    }
  }
}); 