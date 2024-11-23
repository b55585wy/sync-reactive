interface TrainingState {
  currentHeartRate: number;
  targetMin: number;
  targetMax: number;
  breathingRate: number;
  elapsedTime: number;
}

interface Advice {
  type: 'success' | 'warning' | 'info';
  title: string;
  content: string;
}

export function generateTrainingAdvice(state: TrainingState): Advice {
  const { currentHeartRate, targetMin, targetMax, breathingRate, elapsedTime } = state;
  
  // 心率过高建议
  if (currentHeartRate > targetMax) {
    return {
      type: 'warning',
      title: '心率偏高',
      content: `建议将呼吸频率降至${breathingRate - 1}次/分，着重延长呼气时间`
    };
  }
  
  // 心率过低建议
  if (currentHeartRate < targetMin) {
    return {
      type: 'info',
      title: '心率偏低',
      content: '可以适当提高呼吸频率，保持专注的深呼吸'
    };
  }
  
  // 根据训练时长给出建议
  if (elapsedTime > 300 && currentHeartRate > targetMin) {
    return {
      type: 'success',
      title: '训练效果良好',
      content: '心率平稳，继续保持当前的呼吸节奏'
    };
  }
  
  return {
    type: 'info',
    title: '保持专注',
    content: '跟随呼吸引导，保持放松的心态'
  };
} 