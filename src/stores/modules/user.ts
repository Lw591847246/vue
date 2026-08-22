import { defineStore } from 'pinia'
import { login as loginApi } from '@/api/services/auth/modules/login'
import type { LoginParams, LoginResult } from '@/api/services/auth/modules/login'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    authorization: '',
    username: '',
    userId: 0,
    roles: [] as string[],
  }),
  actions: {
    async login(params: LoginParams) {
      try {
        const result = await loginApi(params) // 返回的是 data 部分
        console.log('登录成功', result)
        // 存储 token 到 state 和 localStorage
        this.token = result.data.token
        this.authorization = result.data.authorization
        this.username = params.username
        this.userId = result.data.userId
        console.log('登录成功 this.token ', this.token)
        console.log('登录成功 this.authorization ', this.authorization)
        localStorage.setItem('authorization', result.data.authorization)
        localStorage.setItem('token', result.data.token)
        localStorage.setItem('userId', String(result.data.userId))
        console.log('写入后 authorization：', localStorage.getItem('authorization'))
        console.log('写入后 token：', localStorage.getItem('token'))
        ElMessage.success('登录成功')
        return true
      } catch (error) {
        // 错误已在拦截器处理，这里可再补充
        console.log('登录异常', error)
        return false
      }
    },
    logout() {
      this.token = ''
      this.authorization = ''
      this.username = ''
      localStorage.removeItem('authorization')
      localStorage.removeItem('token')
      window.location.href = '/login'
    },
  },
})
