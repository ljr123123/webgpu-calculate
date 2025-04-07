import { BufferManager, BufferBlock } from "./bufferManager.test";
import { device } from "./device";
import { GlobalDeviceGroup } from "./global";
import { BufferBinding, Type, WGSLType } from "./type";

export class VirtualData {
    label: string;
    virtualBuffer: VirtualBuffer;
    type: WGSLType;
    conflictData: Set<VirtualData> = new Set();
    usage: GPUBufferUsageFlags;
    dataFromCPU: number[] = [];
    constructor(label: string, type: WGSLType, manager: VirtualBufferManager, usage: GPUBufferUsageFlags) {
        this.type = type;
        const byteLength = Type.getByteLength(type);
        this.virtualBuffer = new VirtualBuffer(byteLength, manager);
        this.label = label;
        this.usage = usage
    }
    malloc() {
        this.virtualBuffer.malloc(this.usage);
    }
    getSourceBinding() {
        return this.virtualBuffer.binding;
    }
    free() {
        this.virtualBuffer.free();
    }
    write(data: number[]): void {
        const binding = this.getSourceBinding();
        if (!binding) throw new Error("not malloc.");
        const arrayBuffer = new Float32Array(data);
        device.queue.writeBuffer(binding.buffer, binding.offset, arrayBuffer);
    }
    async read(): Promise<Float32Array> {
        const binding = this.getSourceBinding();
        if (!binding) throw new Error("....not malloc.");
        const returnBuffer = createVirtualData("return", this.type, GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ);
        returnBuffer.malloc();
        const returnBinding = returnBuffer.getSourceBinding();
        if (!returnBinding) throw new Error("I will fix later.");
        const encoder = device.createCommandEncoder();
        encoder.copyBufferToBuffer(binding.buffer, binding.offset, returnBinding.buffer, returnBinding.offset, this.virtualBuffer.byteLength);
        device.queue.submit([encoder.finish()]);
        await device.queue.onSubmittedWorkDone();
        await returnBinding.buffer.mapAsync(GPUMapMode.READ, returnBinding.offset, returnBinding.size);
        const arrayBuffer = returnBinding.buffer.getMappedRange();
        return new Float32Array(arrayBuffer);
    }
    addConflict(virtual: VirtualData) {
        this.conflictData.add(virtual);
    }
}

export class VirtualBuffer {
    virtualBufferManager: VirtualBufferManager;
    binding?: BufferBinding;
    block?: BufferBlock
    byteLength: number;
    usage: GPUBufferUsageFlags = 0;
    constructor(byteLength: number, manager: VirtualBufferManager) {
        this.byteLength = byteLength;
        this.virtualBufferManager = manager;
    }
    malloc(usage: GPUBufferUsageFlags, virtualData?: VirtualData) {
        const mallocResult = this.virtualBufferManager.malloc(this.byteLength, usage, virtualData);
        this.block = mallocResult.block;
        this.binding = {
            buffer: mallocResult.buffer,
            offset: mallocResult.block.offset,
            size: mallocResult.block.size
        }
    }
    free() {
        if (!this.block) throw new Error("...");
        this.virtualBufferManager.bufferManager.free(this.block);
    }
    async copy() { }
    async moveTo(aimBuffer: VirtualBuffer) { }
    async changeUsage(usage: GPUBufferUsageFlags) { }
}

export class VirtualBufferManager {
    bufferManager: BufferManager;
    constructor(manager: BufferManager) {
        this.bufferManager = manager;
    }
    malloc(byteLength: number, usage: GPUBufferUsageFlags, virtualData?: VirtualData) {
        return this.bufferManager.malloc(byteLength, usage, virtualData);
    }
}

export function createVirtualData(label: string, type: WGSLType, usage: GPUBufferUsageFlags) {
    return new VirtualData(label, type, GlobalDeviceGroup.virtualBufferManager, usage);
}