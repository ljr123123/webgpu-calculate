import { device } from "./device";
import { WGSLType, Type, ArrayBufferSetJS } from "./type";

export class VirtualData {
    static index = 0; // index表示现在已经创建了多少个VirtualData
    protected read: boolean; // 该数据是否需要读取到CPU
    public readonly dataIndex: number; // 每个VirtualData的唯一标识
    protected readBinding?: GPUBufferBinding; // 读取缓冲区上的位置
    protected storageBinding?: GPUBufferBinding; // 存储缓冲区上的位置
    public byteLength: number; // 数据的字节长度
    protected WGSLType: WGSLType; // 数据存储在WGSL中的类型是什么
    protected bufferBasicType: "storage" | "uniform"; // 影响着数据的写入以及读取方式，还有内存复用方式
    protected bindingLayouts: Map<number, GPUBufferBindingLayout>; // 第几个节点要使用这块缓存区，以及使用这块缓存区的方式
    public lifeStart:number;
    public lifeEnd:number;
    constructor(WGSLType: WGSLType, bufferBasicType: "storage" | "uniform", read: boolean = false) {
        this.WGSLType = WGSLType;
        this.byteLength = Type.getByteLength(WGSLType);
        this.bindingLayouts = new Map();
        this.dataIndex = VirtualData.index++;
        this.bufferBasicType = bufferBasicType;
        this.read = read;
        this.lifeStart = this.lifeEnd = 0;
    }
    getBindingLayouts() {
        return this.bindingLayouts;
    }
    setRead(binding: GPUBufferBinding) {
        this.readBinding = binding;
    }
    setStorage(binding: GPUBufferBinding) {
        this.storageBinding = binding;
    }
    async toGPU(data: ArrayBuffer, dataOffset: number = 0, dataSize?: number): Promise<void> {
        if (!this.storageBinding) throw new Error(`VirtualData {${this.dataIndex}}'s Source's Buffer not init.`);
        if (!dataSize) dataSize = data.byteLength - dataOffset;
        const offset = this.storageBinding.offset ? this.storageBinding.offset : 0;
        const buffer = this.storageBinding.buffer;
        if (this.bufferBasicType === "uniform") {
            device.queue.writeBuffer(this.storageBinding.buffer, offset, data, dataOffset, dataSize);
        }
        else {
            if (buffer.mapState == "unmapped") await buffer.mapAsync(GPUMapMode.WRITE);
            const arrayBuffer = buffer.getMappedRange(offset, this.byteLength);
            ArrayBufferSetJS(arrayBuffer, this.WGSLType, data);
            buffer.unmap();
        }
    }
    async toCPU(): Promise<ArrayBuffer> {
        if (!this.storageBinding) throw new Error(`VirtualData {${this.dataIndex}}'s read's Buffer not init.`);
        const buffer = this.storageBinding.buffer;
        const offset = this.storageBinding.offset ? this.storageBinding.offset : 0;
        const reflectSize = this.storageBinding.size ? this.storageBinding.size : this.byteLength;
        await buffer.mapAsync(GPUMapMode.READ, offset, reflectSize);
        const arrayBuffer = buffer.getMappedRange();
        buffer.unmap();
        return arrayBuffer;
    }
}
class VirtualDataPool {
    virtualDataArray: Array<VirtualData>;
    conflicts: Map<string, boolean>;
    constructor() {
        this.virtualDataArray = [];
        this.conflicts = new Map();
    }
    getVirtualData(dataIndex:number) {
        return this.virtualDataArray[dataIndex];
    }
    isConflict(data1: VirtualData, data2: VirtualData):boolean{
        for (let [key, value] of data1.getBindingLayouts().entries()) {
            const result = data2.getBindingLayouts().get(key);
            if (result && result !== value) return true;
        }
        for (let [key, value] of data2.getBindingLayouts().entries()) {
            const result = data1.getBindingLayouts().get(key);
            if (result && result !== value) return true;
        }
        return false;
    }
    ConflictByLayoutEntryType(data: VirtualData[]): void {
        data.forEach(d => {
            [...d.getBindingLayouts()].forEach((value) => {
                if (value[1].type === undefined) value[1].type = "storage";
            });
        });
        for (let i = 0; i < data.length; i++) {
            for (let j = i + 1; j < data.length; j++) {
                const conflict = this.isConflict(data[i], data[j]);
                const minIndex = Math.min(data[i].dataIndex, data[j].dataIndex);
                const maxIndex = Math.max(data[i].dataIndex, data[j].dataIndex);
                this.conflicts.set(`${minIndex}-${maxIndex}`, conflict);
            }
        }
    }


}

export const virtualDataPool = new VirtualDataPool();

// 测试工具函数：快速创建 VirtualData
function createTestData(
    bindingEntries: [number, GPUBufferBindingLayout][],
    cpuData?: ArrayBuffer
): VirtualData {
    const data = new VirtualData(Type.float32, cpuData);
    bindingEntries.forEach(([key, value]) => data.bindingLayouts.set(key, value));
    return data;
}

// 测试用例数据
const testCases = {
    // 用例1: 相同时间点不同类型（应分到不同组）
    case1: [
        createTestData([
            [1, { type: "read-only-storage" }]
        ]),
        createTestData([
            [0, { type: "storage" }]
        ]),
    ],
}
// 运行测试
Object.entries(testCases).forEach(([caseName, data]) => {
    console.log(`Testing ${caseName}:`);
    const groups = ConflictByLayoutEntryType(data);
    console.log(groups);
    console.log("-------------------");
});
export const test = undefined;