import { device } from "./device";
import { WGSLType } from "./type";
import { VirtualData, virtualDataPool } from "./virtualData.test";

export interface ResourceOnBindGroup {
    data: VirtualData;
    binding?: number;
    bufferLayout: GPUBufferBindingLayout;
}

export interface VirtualBindGroup {
    vectors: ResourceOnBindGroup[];
    bindGroupCompose?: BindGroupCompose;
}

export interface BindGroupCompose {
    layout: GPUBindGroupLayout;
    bindGroup: GPUBindGroup;
}

export function VirtualBindGroupMalloc(VBGroup: VirtualBindGroup): BindGroupCompose {
    const vectorWithOutSource: ResourceOnBindGroup[] = [];
    VBGroup.vectors.forEach(v => {
        if (!v.data.bufferSource) vectorWithOutSource.push(v);
    });
    if (vectorWithOutSource.length !== 0) GEMalloc(vectorWithOutSource);
    const layout = device.createBindGroupLayout({
        entries: VBGroup.vectors.map((v, index) => {
            return {
                binding: index,
                buffer: v.bufferLayout,
                visibility: GPUShaderStage.COMPUTE
            }
        })
    });
    const bindGroup = device.createBindGroup({
        layout: layout,
        entries: VBGroup.vectors.map((v, index) => {
            v.binding = index;
            console.log("sortResult:", v);
            return {
                binding: index,
                resource: <GPUBufferBinding>v.data.bufferSource
            }
        })
    });
    return {
        layout: layout,
        bindGroup: bindGroup
    }
}

interface VirtualDataBlock {
    byteLength: number;
    subData: VirtualData[];
    lifeStart: number;
    lifeEnd: number;
    offset: number;
}

export function GEMalloc(vectors: ResourceOnBindGroup[]) {
    const results = firstLevelReuse(vectors, device.limits.minStorageBufferOffsetAlignment);
    const { memoryRegions, totalMemory, sortedBlocks } = secondLevelReuse(results);
    const buffer = device.createBuffer({
        size: totalMemory,
        usage: GPUBufferUsage.STORAGE
    });
    sortedBlocks.forEach(block => {
        block.subData.forEach(data => {
            data.setStorage({
                buffer:buffer,
                offset:block.offset,
                size:data.byteLength
            })
        });
    });
    return {
        memoryRegions:memoryRegions,
        totalMemory:totalMemory
    }
}

function firstLevelReuse(vectors: ResourceOnBindGroup[], alignment:number): VirtualDataBlock[] {
    // 第一阶段：按字节长度分组
    const sameByteLengthGroups: VirtualDataBlock[] = [];
    vectors.forEach(({ data }) => {
        const targetGroup = sameByteLengthGroups.find(g => g.byteLength === data.byteLength);
        if (targetGroup) {
            targetGroup.subData.push(data);
            // 动态更新生命周期范围（后续会重新计算）
            targetGroup.lifeStart = Math.min(targetGroup.lifeStart, data.lifeStart);
            targetGroup.lifeEnd = Math.max(targetGroup.lifeEnd, data.lifeEnd);
        } 
        else {
            sameByteLengthGroups.push({
                byteLength: data.byteLength,
                subData: [data],
                lifeStart: data.lifeStart,
                lifeEnd: data.lifeEnd,
                offset: 0
            });
        }
    });

    // console.log(sameByteLengthGroups);

    // 第二阶段：在每组内进行时间轴冲突检测
    const resultBlocks: VirtualDataBlock[] = [];

    sameByteLengthGroups.forEach(group => {
        // 按生命周期起点排序
        const sortedData = [...group.subData].sort((a, b) => a.lifeStart - b.lifeStart);
        // console.log(sortedData);

        let currentBlock: VirtualDataBlock | null = null;

        sortedData.forEach(data => {
            if (!currentBlock || data.lifeStart >= currentBlock.lifeEnd) {
                // console.log("...")
                // 创建新块
                currentBlock = {
                    byteLength: Math.ceil(group.byteLength / alignment) * alignment,
                    subData: [data],
                    lifeStart: data.lifeStart,
                    lifeEnd: data.lifeEnd,
                    offset: 0
                };
                resultBlocks.push(currentBlock);
            } else {
                // 合并到当前块
                currentBlock.subData.push(data);
                currentBlock.lifeEnd = Math.max(currentBlock.lifeEnd, data.lifeEnd);
            }
        });
    });

    // console.log(resultBlocks);

    // 第三阶段：按字节长度降序排列
    return resultBlocks.sort((a, b) => b.byteLength - a.byteLength);
}

function secondLevelReuse(sortedBlocks: VirtualDataBlock[]) {
    console.log(device.limits.minStorageBufferOffsetAlignment);

    // 内存区域数组，新增offset字段记录起始偏移量
    const memoryRegions: {
        byteLength: number;
        offset: number;       // 新增区域起始偏移量
        allocations: {
            start: number;
            lifeEnd: number;
            blockRef: VirtualDataBlock; // 新增块引用
        }[];
    }[] = [];

    let currentOffset = 0;    // 当前总内存偏移量计数器

    for (const block of sortedBlocks) {
        let allocated = false;

        // 尝试在现有区域分配
        for (const region of memoryRegions) {
            // 区域容量检查（包含=条件）
            if (region.byteLength >= block.byteLength) {
                // 冲突检测优化为时间段完全隔离判断
                const canAllocate = region.allocations.every(alloc =>
                    block.lifeEnd < alloc.start || block.lifeStart > alloc.lifeEnd
                );

                if (canAllocate) {
                    region.allocations.push({
                        start: block.lifeStart,
                        lifeEnd: block.lifeEnd,
                        blockRef: block  // 绑定块引用
                    });
                    // 设置块的偏移量为区域起始偏移量[2](@ref)
                    block.offset = region.offset;
                    allocated = true;
                    break;
                }
            }
        }

        // 新建内存区域逻辑
        if (!allocated) {
            memoryRegions.push({
                byteLength: block.byteLength,
                offset: currentOffset, // 记录新区域起始偏移
                allocations: [{
                    start: block.lifeStart,
                    lifeEnd: block.lifeEnd,
                    blockRef: block
                }]
            });
            // 设置块的偏移量并更新总偏移[2](@ref)
            block.offset = currentOffset;
            currentOffset += block.byteLength;
        }
    }

    // 计算最终内存占用（可直接用currentOffset）
    const totalMemory = memoryRegions.reduce((sum, r) => sum + r.byteLength, 0);

    return {
        memoryRegions: memoryRegions,
        totalMemory,
        sortedBlocks // 返回带偏移量信息的原始数组
    };
}