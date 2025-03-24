<script setup lang="ts">
import { onMounted } from 'vue';
import { add } from '../GPUCompute/pipeline/add';
import { device } from '../GPUCompute/basic/device';
import { test } from '../GPUCompute/core/virtualData';
onMounted(async () => {
    test
    // let sum = 0;
    // let bufferSum = 0;
    // const array: GPUBindGroupLayoutEntry[] = [];
    // for (let i = 0; i < 5; i++) {
    //     array.push({
    //         binding: i,
    //         buffer: {
    //             type: "storage"
    //         },
    //         visibility: GPUShaderStage.COMPUTE
    //     })
    // }
    // const bindGroupLayout = device.createBindGroupLayout({
    //     entries: array
    // });
    // const buffer = device.createBuffer({
    //     size: 1536,
    //     usage: GPUBufferUsage.STORAGE
    // });
    // const bufferBindingArray: GPUBindGroupEntry[] = [];
    // for (let i = 0; i < 5; i++) {
    //     bufferBindingArray.push({
    //         binding: i,
    //         resource: {
    //             buffer: buffer,
    //             offset: i * 256,
    //             size: 256
    //         }
    //     })
    // }
    // const shader = device.createShaderModule({
    //     code: `
    //     @group(0) @binding(0) var<storage, read_write> a:array<f32>;
    //     @group(0) @binding(1) var<storage, read_write> b:array<f32>;
    //     @group(0) @binding(2) var<storage, read_write> c:array<f32>;
    //     @group(0) @binding(3) var<storage, read_write> d:array<f32>;
    //     @group(0) @binding(4) var<storage, read_write> e:array<f32>;
    //     @compute @workgroup_size(1) 
    //     fn main(){}`
    // });
    // const pipelineLayout = device.createPipelineLayout({
    //     bindGroupLayouts: [bindGroupLayout]
    // })
    // const pipeline = device.createComputePipeline({
    //     layout: pipelineLayout,
    //     compute: {
    //         module: shader,
    //         entryPoint: "main"
    //     }
    // });
    // const bindGroup = device.createBindGroup({
    //     layout:bindGroupLayout,
    //     entries:bufferBindingArray
    // })
    // for (let i = 0; i < 200; i++) {
    //     if (i % 10 === 0) await new Promise(requestAnimationFrame);
    //     // await new Promise(resolve => setTimeout(resolve, 0)); // 释放主线程
    //     const random = Math.ceil(Math.random() * 10000);
    //     const size = random * 256;
    //     bufferSum += size;
    //     const start = performance.now();
    //     const bindGroup = device.createBindGroup({
    //     layout:bindGroupLayout,
    //     entries:bufferBindingArray
    //     })
    //     // const encoder = device.createCommandEncoder();
    //     // let pass = encoder.beginComputePass();
    //     // pass.setBindGroup(0, bindGroup);
    //     // pass.setPipeline(pipeline);
    //     // pass.end();
    //     // encoder.finish();
    //     const end = performance.now();
    //     sum += (end - start);
    // }
    // console.log(sum, bufferSum)
})
</script>
<template>
    <div class="main-box">
    </div>
</template>

<style lang="css" scoped></style>