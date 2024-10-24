import { Tensor } from "../BasicDataType";
import { device } from "../basic";
import { getDataFromBuffer } from "../test";

// // 如果不做归一化处理，方差可能会爆出来
// export async function getMeanAndStd(tensors: Tensor[]): Promise<GPUBuffer> {
//     const first_moment = new Int32Array([0]);
//     const second_moment = new Int32Array([0]);
//     const mean_std_data = new Float32Array([0, 0]);
//     const first_moment_buffer = device.createBuffer({
//         size: first_moment.byteLength,
//         usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE
//     });
//     const second_moment_buffer = device.createBuffer({
//         size: second_moment.byteLength,
//         usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE
//     });
//     const mean_std_buffer = device.createBuffer({
//         size: mean_std_data.byteLength,
//         usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE
//     });
//     device.queue.writeBuffer(first_moment_buffer, 0, first_moment);
//     device.queue.writeBuffer(second_moment_buffer, 0, second_moment);
//     device.queue.writeBuffer(mean_std_buffer, 0, mean_std_data);
//     for (let index = 0; index < tensors.length; index++) {
//         const element = tensors[index];
//         const module = `
//         @group(0) @binding(0) var<storage, read> tensor:array<${element.dtype}>;
//         @group(0) @binding(1) var<storage, read_write> first_moment:atomic<i32>;
//         @group(0) @binding(2) var<storage, read_write> second_moment:atomic<i32>;

//         @compute @workgroup_size(64)
//         fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
//             let index = globalId.x;
//             if (index < ${element.size}) {
//                 atomicAdd(&first_moment, tensor[index]);
//                 atomicAdd(&second_moment, tensor[index] * tensor[index]);
//             }
//         }
//         `
//         const module_2 = `
//         @group(0) @binding(0) var<storage, read_write> first_moment: array<i32>; 
//         @group(0) @binding(1) var<storage, read_write> second_moment: array<i32>;
//         @group(0) @binding(2) var<storage, read_write> mean_std: array<f32>;

//         @compute @workgroup_size(1)
//         fn main() {
//             let sum = f32(first_moment[0]);
//             let sum_square = f32(second_moment[0]);
//             let k = f32(${element.size});
//             let n = f32(${index * element.size});

//             let old_mean = mean_std[0];
//             let old_var = mean_std[1];

//             let new_mean = (n * old_mean + sum) / (n + k);
//             let new_var = ((n - 1.0) * old_var + sum_square + ((n * k) / (n + k)) * (old_mean - new_mean) * (old_mean - new_mean)) / (n + k - 1.0);

//             mean_std[0] = new_mean;         
//             mean_std[1] = new_var;    

//             first_moment[0] = i32(0);
//             second_moment[0] = i32(0);
// }


// `;


//         const pipeline = device.createComputePipeline({
//             layout: "auto",
//             compute: {
//                 module: device.createShaderModule({ code: module }),
//                 entryPoint: 'main',
//             },
//         });
//         const bindGroup = device.createBindGroup({
//             layout: pipeline.getBindGroupLayout(0),
//             entries: [
//                 { binding: 0, resource: { buffer: element.buffer } },
//                 { binding: 1, resource: { buffer: first_moment_buffer } },
//                 { binding: 2, resource: { buffer: second_moment_buffer } }
//             ],
//         });
//         const pipeline_2 = device.createComputePipeline({
//             layout: "auto",
//             compute: {
//                 module: device.createShaderModule({ code: module_2 }),
//                 entryPoint: 'main',
//             },
//         });
//         const bindGroup_2 = device.createBindGroup({
//             layout: pipeline_2.getBindGroupLayout(0),
//             entries: [
//                 { binding: 0, resource: { buffer: first_moment_buffer } },
//                 { binding: 1, resource: { buffer: second_moment_buffer } },
//                 { binding: 2, resource: { buffer: mean_std_buffer } }
//             ],
//         });
//         const commandEncoder = device.createCommandEncoder();
//         const pass = commandEncoder.beginComputePass();
//         pass.setPipeline(pipeline);
//         pass.setBindGroup(0, bindGroup);
//         pass.dispatchWorkgroups(Math.ceil(element.buffer.size / 64)); // Adjust based on the number of threads
//         pass.end();
//         const commandBuffer = commandEncoder.finish(); // 创建命令缓冲区
//         device.queue.submit([commandBuffer]); // 提交一次
//         await device.queue.onSubmittedWorkDone();

//         const commandEncoder_2 = device.createCommandEncoder();
//         const pass_2 = commandEncoder_2.beginComputePass();
//         pass_2.setPipeline(pipeline_2);
//         pass_2.setBindGroup(0, bindGroup_2);
//         pass_2.dispatchWorkgroups(1); // Adjust based on the number of threads
//         pass_2.end();
//         const commandBuffer_2 = commandEncoder_2.finish(); // 创建命令缓冲区
//         device.queue.submit([commandBuffer_2]); // 提交一次
//         await device.queue.onSubmittedWorkDone();

//         const mean_std_result = await getDataFromBuffer(mean_std_buffer, "f32");
//         console.log("mean:", mean_std_result[0]);
//         console.log("std:", mean_std_result[1]);
//         console.log(index);
//     }

//     const result = await getDataFromBuffer(mean_std_buffer, "f32");

//     return result;
// }

export async function Normalize(tensors: Tensor[], mean: number, std: number) {
    const variance = Math.sqrt(std);
    const module = `
    @group(0) @binding(0) var<storage, read_write> tensor:array<${tensors[0].dtype}>;
    @group(0) @binding(1) var<storage, read_write> float_buffer:array<f32>;

    @compute @workgroup_size(64) 
    fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
            let index = globalId.x;
            if (index < ${tensors[0].size}) {
                let f32_temp = f32(tensor[index]);
                let result = (f32_temp - f32(${mean})) / f32(${variance});
                float_buffer[index] = result;
            }
        }
    `
    for (let index = 0; index < tensors.length; index++) {
        let float_buffer = device.createBuffer({
            size: tensors[index].size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE
        })
        const pipeline = device.createComputePipeline({
            layout: "auto",
            compute: {
                module: device.createShaderModule({ code: module })
            }
        });
        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: tensors[index].buffer } },
                { binding: 1, resource: { buffer: float_buffer } }
            ]
        });
        const commandEncoder = device.createCommandEncoder();
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(Math.ceil(tensors[index].buffer.size / 64)); // Adjust based on the number of threads
        pass.end();
        const commandBuffer = commandEncoder.finish(); // 创建命令缓冲区
        device.queue.submit([commandBuffer]); // 提交一次
        await device.queue.onSubmittedWorkDone();
        tensors[index].buffer = float_buffer;
        console.log(index);
    }
}

export async function getMaxAndMin(tensors: Tensor[]): Promise<{ biggest: number, smallest: number }> {
    const biggest_data = new Int32Array([-Infinity]);
    const smallest_data = new Int32Array([Infinity]);

    const biggest_buffer = device.createBuffer({
        size: biggest_data.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE
    });
    const smallest_buffer = device.createBuffer({
        size: smallest_data.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE
    });

    device.queue.writeBuffer(biggest_buffer, 0, biggest_data);
    device.queue.writeBuffer(smallest_buffer, 0, smallest_data);

    for (const element of tensors) {

        const module = `
        @group(0) @binding(0) var<storage, read> tensor: array<${element.dtype}>;
        @group(0) @binding(1) var<storage, read_write> biggest: atomic<i32>;
        @group(0) @binding(2) var<storage, read_write> smallest: atomic<i32>;

        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
            let index = globalId.x;
            if (index < ${element.size}) {
                let value = tensor[index];

                // 更新最大值
                atomicMax(&biggest, value);
                // 更新最小值
                atomicMin(&smallest, value);
            }
        }
        `;

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
                { binding: 1, resource: { buffer: biggest_buffer } },
                { binding: 2, resource: { buffer: smallest_buffer } }
            ],
        });

        const commandEncoder = device.createCommandEncoder();
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(Math.ceil(element.size / 64));
        pass.end();

        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);
        await device.queue.onSubmittedWorkDone();
    }

    // 使用 getDataFromBuffer 读取结果
    const biggestResult = await getDataFromBuffer(biggest_buffer, "i32");
    const smallestResult = await getDataFromBuffer(smallest_buffer, "i32");

    return {
        biggest: biggestResult[0],
        smallest: smallestResult[0]
    };
}

export async function getMeanAndStd(tensors: Tensor[]): Promise<GPUBuffer> {
    const first_moment = new Int32Array([0]);
    const second_moment = new Int32Array([0]);
    const mean_std_data = new Float32Array([0, 0]);
    const first_moment_buffer = device.createBuffer({
        size: first_moment.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE
    });
    const second_moment_buffer = device.createBuffer({
        size: second_moment.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE
    });
    const mean_std_buffer = device.createBuffer({
        size: mean_std_data.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE
    });

    device.queue.writeBuffer(first_moment_buffer, 0, first_moment);
    device.queue.writeBuffer(second_moment_buffer, 0, second_moment);
    device.queue.writeBuffer(mean_std_buffer, 0, mean_std_data);

    const results = []; // Array to collect results

    for (let index = 0; index < tensors.length; index++) {
        const element = tensors[index];
        const module = `
            @group(0) @binding(0) var<storage, read> tensor:array<${element.dtype}>;
            @group(0) @binding(1) var<storage, read_write> first_moment:atomic<i32>;
            @group(0) @binding(2) var<storage, read_write> second_moment:atomic<i32>;

            @compute @workgroup_size(64)
            fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
                let index = globalId.x;
                if (index < ${element.size}) {
                    atomicAdd(&first_moment, tensor[index]);
                    atomicAdd(&second_moment, tensor[index] * tensor[index]);
                }
            }
        `;

        const module_2 = `
            @group(0) @binding(0) var<storage, read_write> first_moment: array<i32>;
            @group(0) @binding(1) var<storage, read_write> second_moment: array<i32>;
            @group(0) @binding(2) var<storage, read_write> mean_std: array<f32>;

            @compute @workgroup_size(1)
            fn main() {
                let sum = f32(first_moment[0]);
                let sum_square = f32(second_moment[0]);
                let k = f32(${element.size});
                let n = f32(${index * element.size});

                let old_mean = mean_std[0];
                let old_var = mean_std[1];

                let new_mean = (n * old_mean + sum) / (n + k);
                let new_var = ((n - 1.0) * old_var + sum_square + ((n * k) / (n + k)) * (old_mean - new_mean) * (old_mean - new_mean)) / (n + k - 1.0);

                mean_std[0] = new_mean;
                mean_std[1] = new_var;

                first_moment[0] = i32(0);
                second_moment[0] = i32(0);
            }
        `;

        // Create pipelines and bind groups as before...
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
                            { binding: 1, resource: { buffer: first_moment_buffer } },
                            { binding: 2, resource: { buffer: second_moment_buffer } }
                        ],
                    });
                    const pipeline_2 = device.createComputePipeline({
                        layout: "auto",
                        compute: {
                            module: device.createShaderModule({ code: module_2 }),
                            entryPoint: 'main',
                        },
                    });
                    const bindGroup_2 = device.createBindGroup({
                        layout: pipeline_2.getBindGroupLayout(0),
                        entries: [
                            { binding: 0, resource: { buffer: first_moment_buffer } },
                            { binding: 1, resource: { buffer: second_moment_buffer } },
                            { binding: 2, resource: { buffer: mean_std_buffer } }
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
                    await device.queue.onSubmittedWorkDone();
            
                    const commandEncoder_2 = device.createCommandEncoder();
                    const pass_2 = commandEncoder_2.beginComputePass();
                    pass_2.setPipeline(pipeline_2);
                    pass_2.setBindGroup(0, bindGroup_2);
                    pass_2.dispatchWorkgroups(1); // Adjust based on the number of threads
                    pass_2.end();
                    const commandBuffer_2 = commandEncoder_2.finish(); // 创建命令缓冲区
                    device.queue.submit([commandBuffer_2]); // 提交一次
                    await device.queue.onSubmittedWorkDone();
        // After computation
        const mean_std_result = await getDataFromBuffer(mean_std_buffer, "f32");
        console.log(mean_std_result[0], mean_std_result[1]);
        results.push(`Index: ${index}, Mean: ${mean_std_result[0]}, Std: ${mean_std_result[1]}`); // Collect results
    }

    // Create a Blob and download it
    const blob = new Blob([results.join('\n')], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'results.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const finalResult = await getDataFromBuffer(mean_std_buffer, "f32");
    return finalResult;
}
