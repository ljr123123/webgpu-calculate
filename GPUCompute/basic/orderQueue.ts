import { device } from "./device";
import { ResourceOnBindGroup } from "./GE2";
import { BindGroupCollector, BranchNode } from "./node2.test";
import { ArrayBufferSetJS } from "./type";
import { VirtualData } from "./virtualData";
import { WGSLOptions } from "./WGSLCompile";

class Order {
    collector:BindGroupCollector;
    nextOrder?:Order;
    prevOrder?:Order;
    constructor(collector:BindGroupCollector) {
        this.collector = collector;
    }
    encode(...args:any[]) {}
    async compile(...args:any[]) {}
    async run(...args:any[]) {}
}

class ParallelOrders {
    prevOrders?:ParallelOrders;
    nextOrders?:ParallelOrders;
    orders:CommandOrder[];
    constructor() {
        this.orders = [];
    }
}

class ComputeOrder extends Order {
    options: WGSLOptions;
    pipeline?: GPUComputePipeline;
    collector:BindGroupCollector;
    constructor(options:WGSLOptions, collector:BindGroupCollector) {
        super(collector);
        this.options = options;
        this.collector = collector;
    }
}

class MoveOrder extends Order {
    source:VirtualData;
    aim:VirtualData;
    constructor(source:VirtualData, aim:VirtualData ,collector:BindGroupCollector) {
        super(collector);
        this.source = source;
        this.aim = aim;
    }
    encode() {

    }
}

class WriteOrder extends Order {
    aim:VirtualData;
    data:ArrayBuffer;
    constructor(data:ArrayBuffer, aim:VirtualData, collector:BindGroupCollector) {
        super(collector);
        this.aim = aim;
        this.data = data;
    }
    encode() {
        this.collector.globalLifeLength += 1;
        if(this.aim.lifeStart === -1) {
            this.aim.lifeStart = this.collector.globalLifeLength;
            this.aim.lifeEnd = this.collector.globalLifeLength;
        }
        else {
            this.aim.lifeEnd = this.collector.globalLifeLength;
        }
    }
    async compile() {}
    async run() {
        if(!this.aim.gpuBufferBinding) throw new Error("aim's buffer not initialize.");
        const buffer = this.aim.gpuBufferBinding.buffer;
        const offset = this.aim.gpuBufferBinding.offset? this.aim.gpuBufferBinding.offset : 0;
        if(buffer.usage & GPUBufferUsage.UNIFORM) {
            device.queue.writeBuffer(buffer, offset, this.data);
        }
        else if(buffer.usage & GPUBufferUsage.MAP_WRITE){
            await buffer.mapAsync(GPUMapMode.WRITE);
            const arrayBuffer = buffer.getMappedRange();
            ArrayBufferSetJS(arrayBuffer, this.aim.type, this.data);
            buffer.unmap();
        }
        else throw new Error("UNIFORM OR MAP_WRITE NEEDED.")
    }
}

class ReadOrder extends Order {
    static returnBuffer?:GPUBuffer;
    readSource:VirtualData;
    storage?:ArrayBuffer;
    commandBuffer?:GPUCommandBuffer;
    constructor(collector:BindGroupCollector, readSource:VirtualData, storage?:ArrayBuffer) {
        super(collector);
        this.readSource = readSource;
        this.storage = storage;
    }
    encode() {
        this.collector.globalLifeLength += 1;
        if(this.readSource.lifeEnd === -1) {
            this.readSource.lifeEnd = this.readSource.lifeStart = this.collector.globalLifeLength;
        }
        else {
            this.readSource.lifeEnd = this.collector.globalLifeLength;
        }
    }
    async compile() {
        if(!this.readSource.gpuBufferBinding) throw new Error("source's buffer not initialize.");
        if(!ReadOrder.returnBuffer) throw new Error("ReadOrder's returnBuffer not initialize.");
        const binding = this.readSource.gpuBufferBinding;
        const size = binding.size? binding.size : 0;
        const offset = binding.offset? binding.offset : 0;
        if(binding.buffer.usage & GPUBufferUsage.COPY_SRC) {
            const encoder = device.createCommandEncoder();
            encoder.copyBufferToBuffer(binding.buffer, offset, ReadOrder.returnBuffer, 0, size);
            
        }
        else throw new Error("COPY_SRC NEEDED.")
    }
    async run() {
        if(!this.readSource.gpuBufferBinding) throw new Error("source's buffer not initialize.");
        if(!this.commandBuffer) throw new Error("compile not finished.");
        if(!ReadOrder.returnBuffer) throw new Error("ReadOrder's returnBuffer not initialize.");
        device.queue.submit([this.commandBuffer]);
        await device.queue.onSubmittedWorkDone();
        await ReadOrder.returnBuffer.mapAsync(GPUMapMode.READ, 0, this.readSource.gpuBufferBinding.size);
        const result = ReadOrder.returnBuffer.getMappedRange()
        if(this.storage) {
            this.storage = result;
        }
        else console.log(new Float32Array(result));
    }
}
class BranchOrder extends Order {

    constructor(collector:BindGroupCollector) {
        super(collector);
    }
    encode() {

    }
}

type CommandOrder = ComputeOrder | MoveOrder | WriteOrder | ReadOrder | BranchOrder;

type TypedArray = Float32Array | Int32Array | Uint32Array;

class BindGroupCollector {
    globalLifeLength:number;
    maxReturnBufferSize:number;
    parentCollector?:BindGroupCollector;
    gpuBufferMap:Map<GPUBufferUsageFlags, GPUBuffer>;
    orders:CommandOrder[];
    startParallel?:ParallelOrders;
    constructor() {
        this.gpuBufferMap = new Map();
        this.orders = [];
        this.globalLifeLength = 0;
        this.maxReturnBufferSize = 0;
    }
    move(source:VirtualData, aim:VirtualData) {}
    write(writeAim:VirtualData, data:ArrayBuffer) {}
    read(readSource:VirtualData, storage?:ArrayBuffer) {}
    compute() {}
    
    encode(...args:any[]):void {}
    compile() {}
    async run() {}
}