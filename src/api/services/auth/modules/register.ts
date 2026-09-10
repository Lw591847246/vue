import authRequest from '../index'

export interface RegisterParams {
  realName: string
  username: string
  phone: string
  email: string | null
  password: string
  confirmPassword: string
}

export interface RegisterResult {
  code: number
  message: string
  data?: any
  success?: boolean
}

// 注册
export function register(data: RegisterParams) {
  return authRequest.post<RegisterResult>('/front/v1/user/add', data)
}