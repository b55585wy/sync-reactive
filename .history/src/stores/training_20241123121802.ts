import { defineStore } from 'pinia'

// 定义训练记录的接口
interface Training {
  id: string
  date: string
  duration: number
  modeName: string
  avgHeartRate?: number
  maxHeartRate?: number
  minHeartRate?: number
  // 其他可能的训练数据字段
}

// 定义 store 的状态接口
interface TrainingState {
  trainings: Training[]
}

export const useTrainingStore = defineStore('training', {
  state: (): TrainingState => ({
    trainings: [], // 存储所有训练记录
  }),

  actions: {
    // 根据日期获取训练记录
    async getTrainingsByDate(date: string): Promise<Training[]> {
      try {
        // 这里应该是从本地存储或后端API获取数据
        return this.trainings.filter(training => 
          training.date.startsWith(date)
        )
      } catch (error) {
        console.error('获取训练记录失败:', error)
        return []
      }
    },

    // 获取最近的训练记录
    async getRecentTrainings(limit: number = 5): Promise<Training[]> {
      try {
        // 返回最近的训练记录，按日期降序排序
        return [...this.trainings]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit)
      } catch (error) {
        console.error('获取最近训练记录失败:', error)
        return []
      }
    },

    // 添加训练记录
    async addTraining(training: Partial<Training>): Promise<void> {
      try {
        const newTraining: Training = {
          id: Date.now().toString(), // 简单的ID生成
          date: new Date().toISOString(),
          duration: 0,
          modeName: '',
          ...training
        }
        this.trainings.push(newTraining)
        // 这里可以添加保存到本地存储或发送到后端的逻辑
      } catch (error) {
        console.error('添加训练记录失败:', error)
        throw error
      }
    },

    // 开始新的训练
    async startTraining(): Promise<void> {
      // 训练开始时的逻辑
    },

    // 结束训练
    async endTraining(trainingData: Partial<Training>): Promise<void> {
      try {
        await this.addTraining(trainingData)
      } catch (error) {
        console.error('结束训练失败:', error)
        throw error
      }
    },

    // 初始化 store
    async initialize(): Promise<void> {
      try {
        const savedTrainings = localStorage.getItem('trainings')
        if (savedTrainings) {
          const parsedTrainings = JSON.parse(savedTrainings)
          // 验证数据类型
          if (Array.isArray(parsedTrainings)) {
            this.trainings = parsedTrainings as Training[]
          }
        }
      } catch (error) {
        console.error('初始化训练记录失败:', error)
      }
    }
  },

  // 在状态变化时保存到本地存储
  watch: {
    trainings: {
      handler(newTrainings: Training[]) {
        localStorage.setItem('trainings', JSON.stringify(newTrainings))
      },
      deep: true
    }
  }
}) 