// 路由管理
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/check-in', // 默认打开页面
    children: [
      {
        path: 'check-in',
        name: 'CheckIn',
        component: () => import('../views/CheckIn/Index.vue'),
        meta: { title: '打卡' }
      },
      {
        path: 'records',
        name: 'Records',
        component: () => import('../views/Records/Index.vue'),
        meta: { title: '记录' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile/Index.vue'),
        meta: { title: '我的' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router