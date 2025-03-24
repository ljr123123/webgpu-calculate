<script setup lang="ts">
const props = defineProps<{
  is_layer:boolean
}>()
</script>

<template>
    <div class="mask-layer" v-show="props.is_layer"></div>
</template>

<style lang="css" scoped>
.mask-layer {
    position: fixed;
    top:0;
    left:0;
    height: 100vh;
    width: 100vw;
    background: #00000020;
    z-index:1024;
}
</style>