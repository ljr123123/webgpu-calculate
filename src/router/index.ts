import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes:RouteRecordRaw[] = [
    {
        path:"/",
        name:"homepage",
        component:() => import("../views/homepage.vue"),
    },
    {
        path:"/dataloader",
        name:"dataloader",
        component:() => import("../views/dataloader.vue")
    },
    {
        path:"/preprocess",
        name:"preprocess",
        component:() => import("../views/preprocess.vue")
    },
    {
        path:"/model",
        name:"model",
        component:() => import("../views/model.vue")
    },
    {
        path:"/train",
        name:"train",
        component:() => import("../views/preprocess.vue")
    },
    {
        path:"/result",
        name:"result",
        component:() => import("../views/result.vue")
    }
];

const router = createRouter({
    history:createWebHistory(),
    routes
});

export {
    router,
    routes
}