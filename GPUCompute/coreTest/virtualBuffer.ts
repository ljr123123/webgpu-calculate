// import { BufferBlock, BufferManager } from "./bufferManager";
// import { DeviceGroup } from "./global";
// import { ComputeOrder } from "./order";
// import { Type, WGSLType } from "./type";


// export interface BufferBindingLayout extends GPUBufferBindingLayout {
//   type: GPUBufferBindingType;
//   hasDynamicOffset: boolean;
//   minBindingSize: GPUSize64;
// }

// export interface BindGroupLayoutEntry extends GPUBindGroupLayoutEntry {
//     binding:number;
//     buffer?:BufferBindingLayout;
// }

// export function createData(type:WGSLType) {
//     return new VirtualData(type, DeviceGroup.virtualBufferManager);
// }

// export class VirtualData {
//     binding?:BufferBlock;
//     virtualBuffer:VirtualBuffer;
//     WGSLType:WGSLType;
//     usage:GPUBufferUsageFlags = 0;
//     readonly conflictData:Set<VirtualData> = new Set();
//     constructor(WGSLType:WGSLType, manager:VirtualBufferManager) {
//         const byteLength = Type.getByteLength(WGSLType);
//         this.virtualBuffer = new VirtualBuffer(byteLength, manager);
//         this.WGSLType = WGSLType;
//     }
//     malloc(usage:GPUBufferUsageFlags) {
//         this.binding = this.virtualBuffer.malloc(usage);
//         this.usage = usage;
//     }
//     free() {
//         this.virtualBuffer.free();
//     }
//     async read() {}
// }

// export class VirtualBuffer {
//     binding?:BufferBlock;
//     byteLength:number;
//     manager:VirtualBufferManager;
//     static allocNumber = 0;
//     selfNumber: number;
//     constructor(byteLength:number, manager:VirtualBufferManager) {
//         this.selfNumber = VirtualBuffer.allocNumber++;
//         this.manager = manager;
//         this.byteLength = byteLength;
//     }
//     malloc(usage:GPUBufferUsageFlags) {
//         return this.manager.malloc(this, usage);
//     }
//     free() {
//         this.manager.free(this);
//     }
// }

// export class VirtualBufferManager {
//     bufferManager:BufferManager;
//     constructor(device: GPUDevice) {
//         this.bufferManager = new BufferManager(device);
//     }
//     solveComputeOrder(order: ComputeOrder) {
//         const map = order.virtualResources;
//         for(let [selfVirtual, selfLayout] of map.entries()) {
//             for(let [virtual, layout] of map.entries()) {
//                 if(selfVirtual === virtual) continue;
//                 if(selfLayout.buffer && layout.buffer) {
//                     if(selfLayout.buffer.type === layout.buffer.type) continue;
//                 }
//                 selfVirtual.conflictData.add(virtual);
//             }
//         }
//     }
//     malloc(virtual:VirtualBuffer, usage:GPUBufferUsageFlags):BufferBlock {
//         return this.bufferManager.malloc(virtual.byteLength, usage, virtual);
//     }
//     free(virtual:VirtualBuffer) {
//         if(!virtual.binding) throw new Error("....");
//         this.bufferManager.free(virtual.binding);
//     }
// }