<template>
  <div class="register-container">
    <el-card class="register-card">
      <h2 class="title">用户注册</h2>
      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="90px">
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="registerForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="registerForm.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" placeholder="请输入邮箱（选填）" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="register-btn" :loading="loading" @click="handleRegister">
            注册
          </el-button>
        </el-form-item>
        <div class="login-link">
          <span>已有账号？</span>
          <el-button link type="primary" @click="goLogin">返回登录</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { register } from '@/api/services/auth/modules/register'

const router = useRouter()
const registerFormRef = ref<FormInstance>()
const loading = ref(false)

const registerForm = reactive({
  realName: '',
  username: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// 密码一致性校验
const validateConfirmPassword = (_rule: any, value: string, callback: (error?: Error) => void) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules: FormRules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

async function handleRegister() {
  if (!registerFormRef.value) return
  registerFormRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }
    loading.value = true
    try {
      const payload = {
        realName: registerForm.realName,
        username: registerForm.username,
        phone: registerForm.phone,
        email: registerForm.email || null,
        password: registerForm.password,
        confirmPassword: registerForm.confirmPassword,
      }
      const res = await register(payload)
      if (res.code === 200) {
        // 清除旧登录状态，避免守卫把 /login 重定向到首页
        localStorage.removeItem('authorization')
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        localStorage.removeItem('currentTopMenuId')

        ElMessage.success('注册成功，请登录')
        // 携带用户名跳转登录页
        router.push({ path: '/login', query: { username: registerForm.username } })
      } else {
        ElMessage.error(res.message || '注册失败')
      }
    } catch (error) {
      ElMessage.error('注册失败，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}

function goLogin() {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box;
}
.register-card {
  width: 460px;
  padding: 20px;
}
.title {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}
.register-btn {
  width: 100%;
}
.login-link {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  margin-top: -6px;
}
</style>