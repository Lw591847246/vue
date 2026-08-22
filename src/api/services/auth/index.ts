import { createRequest } from '@/api/request'

// 使用空 baseURL，所有请求路径以 /front/v1/... 开头
// Vite 代理会将 /front 转发到 SSO 服务（localhost:8000）
const authRequest = createRequest({
  baseURL: '', // 关键：不要写完整后端地址
  timeout: 10000,
})

export default authRequest
