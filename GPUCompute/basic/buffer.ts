import { device } from "./device";
import { LongNumberType } from "./type";

interface BufferWrapperDescriptor {
    size:number; // 每最小段的内存长度，即GPUBuffer的长度
    shape:number[]; // 张量的形状
    piece:number; // 即shape中的每个元素相乘
    type:LongNumberType;
}

export class BufferWrapper {
    private buffer:GPUBuffer[];
    public shape:number[];
    constructor({size, shape, piece}:BufferWrapperDescriptor) {
        this.buffer = [];
        this.shape = shape;
        for(let i = 0; i < piece; i++) {
            this.buffer.push(device.createBuffer({
                size:size,
                usage:GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE
            }));
        }
    }
    public bufferWrapper(indexs: number[]): GPUBuffer {
        // 假设 indexs 表示多维数组中的坐标，shape 表示每个维度的大小
        
        let index = 0;
        let stride = 1;  // 每个维度的跨度，开始时设为 1
    
        // 从最后一个维度开始，逐个计算每个维度的索引
        for (let i = indexs.length - 1; i >= 0; i--) {
            // 累加每个维度的偏移量，stride 乘以当前维度的大小
            index += indexs[i] * stride;
            stride *= this.shape[i];  // 更新当前维度的跨度
        }
        return this.buffer[index];  // 返回计算得到的线性索引
    }
    public fill(number:number):void {
        const origin = new Float32Array(this.shape[0]).fill(number);
        this.buffer.forEach(element => {
            device.queue.writeBuffer(element, 0, origin);
        });
    }

    public write(numbers:number[]):void {
        // 展平到二维
        numbers = numbers.flat(this.shape.length - 2);

        for(let i = 0; i < numbers.length; i++) {
            let new_origin = new Float32Array(numbers[i]);
            device.queue.writeBuffer(this.buffer[i], 0, new_origin);
        }
    }
}