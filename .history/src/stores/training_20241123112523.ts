import { defineStore } from 'pinia'

interface Training {
  id: string
  date: string
  duration: number
  modeName: string
  avgHeartRate?: number
  maxHeartRate?: number
  minHeartRate?: number
  breathingRate?: number
  completed: boolean
}

interface TrainingState {
  trainings: Training[]
  currentTraining: Training | null
}

export const useTrainingStore = defineStore('training', {
  state: (): TrainingState => ({
    trainings: [],
    currentTraining: null
  }),

  actions: {
    // 根据日期获取训练记录
    async getTrainingsByDate(date: string): Promise<Training[]> {
      try {
        // 格式化日期为 YYYY-MM-DD
        const targetDate = date.split('T')[0]
        return this.trainings.filter(training => 
          training.date.startsWith(targetDate)
        )
      } catch (error) {
        console.error('获取训练记录失败:', error)
        return []
      }
    },

    // 获取最近的训练记录
    async getRecentTrainings(limit: number = 5): Promise<Training[]> {
      try {
        return [...this.trainings]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit)
      } catch (error) {
        console.error('获取最近训练记录失败:', error)
        return []
      }
    },

    // 获取今日训练总时长（分钟）
    async getTodayTrainingMinutes(): Promise<number> {
      try {
        const today = new Date().toISOString().split('T')[0]
        const todayTrainings = await this.getTrainingsByDate(today)
        return todayTrainings.reduce((total, training) => total + training.duration, 0)
      } catch (error) {
        console.error('获取今日训练时长失败:', error)
        return 0
      }
    },

    // 获取连续训练天数
    async getStreakDays(): Promise<number> {
      try {
        if (this.trainings.length === 0) return 0

        const sortedDates = [...new Set(
          this.trainings.map(t => t.date.split('T')[0])
        )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

        let streakDays = 1
        const oneDay = 24 * 60 * 60 * 1000

        for (let i = 1; i < sortedDates.length; i++) {
          const diff = new Date(sortedDates[i-1]).getTime() - new Date(sortedDates[i]).getTime()
          if (diff <= oneDay) {
            streakDays++
          } else {
            break
          }
        }

        return streakDays
      } catch (error) {
        console.error('获取连续训练天数失败:', error)
        return 0
      }
    },

    // 添加训练记录
    async addTraining(training: Partial<Training>): Promise<void> {
      try {
        const newTraining: Training = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          duration: 0,
          modeName: '',
          completed: false,
          ...training
        }
        this.trainings.push(newTraining)
        this.saveToLocalStorage()
      } catch (error) {
        console.error('添加训练记录失败:', error)
        throw error
      }
    },

    // 初始化 store
    async initialize(): Promise<void> {
      try {
        const savedTrainings = localStorage.getItem('trainings')
        if (savedTrainings) {
          this.trainings = JSON.parse(savedTrainings)
        }
      } catch (error) {
        console.error('初始化训练记录失败:', error)
      }
    },

    // 保存到本地存储
    private saveToLocalStorage(): void {
      localStorage.setItem('trainings', JSON.stringify(this.trainings))
    }
  }
}) 