import { createRequest } from '@/api/request'

const chatRequest = createRequest({
  baseURL: '', // 请求路径以 /chat 开头，由 Vite 代理转发
  timeout: 600000, // 根据后端响应时间调整
})

export default chatRequest