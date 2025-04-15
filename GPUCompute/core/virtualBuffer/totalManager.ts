import { VirtualBuffer, VirtualBufferDescriptor } from "./buffer";

export class VirtualBufferManager {
    device:GPUDevice;
    virtualBuffers:VirtualBuffer[] = [];
    bindGroupPool:Map<VirtualBuffer[], GPUBindGroup> = new Map();
    constructor(device:GPUDevice) {
        this.device = device;
    }
    createBuffer(descriptor:VirtualBufferDescriptor) {
        const buffer = new VirtualBuffer(descriptor);
        this.virtualBuffers.push(buffer);
        return buffer;
    }
}