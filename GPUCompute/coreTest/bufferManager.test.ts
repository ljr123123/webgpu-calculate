import { device } from "./device";
import { VirtualBuffer, VirtualData } from "./virtualBuffer.test";

export class BufferManager {
    device: GPUDevice;
    linkManagers: LinkManager[] = [];
    constructor(device: GPUDevice) {
        this.device = device;
    }
    malloc(byteLength: number, usage: GPUBufferUsageFlags, virtual?: VirtualData): {block:BufferBlock, buffer:GPUBuffer} {
        const alignment =
            usage & GPUBufferUsage.STORAGE ? device.limits.minStorageBufferOffsetAlignment :
                usage & GPUBufferUsage.UNIFORM ? device.limits.minUniformBufferOffsetAlignment :
                    256;
        for (let manager of this.linkManagers) {
            if ((usage & manager.usage) === manager.usage) {
                const is_malloc = manager.malloc(alignment, byteLength, virtual);
                if (is_malloc) return is_malloc;
            }
        }
        const mallocByteLength = BufferManager.byteLengthTo2Times(alignment, byteLength);
        const newManager = new LinkManager(mallocByteLength, usage);
        this.linkManagers.push(newManager);
        const is_malloc = newManager.malloc(alignment, byteLength, virtual);
        if (!is_malloc) throw new Error("memory not enough.");
        else return is_malloc;
    }
    free(block: BufferBlock) {
        block.used = false;
        let prevBlock = block.prevBlock;
        while (prevBlock && !prevBlock.used) {
            prevBlock.size += block.size;
            prevBlock.nextBlock = block.nextBlock;
            if (block.nextBlock) {
                block.nextBlock.prevBlock = prevBlock;
            }
            block = prevBlock;
            prevBlock = block.prevBlock;
        }
        let nextBlock = block.nextBlock;
        while (nextBlock && !nextBlock.used) {
            block.size += nextBlock.size;
            block.nextBlock = nextBlock.nextBlock;
            if (nextBlock.nextBlock) {
                nextBlock.nextBlock.prevBlock = block;
            }
            nextBlock = block.nextBlock;
        }
    }

    static byteLengthTo2Times(alignment:number, byteLength: number) {
        const blockTimes = Math.ceil(Math.log2(byteLength));
        const mallocByteLength = Math.pow(2, blockTimes);
        return Math.max(alignment, mallocByteLength);
    }

    getMallocByteLength() {
        let sum = 0;
        this.linkManagers.forEach(manager => {
            sum += manager.buffer.size;
        });
        return sum;
    }

    getUsedByteLength() {
        let sum = 0;
        this.linkManagers.forEach(manager => {
            sum += manager.getUsedByteLength();
        });
        return sum;
    }
}

export interface BufferBlock {
    offset: number;
    size: number;
    used: boolean;
    nextBlock?: BufferBlock;
    prevBlock?: BufferBlock;
}

class LinkManager {
    VirtualBuffers: Set<VirtualData> = new Set();
    buffer: GPUBuffer;
    usage: GPUBufferUsageFlags;
    firstBlock: BufferBlock;
    constructor(byteLength: number, usage: GPUBufferUsageFlags) {
        this.buffer = device.createBuffer({
            size: byteLength,
            usage: usage
        });
        this.usage = usage;
        this.firstBlock = {
            offset: 0,
            size: byteLength,
            used: false
        }
    }
    getUsedByteLength():number {
        let sum = 0;
        let tempBlock:undefined | BufferBlock = this.firstBlock;
        while(tempBlock) {
            if(tempBlock.used) sum += tempBlock.size;
            tempBlock = tempBlock.nextBlock;
        }
        return sum;
    }
    malloc(alignment:number, byteLength: number, virtual?: VirtualData): {block:BufferBlock, buffer:GPUBuffer} | undefined {
        if (virtual) {
            for (let [conflict] of virtual.conflictData.entries()) {
                if (this.VirtualBuffers.has(conflict)) return undefined;
            }
        }
        const needOffset = Math.ceil(byteLength / alignment) * alignment;
        let tempBlock: BufferBlock | undefined = this.firstBlock;
        let firstFit: BufferBlock | undefined;
        while (tempBlock) {
            if(!tempBlock.used && needOffset <= tempBlock.size) {
                firstFit = tempBlock;
                break;
            }
            tempBlock = tempBlock.nextBlock;
        }
        if (firstFit) {
            const lastByteLength = firstFit.size - needOffset;
            if (lastByteLength !== 0) {
                const newBlock: BufferBlock = {
                    offset: firstFit.offset + needOffset,
                    size: lastByteLength,
                    used: false,
                    nextBlock: firstFit.nextBlock,
                    prevBlock: firstFit
                }
                firstFit.nextBlock = newBlock;
                firstFit.size = byteLength;
            }
            firstFit.used = true;
            return {
                block:firstFit,
                buffer:this.buffer
            };

        }
        else return undefined;
    }
}