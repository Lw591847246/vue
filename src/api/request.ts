import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

export interface CreateRequestOptions {
  baseURL: string
  timeout?: number
  getToken?: () => string | null
  handleError?: (error: any) => void
  successCode?: number | string
}

export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  success: boolean
}

export function createRequest(options: CreateRequestOptions): AxiosInstance {
  const service = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeout ?? 15000,
  })

  // 请求拦截器：添加 token
  service.interceptors.request.use(
    (config) => {
      // 默认从 localStorage 读取 authorization（登录时存储）
      const token = options.getToken ? options.getToken() : localStorage.getItem('authorization')
      if (token) {
        config.headers.Authorization = token // 注意：authorization 已包含 Bearer，无需再加
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  // 响应拦截器
  service.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const res = response
      const successCode = options.successCode ?? 200
      // 根据后端约定判断成功码
      if (res.data.code !== successCode) {
        ElMessage.error(res.data.message || '请求失败')
        return Promise.reject(new Error(res.data.message || 'Error'))
      }
      return res.data as any // 直接返回 data 内容
    },
    (error) => {
      console.log('=====响应拦截器========error=', error)
      // 统一处理 401 跳转登录等
      if (error.response?.status === 401) {
        // 清除 token 并跳转登录
        localStorage.removeItem('authorization')
        window.location.href = '/login'
        ElMessage.error('登录已过期，请重新登录')
      } else {
        ElMessage.error(error.message || '网络错误')
      }
      return Promise.reject(error)
    },
  )

  return service
}
