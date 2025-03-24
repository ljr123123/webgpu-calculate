<script setup lang="ts">
import Mask from './mask.vue';

enum PopType {
    warn = 1 << 0,
    error = 1 << 1,
    check = 1 << 2,
    input = 1 << 3
}

const props = defineProps<{
  is_pop:boolean,
  type:PopType
}>();
</script>

<template>
    <div>
        <Mask :is_layer="props.is_pop"/>
        
        <div class="chosen-box warn-box" v-if="props.type == PopType.warn">

        </div>

        <div class="chosen-box error-box" v-if="props.type == PopType.error">

        </div>

        <div class="chosen-box check-box" v-if="props.type == PopType.check">

        </div>

        <div class="chosen-box input-box" v-if="props.type == PopType.warn">

        </div>
    </div>
</template>