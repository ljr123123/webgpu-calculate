<template>
    <div class="navigator">
        <div v-for="item in router_set.routes" class="first-router">
            {{ item.name }}
        </div>
    </div>
</template>
<script setup lang="ts">
import { router_set } from '../global';
</script>
<style lang="css" scoped>
.navigator{
    height:100vh;
    width:18vw;
    box-shadow: 0 0 3px black;
}
.first-router {
    display: flex;
    justify-content: center;
    align-items: center;
    width:100%;
    height:10vh;
    margin-bottom:1vh;
    background: rgba(87, 87, 196, 0.5);
}
</style>