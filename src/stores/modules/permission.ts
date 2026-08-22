import { defineStore } from 'pinia'
import { getPermission, type MenuItem } from '@/api/services/auth/modules/permission'
import router from '@/router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from './user'

const modules = import.meta.glob('@/views/**/index.vue')
const NotFoundComponent = () => import('@/views/404.vue')

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    topMenus: [] as MenuItem[],
    sideMenus: [] as MenuItem[],
    buttons: [] as string[],
    subsystems: [] as any[],
    dynamicRoutes: [] as RouteRecordRaw[],
    isLoaded: false,
    currentTopMenuId: null as number | null,
  }),
  actions: {
    async generateRoutes() {
      const userStore = useUserStore()
      let userId: number | null = userStore.userId
      if (!userId) {
        const stored = localStorage.getItem('userId')
        userId = stored ? Number(stored) : null
      }
      if (!userId) throw new Error('缺少 userId')

      const res = await getPermission(userId)
      const data = res.data

      const root = data.routes[0]
      this.topMenus = root?.children || []
      this.buttons = data.buttons || []
      this.subsystems = data.subsystems || []

      // ---------- 持久化恢复 ----------
      const savedTopMenuId = Number(localStorage.getItem('currentTopMenuId'))
      if (savedTopMenuId && this.topMenus.some((m) => m.id === savedTopMenuId)) {
        this.currentTopMenuId = savedTopMenuId
      } else {
        this.currentTopMenuId = this.topMenus[0]?.id || null
      }
      // 根据 currentTopMenuId 获取对应的侧边菜单
      this.sideMenus = this.topMenus.find((m) => m.id === this.currentTopMenuId)?.children || []

      // 添加默认服务的动态路由
      this.dynamicRoutes = this.buildRoutes(this.sideMenus)
      this.dynamicRoutes.forEach((route) => {
        router.addRoute('Layout', route)
      })

      this.isLoaded = true
    },

    switchTopMenu(menuId: number) {
      if (menuId === this.currentTopMenuId) return

      this.currentTopMenuId = menuId
      const top = this.topMenus.find((m) => m.id === menuId)
      this.sideMenus = top?.children || []

      // ---------- 持久化保存 ----------
      localStorage.setItem('currentTopMenuId', String(menuId))

      // 清除旧的动态路由
      this.removeDynamicRoutes()

      // 添加新的动态路由
      this.dynamicRoutes = this.buildRoutes(this.sideMenus)
      this.dynamicRoutes.forEach((route) => {
        router.addRoute('Layout', route)
      })
    },

    removeDynamicRoutes() {
      this.dynamicRoutes.forEach((route) => {
        if (route.name) {
          router.removeRoute(route.name as string)
        }
      })
      this.dynamicRoutes = []
    },

    buildRoutes(menus: MenuItem[]): RouteRecordRaw[] {
      return menus.map((menu) => {
        const routePath = menu.path && menu.path !== '' ? menu.path : `/${menu.code}`
        const componentKey = `/src/views/${menu.code}/index.vue`
        const component = modules[componentKey] || NotFoundComponent

        const route: RouteRecordRaw = {
          path: routePath,
          name: menu.code,
          component: component,
          meta: { title: menu.name, icon: menu.icon || '', code: menu.code },
        }
        if (menu.children && menu.children.length > 0) {
          return {
            ...route,
            children: this.buildRoutes(menu.children),
          }
        }
        return route
      })
    },

    resetPermission() {
      this.removeDynamicRoutes()
      this.topMenus = []
      this.sideMenus = []
      this.buttons = []
      this.subsystems = []
      this.isLoaded = false
      this.currentTopMenuId = null
      // 清除持久化的选中服务
      localStorage.removeItem('currentTopMenuId')
    },
  },
})
