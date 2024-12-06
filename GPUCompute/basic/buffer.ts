import { device } from "./device";
import { BinaryArray, LongNumberType } from "./type";
import { reshape } from "../plugin/shape";

export interface GPUBufferWrapperDescriptor {
    data?:BinaryArray;
    type:LongNumberType;
    length:number;
}

export class GPUBufferWrapper {
    public buffer:GPUBuffer;
    public type:LongNumberType;
    public length:number;
    public byteLength:number;
    constructor({length, type, data}:GPUBufferWrapperDescriptor) {
        this.type = type;
        this.length = length;
        this.buffer = device.createBuffer({
            size:length * 4,
            usage:GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE
        });
        this.byteLength = this.buffer.size;
        if(data) this.write(data);
    }
    async read():Promise<BinaryArray> {
        const returnBuffer = device.createBuffer({
            size:this.byteLength,
            usage:GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        });
        const commandEncoder = device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(this.buffer, 0, returnBuffer, 0, this.byteLength);
        device.queue.submit([commandEncoder.finish()]);
        await returnBuffer.mapAsync(
            GPUMapMode.READ,
            0,
            this.byteLength
        );
        const copyArrayBuffer = returnBuffer.getMappedRange(0, this.byteLength);
        const data = copyArrayBuffer.slice(0);
        returnBuffer.unmap();
        return new Float32Array(data);
    }
    write(data:BinaryArray):void {
        device.queue.writeBuffer(this.buffer, 0, data);
    }
}

export interface GPUBufferGroupDescriptor {
    shape:number[];
    type:LongNumberType;
    data?:any[][];
}

export class GPUBufferGroup {
    shape:number[];
    bufferShape:number[];
    buffers:GPUBufferWrapper[];
    bufferLength:number;
    type:LongNumberType;
    constructor({shape, type, data}:GPUBufferGroupDescriptor) {
        this.shape = shape;
        this.type = type;
        this.bufferLength = shape[shape.length - 1];
        this.bufferShape = shape.slice(0, shape.length - 1);
        this.buffers = [];
        const piece = this.bufferShape.reduce((product, element) => product * element, 1);
        for(let i = 0; i < piece; i++) {
            const buffer = new GPUBufferWrapper({
                length:this.bufferLength,
                type:type
            });
            this.buffers.push(buffer);
        }
        if(data) this.write(data);
    }
    write(data:any[][]) {
        const linear = data.flat(this.shape.length - 2);
        for(let i = 0; i < this.buffers.length; i++) {
            const binary = new Float32Array(linear[i]);
            this.buffers[i].write(binary);
        }
    }
    async read():Promise<any> {
        const promiseBox = this.buffers.map(element => {
            return element.read();
        });
        const result = await Promise.all(promiseBox);
        return reshape(result, this.bufferShape);
    }
}