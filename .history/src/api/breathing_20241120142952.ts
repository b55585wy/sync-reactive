import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1'
})

export const breathingApi = {
  // 获取呼吸模式列表
  getPatterns() {
    return api.get('/patterns')
  },
  
  // 保存训练记录
  saveSession(sessionData: SessionData) {
    return api.post('/sessions', sessionData)
  },
  
  // 获取用户统计数据
  getStats(timeRange: 'day' | 'week' | 'month') {
    return api.get(`/stats/${timeRange}`)
  }
} 