import { SERVICE_PORTS } from './ports'

// 从环境变量读取基础地址
const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

/**
 * 根据微服务模块名生成完整的服务地址
 * @param serviceName 微服务模块名（如 'sumec-sso'）
 * @returns 完整的后端服务地址，如 'http://localhost:8000'
 */
export function getServiceBaseUrl(serviceName: string): string {
  const port = SERVICE_PORTS[serviceName]
  if (!port) {
    console.warn(`未找到服务 ${serviceName} 的端口配置，将使用基础地址`)
    return baseUrl
  }
  return `${baseUrl}:${port}`
}

// 常用服务的快捷方法（可选）
export const serviceUrls = {
  sso: getServiceBaseUrl('sumec-sso'),
  files: getServiceBaseUrl('sumec-files'),
  erp: getServiceBaseUrl('sumec-erp'),
  pdm: getServiceBaseUrl('sumec-pdm'),
  // 按需添加
}
