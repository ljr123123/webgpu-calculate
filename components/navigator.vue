<template>
    <div class="navigator">
        <div v-for="item in routerNames" :key="item.name">
            {{ item.name }}
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { routes } from '../global';
const routerNames = ref(routes);

</script>