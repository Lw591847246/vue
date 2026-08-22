import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { SERVICE_PORTS } from './src/config/ports'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载对应环境的 .env 文件（如 .env.development、.env.production）
  const env = loadEnv(mode, process.cwd())
  // 从环境变量中读取基础 URL，默认为 http://localhost
  const baseUrl = env.VITE_API_BASE_URL || 'http://localhost'

  return {
    plugins: [vue(), vueJsx(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        // SSO 服务（登录、权限）
        '/front/v1': {
          target: `${baseUrl}:${SERVICE_PORTS['sumec-sso']}`,
          changeOrigin: true,
        },
        // PDM 服务
        '/pdm/v1': {
          target: `${baseUrl}:${SERVICE_PORTS['sumec-pdm']}`,
          changeOrigin: true,
        },
        // ERP 服务
        '/erp/v1': {
          target: `${baseUrl}:${SERVICE_PORTS['sumec-erp']}`,
          changeOrigin: true,
        },
        // 其他服务按需添加...
      },
    },
  }
})
