import { ShortDataType, LongDataType, typeTrans, BinaryArray } from "./type";
import { device } from "./global";
import { globalController } from "./GlobalController";
export class GPUBufferWrapper {
    selfGPUBuffer: GPUBuffer;
    dataType: ShortDataType;
    size:number;
    byteSize:number;

    constructor(size: number, type: LongDataType) {
        this.selfGPUBuffer = device.createBuffer({
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE,
            size: size * 4
        });
        this.size = size;
        this.byteSize = size * 4;
        this.dataType = typeTrans.LongToShort(type);
    }

    // 写入JS原始数据
    writeOrigin(originData: number[], begin:number = 0) {
        const reset_origin_data = new Float32Array(originData);
        device.queue.writeBuffer(this.selfGPUBuffer, begin, reset_origin_data);
    }

    // 写入二进制数组数据
    writeBinary(binaryData: BinaryArray, begin:number = 0) {
        device.queue.writeBuffer(this.selfGPUBuffer, begin * 4, binaryData);
    }

    // 缓存区重定义
    resize(size: number, type: LongDataType) {
        this.selfGPUBuffer = device.createBuffer({
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE,
            size: size * 4
        });
        this.size = size;
        this.byteSize = size * 4;
        this.dataType = typeTrans.LongToShort(type);
    }

    // 从缓存区读取数据
    async read() {
        await globalController.solve();
        const returnBuffer = device.createBuffer({
            size: this.selfGPUBuffer.size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        const encoder = device.createCommandEncoder();
        encoder.copyBufferToBuffer(this.selfGPUBuffer, 0, returnBuffer, 0, returnBuffer.size);
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
        await returnBuffer.mapAsync(GPUMapMode.READ);
        let result: BinaryArray = typeTrans.ShortToArray(returnBuffer.getMappedRange(), this.dataType);
        return result;
    }

    // 重定义类型
    astype(type: LongDataType) {
        let oldDataType = this.dataType;
        this.dataType = typeTrans.LongToShort(type);

        const new_buffer = device.createBuffer({
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE,
            size: this.selfGPUBuffer.size
        });

        globalController.submit({
            module: `
            @group(0) @binding(0) var<storage, read_write> a:array<${oldDataType}>;
            @group(0) @binding(1) var<storage, read_write> b:array<${this.dataType}>;

            @compute @workgroup_size(1)
            fn main(@builtin(global_invocation_id) globalId: vec3<u32>){
                let index = globalId.x;
                if(index < ${this.selfGPUBuffer.size / 4}) {
                    b[index] = ${this.dataType}(a[index]);
                }
            }
            `,
            entries: [
                { binding: 0, buffer: this.selfGPUBuffer },
                { binding: 1, buffer: new_buffer }
            ],
            workGroupSize: Math.ceil(this.selfGPUBuffer.size / 4)
        });
        this.selfGPUBuffer = new_buffer;

    }
}