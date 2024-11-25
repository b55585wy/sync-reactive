export interface TrainingMode {
  id: string
  name: string
  description: string
  icon: string
  color: string
  difficulty: 'success' | 'warning' | 'danger'
  difficultyText: string
  duration: number
  requiredDevices: ('breathing' | 'heartRate')[]
  breathingPattern?: {
    inhale: number
    hold?: number
    exhale: number
  }
  targetHeartRate?: {
    min: number
    max: number
  }
}

export const TRAINING_MODES: Record<string, TrainingMode> = {
  basic_breathing: {
    // ... 基础配置 ...
    breathingPattern: {
      inhale: 4,
      exhale: 6
    }
  },
  
  deep_breathing: {
    // ... 基础配置 ...
    breathingPattern: {
      inhale: 4,
      hold: 4,
      exhale: 6
    }
  },

  coherence: {
    // ... 基础配置 ...
    breathingPattern: {
      inhale: 5,
      exhale: 5
    },
    targetHeartRate: {
      min: 60,
      max: 80
    }
  },

  stress_relief: {
    // ... 基础配置 ...
    breathingPattern: {
      inhale: 4,
      hold: 7,
      exhale: 8
    },
    targetHeartRate: {
      min: 60,
      max: 75
    }
  }
} 