<script setup lang="ts">
import { onMounted } from 'vue';
import { createVirtualBuffer, malloc, readBuffer, sendPipelineOrder, solve, writeBuffer } from '../GPUCompute/core/global';
import { Type } from '../GPUCompute/core/type';
import { PipelineOrder } from '../GPUCompute/core/order/singleOrder';


onMounted(async () => {
    const a = createVirtualBuffer("bufferA", Type.float32);
    const b = createVirtualBuffer("bufferB", Type.float32);
    const c = createVirtualBuffer("bufferC", Type.float32);
    malloc(a, GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
    malloc(b, GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
    malloc(c, GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
    writeBuffer(a, [1.5]);
    writeBuffer(b, [1.5]);
    // pipelineKey的设置 -- pipelineKey-param1Type-param2Type-......
    // pipeline + bindGroupLayout合为一组
    sendPipelineOrder("Hello World", {
        variables: [
            {
                layoutEntry: {
                    binding: 0,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false,
                        minBindingSize: 0
                    },
                    visibility: GPUShaderStage.COMPUTE
                },
                virtual: a
            },
            {
                layoutEntry: {
                    binding: 1,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false,
                        minBindingSize: 0
                    },
                    visibility: GPUShaderStage.COMPUTE
                },
                virtual: b
            },
            {
                layoutEntry: {
                    binding: 2,
                    buffer: {
                        type: "storage",
                        hasDynamicOffset: false,
                        minBindingSize: 0
                    },
                    visibility: GPUShaderStage.COMPUTE
                },
                virtual: c
            },
        ],
        otherFunctions: [],
        entryPoint: "main",
        main: `
        ${c.label} = ${a.label} + ${b.label};
        `,
        dispatchWorkGroups: [1, 1, 1]
    });
    await solve();
    await readBuffer(c);
})
</script>
<template>
    <div class="main-box">
    </div>
</template>

<style lang="css" scoped></style>