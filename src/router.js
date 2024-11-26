// src/router.js
import { createRouter, createWebHistory } from 'vue-router';
import { router_set } from "./global"

const router = createRouter({
  history: createWebHistory(),
  routes:router_set.routes
});

export default router;
