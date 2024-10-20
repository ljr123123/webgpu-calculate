import { Tensor } from "../BasicDataType";
import { device } from "../basic";
import { dataTypeOpe } from "../BasicDataType";
import { getDataFromBuffer } from "../test";

export async function fit_transform(tensors:Tensor[]) {
    const resultBuffer = device.createBuffer({
        size:8,
        usage: GPUBufferUsage.COPY_SRC |
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(resultBuffer, 0, new Float32Array([0.0, 0.0]));

    tensors.forEach(element => {
        const module = `
        @group(0) @binding(0) var<storage, read> a: array<${dataTypeOpe(element.dtype)}>;
        @group(0) @binding(1) var<storage, read_write> result: array<f32>;

        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
            let index = globalId.x;
            if (index <  ${element.size}) {
                result[0] = result[0] + (f32(a[index]) / f32(${tensors.length * element.size}));
            }
        }
        `
        const pipeline = device.createComputePipeline({
            layout: "auto",
            compute: {
                module: device.createShaderModule({ code: module }),
                entryPoint: 'main',
            },
        });

        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: element.buffer } },
                { binding: 1, resource: { buffer: resultBuffer } },
            ],
        });

        const commandEncoder = device.createCommandEncoder();
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(Math.ceil(element.buffer.size / 64)); // Adjust based on the number of threads
        pass.end();
        const commandBuffer = commandEncoder.finish(); // 创建命令缓冲区
        device.queue.submit([commandBuffer]); // 提交一次
    });

    console.log(tensors.length, tensors[0].size);
    await device.queue.onSubmittedWorkDone();
    const result = await getDataFromBuffer(resultBuffer);
    console.log(result);

}