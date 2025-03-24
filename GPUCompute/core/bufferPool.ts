interface GPUBufferBinding {
    buffer:GPUBuffer;
    offset:number;
    size:number;
    block:BufferBlock;
}

interface BufferBlock {
    nextBlock?:BufferBlock;
    prevBlock?:BufferBlock;
    offset:number;
    size:number;
    used:boolean;
}

export class GPUBufferManager {
    buffer:GPUBuffer;
    firstBlock:BufferBlock;
    constructor(device:GPUDevice, byteLength:number, usage:GPUBufferUsageFlags) {
        this.buffer = device.createBuffer({
            size:byteLength,
            usage:usage
        });
        this.firstBlock = {
            offset:0,
            size:byteLength,
            used:false
        };
    }
    acquire(byteLength:number):BufferBlock{}
    release(block:BufferBlock):void {}
}

export class BufferPool {
    buffersMap:Map<GPUBufferUsageFlags, GPUBufferManager[]> = new Map();
    device:GPUDevice;
    StorageOffsetAlignment:number;
    UniformOffsetAlignment:number;
    constructor(device:GPUDevice) {
        this.device = device;
        this.StorageOffsetAlignment = device.limits.minStorageBufferOffsetAlignment;
        this.UniformOffsetAlignment = device.limits.minUniformBufferOffsetAlignment;
    }
    acquire(byteLength:number, usage:GPUBufferUsageFlags):GPUBufferBinding {}
    release(binding:GPUBufferBinding):void {}
    destroy():void {}
}