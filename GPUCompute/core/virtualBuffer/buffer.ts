import { BufferBlock, LinkManager, PhysicalBufferManager } from "../physicalBuffer";
import { BufferBinding, WGSLType } from "../type";

export interface VirtualBufferDescriptor {
    label?: string;
    byteLength: number;
    WGSLType: WGSLType;
}

export class VirtualBuffer {
    static bufferCount = 0;
    static countBase = 36;
    conflictBuffers: Set<VirtualBuffer> = new Set();
    byteLength: number;
    WGSLType: WGSLType;
    label: string;

    linkManager?: LinkManager;
    binding?: BufferBinding;
    block?: BufferBlock;


    constructor(descriptor: VirtualBufferDescriptor) {
        this.label = descriptor.label? descriptor.label : VirtualBuffer.bufferCount.toString(VirtualBuffer.countBase);
        this.byteLength = descriptor.byteLength;
        this.WGSLType = descriptor.WGSLType;
        VirtualBuffer.bufferCount += 1;
    }
    malloc(physicalBufferManager: PhysicalBufferManager, usage: GPUBufferUsageFlags) {
        const { block, manager } = physicalBufferManager.malloc(this, this.byteLength, usage);
        this.linkManager = manager;
        this.block = block;
        this.binding = {
            buffer: manager.buffer,
            size: block.size,
            offset: block.offset
        }
    }
    free() {
        if (!this.linkManager || !this.block) throw new Error("this buffer not malloc.");
        this.linkManager.free(this.block);
        this.block = undefined;
        this.binding = undefined;
        this.linkManager = undefined;
    }
    getBufferBinding() {
        const binding = this.binding;
        if (!binding) throw new Error("buffer not malloc.");
        return binding;
    }
    async read(device: GPUDevice, physicalBufferManager: PhysicalBufferManager) {
        const resultBuffer = new VirtualBuffer({ label: "resultBuffer", byteLength: this.byteLength, WGSLType: this.WGSLType });
        resultBuffer.malloc(physicalBufferManager, GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ);
        const resultBinding = resultBuffer.getBufferBinding();
        const selfBinding = this.getBufferBinding();
        const encoder = device.createCommandEncoder();
        encoder.copyBufferToBuffer(selfBinding.buffer, selfBinding.offset, resultBinding.buffer, resultBinding.offset, this.byteLength);
        device.queue.submit([encoder.finish()]);
        await device.queue.onSubmittedWorkDone();
        await resultBinding.buffer.mapAsync(GPUMapMode.READ);
        const arrayBuffer = resultBinding.buffer.getMappedRange();
        console.log(new Float32Array(arrayBuffer));
    }
    write(device:GPUDevice, data:number[]):void {
        const arrayBuffer = new Float32Array(data);
        const binding = this.getBufferBinding();
        device.queue.writeBuffer(binding.buffer, binding.offset, arrayBuffer);
    }
    copy() { }
    usageAs(usage: GPUBufferUsageFlags) { }
}