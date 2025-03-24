<script setup lang="ts">
import { routes } from '../router';
import { useRoute, useRouter } from 'vue-router';
const routeAll = useRoute();
const router = useRouter();
const routes_image = [
    new URL("../assets/homepage.svg", import.meta.url).href,
    new URL("../assets/dataloader.svg", import.meta.url).href,
    new URL("../assets/preprocess.svg", import.meta.url).href,
    new URL("../assets/model.svg", import.meta.url).href,
    new URL("../assets/train.svg", import.meta.url).href,
    new URL("../assets/result.svg", import.meta.url).href,
]
</script>

<template>
    <div class="navigator">
        <div 
        v-for="(route, index) in routes" 
        :key="route.name" 
        :class="route.name == routeAll.name?'route-chosen':'route'"
        @click="router.push({path:route.path})"
        >
            <img :src="routes_image[index]"/>
            <p>{{ route.name }}</p>
        </div>
    </div>
</template>

<style lang="css" scoped>
.navigator {
    height:100vh;
    width:15vw;
    background:#0080FF30;
    font-size:18px;
    font-weight:bold;
}
.route {
    height:10%;
    width:100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor:pointer;
    background-color: #0080FF30;
}
.route:hover {
    background-color: #0080FF60;
}
.route-chosen {
    height:10%;
    width:100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: #0080FF60;
}
img {
    height:60%;
    margin-left:5%;
    margin-right:5%;
}
</style>