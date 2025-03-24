import { device } from "./device";

interface BufferBlock {
    nextBlock?: BufferBlock;
    lastBlock?: BufferBlock;
    offset: number;
    size: number;
    used: boolean;
}

const MIN_BLOCK_SIZE = 256; // 最小内存块对齐要求（WebGPU uniform buffer要求256字节对齐）

export class LinearBufferManager {
    buffer: GPUBuffer;
    firstBlock: BufferBlock;
    private alignedSize: number;

    constructor(byteLength: number, usage: GPUBufferUsageFlags) {
        // 向上对齐到设备要求的最小块大小
        this.alignedSize = Math.ceil(byteLength / MIN_BLOCK_SIZE) * MIN_BLOCK_SIZE;
        
        this.buffer = device.createBuffer({
            size: this.alignedSize,
            usage: usage | GPUBufferUsage.COPY_DST,
            mappedAtCreation: false
        });
        
        this.firstBlock = {
            offset: 0,
            size: this.alignedSize,
            used: false,
        };
    }

    // 分配内存块（最佳适应算法）
    acquire(byteLength: number): BufferBlock | null {
        let bestFit: BufferBlock | null = null;
        let currentBlock: BufferBlock | undefined = this.firstBlock;
        const alignedSize = Math.ceil(byteLength / MIN_BLOCK_SIZE) * MIN_BLOCK_SIZE;

        // 遍历寻找最佳适应块
        while (currentBlock) {
            if (!currentBlock.used && currentBlock.size >= alignedSize) {
                if (!bestFit || currentBlock.size < bestFit.size) {
                    bestFit = currentBlock;
                }
            }
            currentBlock = currentBlock.nextBlock;
        }

        if (!bestFit) return null;

        // 分割内存块
        if (bestFit.size > alignedSize) {
            const newBlock: BufferBlock = {
                offset: bestFit.offset + alignedSize,
                size: bestFit.size - alignedSize,
                used: false,
                lastBlock: bestFit,
                nextBlock: bestFit.nextBlock
            };

            if (bestFit.nextBlock) {
                bestFit.nextBlock.lastBlock = newBlock;
            }
            bestFit.nextBlock = newBlock;
            bestFit.size = alignedSize;
        }

        bestFit.used = true;
        return bestFit;
    }

    // 释放内存块并合并相邻空闲块
    release(block: BufferBlock) {
        block.used = false;

        // 合并后续空闲块
        if (block.nextBlock && !block.nextBlock.used) {
            block.size += block.nextBlock.size;
            block.nextBlock = block.nextBlock.nextBlock;
            if (block.nextBlock) {
                block.nextBlock.lastBlock = block;
            }
        }

        // 合并前驱空闲块
        if (block.lastBlock && !block.lastBlock.used) {
            block.lastBlock.size += block.size;
            block.lastBlock.nextBlock = block.nextBlock;
            if (block.nextBlock) {
                block.nextBlock.lastBlock = block.lastBlock;
            }
        }
    }
}
export class BufferPool {
    bufferUsageMap: Map<GPUBufferUsageFlags, LinearBufferManager[]>;
    private defaultChunkSize: number;
    private thresholdSize: number;

    constructor() {
        this.bufferUsageMap = new Map();
        this.defaultChunkSize = 10 * 1024 * 1024; // 默认10MB分块[1](@ref)
        this.thresholdSize = 10 * 1024 * 1024; // 10MB阈值
    }

    malloc(usage: GPUBufferUsageFlags, byteLength: number): { buffer: GPUBuffer; offset: number } {
        const managers = this.bufferUsageMap.get(usage) || [];
        const alignedSize = Math.ceil(byteLength / MIN_BLOCK_SIZE) * MIN_BLOCK_SIZE;

        // 动态调整分块策略
        const chunkSize = byteLength > this.thresholdSize ? 
            Math.max(alignedSize * 2, this.thresholdSize) :  // 超过阈值时按需扩展[3](@ref)
            this.defaultChunkSize;

        // 尝试现有内存管理器分配
        for (const manager of managers) {
            const block = manager.acquire(alignedSize);
            if (block) {
                return { buffer: manager.buffer, offset: block.offset };
            }
        }

        // 创建新内存管理器
        const newManager = new LinearBufferManager(
            chunkSize, 
            usage
        );
        managers.push(newManager);
        this.bufferUsageMap.set(usage, managers);
        
        const block = newManager.acquire(alignedSize);
        if (!block) throw new Error("Failed to allocate buffer");
        
        return { buffer: newManager.buffer, offset: block.offset };
    }
}