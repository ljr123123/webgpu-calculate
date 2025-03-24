export interface BufferLife {
    start: number;
    end: number;
    byteLength: number;
}

interface ByteLengthGroup {
    byteLength: number;
    elements: Array<BufferLife>;
    smallest_start: number;
    biggest_end: number;
}

interface MergedGroup {
    byteLength: number;
    start: number;
    end: number;
    subGroup: Array<MergedGroup>;
}

function mergedGroupsFind(byteLengthGroup: ByteLengthGroup, mergedGroup: MergedGroup): MergedGroup | undefined {
    if (byteLengthGroup.byteLength <= mergedGroup.byteLength &&
        ((byteLengthGroup.smallest_start < mergedGroup.start && byteLengthGroup.biggest_end < mergedGroup.start) ||
            (byteLengthGroup.smallest_start > mergedGroup.end && byteLengthGroup.biggest_end > mergedGroup.end)
        )
    ) return mergedGroup;
    for(let sub of mergedGroup.subGroup) {
        const result = mergedGroupsFind(byteLengthGroup, sub);
        if(result) return result;
    }
    return undefined;
}

type BufferType = "uniform" | "storage";

export function GEMalloc(lifeSet: Set<BufferLife>, bufferType: BufferType) {
    const sameByteLength: ByteLengthGroup[] = [];
    // 把缓存区大小一致的分为一组
    lifeSet.forEach(element => {
        const findResult = sameByteLength.some(group => {
            if (element.byteLength === group.byteLength) {
                group.elements.push(element);
                return true;
            }
            return false;
        });
        if (!findResult) {
            sameByteLength.push({
                byteLength: element.byteLength,
                elements: [element],
                smallest_start: 0,
                biggest_end: 0
            })
        }
    });
    // 把相同缓存区大小，同时生命周期不冲突的缓存区分为一组
    const unFoldGroups: ByteLengthGroup[] = [];
    sameByteLength.forEach(group => {
        group.elements.sort((a, b) => a.start - b.start); // 按start排序
        let subGroup: ByteLengthGroup = {
            byteLength: group.byteLength,
            elements: [],
            smallest_start: 0,
            biggest_end: 0
        };
        let endElement: BufferLife;
        while (group.elements.length !== 0) {
            if (subGroup.elements.length === 0) {
                endElement = group.elements[0];
                subGroup.elements.push(endElement);
                group.elements.splice(0, 1);
            }
            else {
                const index = group.elements.findIndex((element) => {
                    if (element.start > endElement.end) {
                        return true;
                    }
                });
                if (index === -1) {
                    unFoldGroups.push(subGroup);
                    subGroup = {
                        byteLength: group.byteLength,
                        elements: [],
                        smallest_start: 0,
                        biggest_end: 0
                    }
                }
                else {
                    endElement = group.elements[index];
                    subGroup.elements.push(group.elements[index]);
                    group.elements.splice(index, 1);
                }
            }

        }
        unFoldGroups.push(subGroup); // 处理最后一个subGroup
    });
    // 计算每个分组内部的最小生命开始时间，以及最大生命结束时间
    unFoldGroups.forEach(group => {
        group.smallest_start = Math.min(...group.elements.map(e => e.start));
        group.biggest_end = Math.max(...group.elements.map(e => e.end));
    });
    // 按照分组的缓存区大小进行分组
    unFoldGroups.sort((a, b) => { return b.byteLength - a.byteLength });
    const mergedGroups: MergedGroup[] = [];
    
    // 计算总内存占用
    let totalBytes = 0;
    mergedGroups.forEach(group => {
        totalBytes += group.byteLength
    });
    console.log(totalBytes)
}