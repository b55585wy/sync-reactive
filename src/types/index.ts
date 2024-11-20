export interface Device {
  id: string
  name: string
  icon: string
  status: 'connected' | 'disconnected'
}

export interface CalibrationData {
  avgInhalation: number
  avgExhalation: number
  relativeChange: number
  timestamp: number
}

export interface ExerciseSettings {
  duration: number
  mode: 'press' | 'smart'
  pressureLevel?: number
  customBreathing: boolean
  inhaleTime?: number
  exhaleTime?: number
} 