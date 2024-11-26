const router_set = {
    routes:[
        {path:"/", name:"数据预处理", component:() => import("./views/main.vue")},
        {path:"/train", name:"模型训练"},
        {path:"/evaluate", name:"模型评估"},
    ]
}
export {
    router_set
}