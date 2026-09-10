// import router from './index'
// import { useUserStore } from '@/stores/modules/user'
// import { usePermissionStore } from '@/stores/modules/permission'
// import { useTabsStore } from '@/stores/modules/tabs'

// router.beforeEach(async (to) => {
//   const userStore = useUserStore()
//   const permissionStore = usePermissionStore()
//   const hasToken = localStorage.getItem('authorization')
//   console.log('守卫触发，目标路由：', to.path, 'token：', hasToken)
//   if (to.path === '/login') {
//     return hasToken ? { path: '/' } : true
//   }

//   if (!hasToken) {
//     return '/login'
//   }

//   if (!permissionStore.isLoaded) {
//     try {
//       await permissionStore.generateRoutes()
//       return { ...to, replace: true }
//     } catch (error) {
//       userStore.logout()
//       return '/login'
//     }
//   }

//   return true
// })

// router.afterEach((to) => {
//   const tabsStore = useTabsStore()
//   tabsStore.addTab(to)
// })



import router from './index'
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import { useTabsStore } from '@/stores/modules/tabs'

// 无需登录即可访问的公开路径
const publicPaths = ['/login', '/register']

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  const hasToken = localStorage.getItem('authorization')

  console.log('守卫触发，目标路由：', to.path, 'token：', hasToken)

  // 公开路径
  if (publicPaths.includes(to.path)) {
    // 注册页永远放行
    if (to.path === '/register') {
      return true
    }
    // 登录页：已登录跳首页，未登录放行
    if (to.path === '/login') {
      return hasToken ? { path: '/' } : true
    }
  }

  // 需要登录的页面
  if (!hasToken) {
    return '/login'
  }

  // 权限加载
  if (!permissionStore.isLoaded) {
    try {
      await permissionStore.generateRoutes()
      return { ...to, replace: true }
    } catch (error) {
      userStore.logout()
      return '/login'
    }
  }

  return true
})

router.afterEach((to) => {
  const tabsStore = useTabsStore()
  tabsStore.addTab(to)
})