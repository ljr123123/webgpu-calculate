export class vector {
    constructor(data, dataType) {
        if(data == undefined) {
            this.size = undefined;
            this.buffer = undefined;
            this.type = undefined;
        } 
        else {
            this.size = data.length;
            this.buffer = device.createBuffer({
                size: data.byteLength,
                usage:
                    GPUBufferUsage.COPY_SRC |
                    GPUBufferUsage.STORAGE |
                    GPUBufferUsage.COPY_DST ,
            });
            this.type = dataType;
            device.queue.writeBuffer(this.buffer, 0, data);
        }
    }
    copy() {
        const vector_new = new vector();
        vector_new.size = this.size;
        vector_new.buffer = this.buffer;
        vector_new.type = this.type;
        return vector_new;
    }
    async add(vector_out) {
        const new_vector = this.copy();
        const shaderCode = `
        @group(0) @binding(0) var<storage, read> a:array<f32>;
@group(0) @binding(1) var<storage, read> b:array<f32>;
@group(0) @binding(2) var<storage, read_write> result:array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id:vec3<u32>) {
    let index = global_id.x;
    if (index < ${this.size} && index < ${vector_out.size}) {
        result[index] = a[index] + b[index];
    }
}
        `
        // 创建结果缓冲区
        const resultBuffer = device.createBuffer({
            size: this.buffer.size,
            usage: GPUBufferUsage.COPY_SRC |
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_DST ,
        });
        const pipeline = device.createComputePipeline({
            layout:"auto",
            compute: {
                module: device.createShaderModule({ code: shaderCode }),
                entryPoint: 'main',
            },
        });

        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.buffer } },
                { binding: 1, resource: { buffer: vector_out.buffer } },
                { binding: 2, resource: { buffer: resultBuffer } }, // 结果缓冲区
            ],
        });

        const commandEncoder = device.createCommandEncoder();
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(1); // 根据线程数调整
        pass.end();
        await device.queue.submit([commandEncoder.finish()]);

        new_vector.buffer = resultBuffer;
        return new_vector;
    }
    async getData(){
        const returnBuffer = device.createBuffer({
            size: this.buffer.size,
            usage: GPUBufferUsage.COPY_DST |
            GPUBufferUsage.MAP_READ,
        });
        const encoder = device.createCommandEncoder();
        encoder.copyBufferToBuffer(this.buffer, 0, returnBuffer, 0, returnBuffer.size);
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
        await returnBuffer.mapAsync(GPUMapMode.READ);
        const result = new Float32Array(returnBuffer.getMappedRange());
        return result;
    }
};

export class tensor {
    constructor(data, type) {
        const result =  getMatrixDimensions(data);
        this.type = type;
        this.dimensions = result;
        const linear_arr = data.flat(Infinity);
        const typedArray = new Float32Array(linear_arr);
        console.log(typedArray.byteLength);
        this.buffer = device.createBuffer({
            size:typedArray.byteLength,
            usage: GPUBufferUsage.COPY_SRC |
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(this.buffer, 0, typedArray);
    }
}
function getMatrixDimensions(arr) {
    const dimensions = [];

    function helper(innerArr) {
        dimensions.push(innerArr.length);
        if (Array.isArray(innerArr) && innerArr.length > 0) {
            // 确保递归检查所有子数组的长度
            for (const item of innerArr) {
                if (Array.isArray(item)) {
                    helper(item);
                    break; // 一旦进入下一级就停止
                }
            }
        }
    }

    helper(arr);
    return dimensions; // 返回维度信息
}
export async function init() {
    const adapter = await navigator.gpu?.requestAdapter();
    device = await adapter?.requestDevice();
    return;
}

let device = undefined;