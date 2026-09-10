<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 class="title">系统登录</h2>
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock"
            show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
        <div class="register-link">
          <span>还没有账号？</span>
          <el-button link type="primary" @click="goRegister">立即注册</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import type { FormInstance, FormRules } from 'element-plus'
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    const success = await userStore.login(loginForm)
    loading.value = false
    if (success) {
      router.push('/')
    }
  })
}

function goRegister() {
  router.push('/register')
}

onMounted(() => {
  const username = route.query.username
  if (username && typeof username === 'string') {
    loginForm.username = username
  }
})

</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 20px;
}

.title {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.login-btn {
  width: 100%;
}

.register-link {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  margin-top: -6px;
}
</style>