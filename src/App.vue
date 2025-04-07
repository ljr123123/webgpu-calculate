<script setup lang="ts">
import { onMounted } from 'vue';
import { add } from '../GPUCompute/pipeline/add';
import { device } from '../GPUCompute/basic/device';
import { test } from '../GPUCompute/core/virtualData.test';
import { a } from '../GPUCompute/coreTest/test';
import { addTest } from '../GPUCompute/coreTest/add.test';
import { GlobalDeviceGroup } from '../GPUCompute/coreTest/global';
import { createVirtualData } from '../GPUCompute/coreTest/virtualBuffer.test';
import { Type } from '../GPUCompute/coreTest/type';
onMounted(async () => {
    const aType = Type.array(Type.float32, 4);
    const bType = Type.array(Type.float32, 4);
    const a = createVirtualData("a", aType, GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
    const b = createVirtualData("b", bType, GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
    const c = addTest(a, b);
    await GlobalDeviceGroup.orderManager.linearOrdersRun();
    const result = await c.read();
    console.log(result);
})
</script>
<template>
    <div class="main-box">
    </div>
</template>

<style lang="css" scoped></style>