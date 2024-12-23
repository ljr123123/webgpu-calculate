// vue-router.ts
import { createRouter, createWebHistory } from 'vue-router';

// 定义路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import("../views/home.vue") ,
  }
];

// 创建路由器实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 导出路由器实例
export default router;