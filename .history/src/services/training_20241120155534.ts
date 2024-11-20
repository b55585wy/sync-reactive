import { ref, computed } from 'vue'
import { BluetoothService } from './bluetooth'

export class TrainingService {
  private bluetooth = new BluetoothService()
  
  // 训练状态
  private state = ref({
    phase: 'prepare',
    elapsedTime: 0,
    breathingValue: 0,
    maxInhale: 0,
    maxExhale: 0,
    cycles: 0,
    isActive: false
  })
  
  // 训练设置
  private settings = ref({
    duration: 180, // 3分钟
    inhaleTime: 4,
    holdTime: 4,
    exhaleTime: 4,
    restTime: 2,
    targetCycles: 10
  })

  // 计时器
  private timer: number | null = null

  // 计算属性
  readonly progress = computed(() => {
    return (this.state.value.elapsedTime / (this.settings.value.duration * 60)) * 100
  })

  readonly currentPhase = computed(() => this.state.value.phase)
  
  readonly isActive = computed(() => this.state.value.isActive)

  async startTraining() {
    try {
      // 连接设备
      await this.bluetooth.connect()
      
      // 初始化训练状态
      this.state.value = {
        phase: 'inhale',
        elapsedTime: 0,
        breathingValue: 0,
        maxInhale: 0,
        maxExhale: 0,
        cycles: 0,
        isActive: true
      }
      
      // 启动计时器
      this.startTimer()
      
      return true
    } catch (error) {
      console.error('开始训练失败:', error)
      throw error
    }
  }

  pauseTraining() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.state.value.isActive = false
  }

  resumeTraining() {
    this.state.value.isActive = true
    this.startTimer()
  }

  async stopTraining() {
    // 停止计时器
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    
    // 断开设备
    await this.bluetooth.disconnect()
    
    // 保存训练数据
    this.saveTrainingData()
    
    // 重置状态
    this.state.value.isActive = false
  }

  private startTimer() {
    this.timer = setInterval(() => {
      if (this.state.value.isActive) {
        this.state.value.elapsedTime++
        this.updatePhase()
      }
    }, 1000)
  }

  private updatePhase() {
    const { inhaleTime, holdTime, exhaleTime, restTime } = this.settings.value
    const totalCycleTime = inhaleTime + holdTime + exhaleTime + restTime
    const timeInCycle = this.state.value.elapsedTime % totalCycleTime

    if (timeInCycle < inhaleTime) {
      this.state.value.phase = 'inhale'
    } else if (timeInCycle < inhaleTime + holdTime) {
      this.state.value.phase = 'hold'
    } else if (timeInCycle < inhaleTime + holdTime + exhaleTime) {
      this.state.value.phase = 'exhale'
    } else {
      this.state.value.phase = 'rest'
    }

    // 完成一个周期
    if (timeInCycle === 0) {
      this.state.value.cycles++
    }
  }

  private saveTrainingData() {
    const trainingData = {
      date: new Date().toISOString(),
      duration: this.state.value.elapsedTime,
      cycles: this.state.value.cycles,
      maxInhale: this.state.value.maxInhale,
      maxExhale: this.state.value.maxExhale
    }
    
    // 保存到本地存储或发送到服务器
    // ...
  }
} 