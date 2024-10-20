// src/router.js
import { createRouter, createWebHistory } from 'vue-router';


const routes = [
  {
    path:"/",
    component:() => import("./views/dataLoading.vue")
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
