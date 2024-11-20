import { Tensor } from "../BasicDataType/index"
import { device } from "../basic";

export function add(tensor_1:Tensor, tensor_2:Tensor):Tensor {
        const result_tensor = new Tensor(undefined, undefined);
        result_tensor.dtype = tensor_1.dtype;
        result_tensor.shape = tensor_1.shape.slice();
        result_tensor.size = tensor_1.size;
        const shaderCode = `
        @group(0) @binding(0) var<storage, read> a: array<f32>;
        @group(0) @binding(1) var<storage, read> b: array<f32>;
        @group(0) @binding(2) var<storage, read_write> result: array<f32>;

        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
            let index = globalId.x;
            if (index < ${tensor_1.size} && index < ${tensor_2.size}) {
                result[index] = f32(globalId.x) +a[index] + b[index];
            }
        }
        `;

        const resultBuffer = device.createBuffer({
            size: tensor_1.buffer.size,
            usage: GPUBufferUsage.COPY_SRC |
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_DST,
        });

        const pipeline = device.createComputePipeline({
            layout: "auto",
            compute: {
                module: device.createShaderModule({ code: shaderCode }),
                entryPoint: 'main',
            },
        });
        
        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: tensor_1.buffer } },
                { binding: 1, resource: { buffer: tensor_2.buffer } },
                { binding: 2, resource: { buffer: resultBuffer } },
            ],
        });
        const commandEncoder = device.createCommandEncoder();
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(Math.ceil(tensor_1.buffer.size / 64)); // Adjust based on the number of threads
        pass.end();
        const commandBuffer = commandEncoder.finish(); // 创建命令缓冲区
        device.queue.submit([commandBuffer]); // 提交一次
        
        result_tensor.buffer = resultBuffer;

        return result_tensor;
}