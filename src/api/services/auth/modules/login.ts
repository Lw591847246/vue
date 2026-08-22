import authRequest from '../index'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  userId: number
  username: string
  realName: string
  email: string | null
  phone: number | null
  deptIds: [] | null
  roleIds: [] | null
  permissions: number | null
  loginTime: number
  loginIp: string | null
  token: string
  authorization: string
  avatar: string | null
}

// 登录
export function login(data: LoginParams) {
  return authRequest.post<LoginResult>('/front/v1/login', data)
}
