import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 侧边栏是否折叠
  const sidebarCollapsed = ref(false)
  // 是否为移动设备（宽度小于 768px 视为移动端）
  const isMobile = ref(window.innerWidth < 768)

  // 切换折叠状态
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // 监听窗口大小变化，自动设置移动端状态和折叠
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
    // 移动端默认折叠，桌面端默认展开（可根据需要调整）
    if (isMobile.value) {
      sidebarCollapsed.value = true
    } else {
      sidebarCollapsed.value = false
    }
  })

  // 初始化状态
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }

  return { sidebarCollapsed, isMobile, toggleSidebar }
})