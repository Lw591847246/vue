// import router from './index'
// import { useUserStore } from '@/stores/modules/user'

// router.beforeEach((to, from, next) => {
//   const userStore = useUserStore()
//   const hasToken = localStorage.getItem('authorization')

//   if (to.path === '/login') {
//     // 已登录则跳转首页
//     if (hasToken) {
//       next({ path: '/' })
//     } else {
//       next()
//     }
//   } else {
//     // 未登录跳转登录页
//     if (!hasToken) {
//       next('/login')
//     } else {
//       next()
//     }
//   }
// })

import router from './index'
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import { useTabsStore } from '@/stores/modules/tabs'

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  const hasToken = localStorage.getItem('authorization')
  console.log('守卫触发，目标路由：', to.path, 'token：', hasToken)
  if (to.path === '/login') {
    return hasToken ? { path: '/' } : true
  }

  if (!hasToken) {
    return '/login'
  }

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

// router.beforeEach(async (to, from, next) => {
//   const userStore = useUserStore()
//   const permissionStore = usePermissionStore()
//   const hasToken = localStorage.getItem('authorization')
//   console.log('to.path:', to.path, 'from.path:', from.path)
//   console.log('hasToken:', localStorage.getItem('authorization'))
//   console.log('守卫触发，目标路由：', to.path, 'token：', hasToken)
//   if (to.path === '/login') {
//     if (hasToken) {
//       next({ path: '/' })
//     } else {
//       next()
//     }
//   } else {
//     if (!hasToken) {
//       console.log('无token，跳转登录')
//       next('/login')
//     } else {
//       if (!permissionStore.isLoaded) {
//         try {
//           await permissionStore.generateRoutes()
//           next({ ...to, replace: true })
//         } catch (error) {
//           console.error('加载权限失败', error)
//           userStore.logout()
//           next('/login')
//         }
//       } else {
//         next()
//       }
//     }
//   }
// })
