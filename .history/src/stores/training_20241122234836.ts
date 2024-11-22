import { defineStore } from 'pinia'

export const useTrainingStore = defineStore('training', {
  state: () => ({
    startTime: '',
    heartRateHistory: [],
    isTraining: false,
    trainingHistory: [] // 添加训练历史记录
  }),

  actions: {
    // ... 现有的 actions ...

    // 获取指定日期的训练记录
    async getTrainingsByDate(date: string) {
      try {
        // 从本地存储或后端API获取训练记录
        const history = JSON.parse(localStorage.getItem('trainingHistory') || '[]')
        return history.filter(training => training.startTime.startsWith(date))
      } catch (error) {
        console.error('获取训练记录失败:', error)
        return []
      }
    },

    // 获取最近的训练记录
    async getRecentTrainings(limit = 5) {
      try {
        const history = JSON.parse(localStorage.getItem('trainingHistory') || '[]')
        return history
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
          .slice(0, limit)
      } catch (error) {
        console.error('获取最近训练记录失败:', error)
        return []
      }
    },

    // 保存训练记录
    async saveTraining(trainingData) {
      try {
        const history = JSON.parse(localStorage.getItem('trainingHistory') || '[]')
        history.push({
          ...trainingData,
          id: Date.now().toString(),
          startTime: new Date().toISOString()
        })
        localStorage.setItem('trainingHistory', JSON.stringify(history))
      } catch (error) {
        console.error('保存训练记录失败:', error)
        throw error
      }
    }
  }
}) 