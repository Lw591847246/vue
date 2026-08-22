import { defineStore } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'

export interface TabItem {
  path: string
  title: string
  name?: string
  affix?: boolean // 是否固定不可关闭（如首页）
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as TabItem[],
  }),
  actions: {
    // 添加标签
    addTab(route: RouteLocationNormalized) {
      // 隐藏页面不加入标签（如登录页、404等）
      if (route.meta?.hidden) return

      const path = route.path
      const title = (route.meta?.title as string) || (route.name as string) || '未命名'
      const exists = this.tabs.some((tab) => tab.path === path)
      if (!exists) {
        this.tabs.push({ path, title, name: route.name as string })
      }
    },
    // 删除单个标签
    removeTab(path: string) {
      const index = this.tabs.findIndex((tab) => tab.path === path)
      if (index !== -1 && this.tabs[index] && !this.tabs[index].affix) {
        this.tabs.splice(index, 1)
      }
    },
    // 删除所有非固定标签
    removeAllTabs() {
      this.tabs = this.tabs.filter((tab) => tab.affix)
    },
    // 删除其他标签（保留当前和固定）
    removeOtherTabs(currentPath: string) {
      this.tabs = this.tabs.filter((tab) => tab.affix || tab.path === currentPath)
    },
    // 清空
    resetTabs() {
      this.tabs = []
    },
  },
})
