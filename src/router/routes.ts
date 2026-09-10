import type { RouteRecordRaw } from 'vue-router'

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true },
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'home' },
      },
      // 这里可以继续添加静态子路由，或通过动态路由添加
    ],
  },

  {
  path: '/register',
  name: 'Register',
  component: () => import('@/views/register/index.vue'),
  meta: { hidden: true },
},
]
