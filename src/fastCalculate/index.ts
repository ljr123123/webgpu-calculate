
export class Vector {
    size?: number;
    buffer?: GPUBuffer;
    type?: string;

    constructor(data?: Float32Array, dataType?: string) {
        if (data === undefined) {
            this.size = undefined;
            this.buffer = undefined;
            this.type = undefined;
        } else {
            this.size = data.length;
            this.buffer = device.createBuffer({
                size: data.byteLength,
                usage:
                    GPUBufferUsage.COPY_SRC |
                    GPUBufferUsage.STORAGE |
                    GPUBufferUsage.COPY_DST,
            });
            this.type = dataType;
            device.queue.writeBuffer(this.buffer, 0, data);
        }
    }

    copy(): Vector {
        const vectorNew = new Vector();
        vectorNew.size = this.size;
        vectorNew.buffer = this.buffer;
        vectorNew.type = this.type;
        return vectorNew;
    }

    async add(vectorOut: Vector): Promise<Vector> {
        const newVector = this.copy();
        const shaderCode = `
        @group(0) @binding(0) var<storage, read> a: array<f32>;
        @group(0) @binding(1) var<storage, read> b: array<f32>;
        @group(0) @binding(2) var<storage, read_write> result: array<f32>;

        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
            let index = globalId.x;
            if (index < ${this.size} && index < ${vectorOut.size}) {
                result[index] = a[index] + b[index];
            }
        }
        `;

        const resultBuffer = device.createBuffer({
            size: this.buffer.size,
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
                { binding: 0, resource: { buffer: this.buffer } },
                { binding: 1, resource: { buffer: vectorOut.buffer } },
                { binding: 2, resource: { buffer: resultBuffer } },
            ],
        });

        const commandEncoder = device.createCommandEncoder();
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(Math.ceil(this.size / 64)); // Adjust based on the number of threads
        pass.end();
        await device.queue.submit([commandEncoder.finish()]);

        newVector.buffer = resultBuffer;
        return newVector;
    }

    async getData(): Promise<Float32Array> {
        const returnBuffer = device.createBuffer({
            size: this.buffer.size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        const encoder = device.createCommandEncoder();
        encoder.copyBufferToBuffer(this.buffer, 0, returnBuffer, 0, returnBuffer.size);
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        await returnBuffer.mapAsync(GPUMapMode.READ);
        const result = new Float32Array(returnBuffer.getMappedRange());
        return result;
    }
}

export class Tensor {
    type: string;
    dimensions: number[];
    buffer: GPUBuffer;
    size: number

    constructor(data: any[] | undefined, type: string | undefined) {
        if(data == undefined) {
            this.type = undefined;
            this.dimensions = undefined;
            this.buffer = undefined;
            return;
        }
        this.type = type;
        this.dimensions = getMatrixDimensions(data);
        const linearArr = flattenArray(data);
        this.size = linearArr.length;
        const typedArray = new Float32Array(linearArr);
        
        this.buffer = device.createBuffer({
            size: typedArray.byteLength,
            usage: GPUBufferUsage.COPY_SRC |
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this.buffer, 0, typedArray);
    }
}

function flattenArray(arr: any[]): number[] {
    return arr.reduce((acc: number[], val: any) => {
        if (Array.isArray(val)) {
            acc.push(...flattenArray(val)); // 递归调用
        } else {
            acc.push(val); // 添加基本元素
        }
        return acc;
    }, []);
}
function getMatrixDimensions(arr: any[]): number[] {
    const dimensions: number[] = [];

    function helper(innerArr: any[]) {
        dimensions.push(innerArr.length);
        if (Array.isArray(innerArr) && innerArr.length > 0) {
            for (const item of innerArr) {
                if (Array.isArray(item)) {
                    helper(item);
                    break;
                }
            }
        }
    }

    helper(arr);
    return dimensions;
}

export async function init(): Promise<void> {
    const adapter = await navigator.gpu?.requestAdapter();
    device = await adapter?.requestDevice();
}

let device: GPUDevice | undefined = undefined;
