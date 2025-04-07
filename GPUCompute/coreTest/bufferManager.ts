// import { device } from "./device";
// import { VirtualBuffer, VirtualData } from "./virtualBuffer";

// export class BufferManager {
//     device: GPUDevice;
//     linkManagers: LinkManager[] = [];
//     constructor(device: GPUDevice) {
//         this.device = device;
//     }
//     malloc(byteLength: number, usage: GPUBufferUsageFlags, virtual?: VirtualData): BufferBlock {
//         for (let manager of this.linkManagers) {
//             if ((usage & manager.usage) === manager.usage) {
//                 const is_malloc = manager.malloc(byteLength, virtual);
//                 if (is_malloc) return is_malloc;
//             }
//         }
//         const mallocByteLength = this.byteLengthTo2Times(byteLength, usage);
//         const newManager = new LinkManager(mallocByteLength, usage);
//         this.linkManagers.push(newManager);
//         const is_malloc = newManager.malloc(byteLength, virtual);
//         if (!is_malloc) throw new Error("memory not enough.");
//         else return is_malloc;
//     }
//     free(block: BufferBlock) {
//         block.used = false;
//         let prevBlock = block.prevBlock;
//         while (prevBlock && !prevBlock.used) {
//             prevBlock.size += block.size;
//             prevBlock.nextBlock = block.nextBlock;
//             if (block.nextBlock) {
//                 block.nextBlock.prevBlock = prevBlock;
//             }
//             block = prevBlock;
//             prevBlock = block.prevBlock;
//         }
//         let nextBlock = block.nextBlock;
//         while (nextBlock && !nextBlock.used) {
//             block.size += nextBlock.size;
//             block.nextBlock = nextBlock.nextBlock;
//             if (nextBlock.nextBlock) {
//                 nextBlock.nextBlock.prevBlock = block;
//             }
//             nextBlock = block.nextBlock;
//         }
//     }

//     byteLengthTo2Times(byteLength: number, usage: GPUBufferUsageFlags) {
//         let alignment =
//             usage & GPUBufferUsage.STORAGE ? device.limits.minStorageBufferOffsetAlignment :
//                 usage & GPUBufferUsage.UNIFORM ? device.limits.minUniformBufferOffsetAlignment :
//                     1024;
//         const blockTimes = Math.ceil(Math.log2(byteLength));
//         const mallocByteLength = Math.pow(2, blockTimes);
//         return Math.max(alignment, mallocByteLength);
//     }
// }

// export interface BufferBlock {
//     offset: number;
//     size: number;
//     readonly buffer: GPUBuffer;
//     used: boolean;
//     nextBlock?: BufferBlock;
//     prevBlock?: BufferBlock;
// }

// class LinkManager {
//     VirtualBuffers: Set<VirtualData> = new Set();
//     buffer: GPUBuffer;
//     usage: GPUBufferUsageFlags;
//     firstBlock: BufferBlock;
//     constructor(byteLength: number, usage: GPUBufferUsageFlags) {
//         this.buffer = device.createBuffer({
//             size: byteLength,
//             usage: usage
//         });
//         this.usage = usage;
//         this.firstBlock = {
//             offset: 0,
//             size: byteLength,
//             used: false,
//             buffer: this.buffer
//         }
//     }
//     malloc(byteLength: number, virtual?: VirtualData): BufferBlock | undefined {
//         if (virtual) {
//             for (let [conflict] of virtual.conflictData.entries()) {
//                 if (this.VirtualBuffers.has(conflict)) return undefined;
//             }
//         }
//         let tempBlock: BufferBlock | undefined = this.firstBlock;
//         let bestFit: BufferBlock | undefined;
//         while (tempBlock) {
//             tempBlock = tempBlock.nextBlock;
//         }
//         if (bestFit) {

//             const lastByteLength = bestFit.size - byteLength;
//             if (lastByteLength !== 0) {
//                 const newBlock: BufferBlock = {
//                     offset: bestFit.offset + byteLength,
//                     size: bestFit.size - byteLength,
//                     used: false,
//                     buffer: this.buffer,
//                     nextBlock: bestFit.nextBlock,
//                     prevBlock: bestFit
//                 }
//                 bestFit.nextBlock = newBlock;
//                 bestFit.size = byteLength;
//             }
//             bestFit.used = true;
//             return bestFit;

//         }
//         else return undefined;
//     }
// }