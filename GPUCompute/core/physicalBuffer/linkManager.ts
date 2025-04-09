import { VirtualBuffer } from "../virtualBuffer";

export interface BufferBlock {
    offset: number;
    size: number;
    used: boolean;
    nextBlock?: BufferBlock;
    prevBlock?: BufferBlock;
}

export class LinkManager {
    mallocCount: number = 0;
    freeCount: number = 0;
    usage: GPUBufferUsageFlags;

    conflictBuffer: Set<VirtualBuffer> = new Set();
    virtualBufferMap: Map<VirtualBuffer, BufferBlock> = new Map();

    buffer: GPUBuffer;
    firstBlock: BufferBlock;
    constructor(device: GPUDevice, byteLength: number, usage: GPUBufferUsageFlags) {
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
    malloc(alignment: number, byteLength: number, conflictBuffer: Set<VirtualBuffer>): { block: BufferBlock, manager: LinkManager } | undefined {
        this.mallocCount += 1;
        conflictBuffer.forEach(conflict => {
            if (this.conflictBuffer.has(conflict)) return undefined;
        })
        const needOffset = Math.ceil(byteLength / alignment) * alignment;
        let tempBlock: BufferBlock | undefined = this.firstBlock;
        let firstFit: BufferBlock | undefined;
        while (tempBlock) {
            if (!tempBlock.used && needOffset <= tempBlock.size) {
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
                block: firstFit,
                manager: this
            };

        }
        else return undefined;
    }
    free(block: BufferBlock): void {
        this.freeCount += 1;
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

    // used in PhysicalBufferManager 
    dispose(complete?:boolean): boolean {
        if (complete || this.freeCount === this.mallocCount) {
            this.buffer.destroy();
            return false;
        }
        else return true;
    }

    getMallocByteLength() {
        return this.buffer.size;
    }

    getUsedByteLength(): number {
        let sum = 0;
        let tempBlock: undefined | BufferBlock = this.firstBlock;
        while (tempBlock) {
            if (tempBlock.used) sum += tempBlock.size;
            tempBlock = tempBlock.nextBlock;
        }
        return sum;
    }
}