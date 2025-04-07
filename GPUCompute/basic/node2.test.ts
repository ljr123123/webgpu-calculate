import { BindGroupCompose, ResourceOnBindGroup, VirtualBindGroup, VirtualBindGroupMalloc, VirtualData } from "./GE2";
import { WGSLCompile, WGSLOptions } from "./WGSLCompile";
import { device } from "./device";
import { WGSLToJS } from "./type";

class SequenceNode {
    nextNode?: BranchNode | ComputeNode | DataTransNode;
    prevNode?: BranchNode | ComputeNode | DataTransNode;
    collector: BindGroupCollector;
    constructor(collector: BindGroupCollector, prev?: BranchNode | ComputeNode | DataTransNode, next?: BranchNode | ComputeNode | DataTransNode) {
        this.nextNode = next;
        this.prevNode = prev;
        this.collector = collector;
    }
}

interface ComputeNodeDescriptor {
    prev?: BranchNode | ComputeNode | DataTransNode;
    next?: BranchNode | ComputeNode | DataTransNode;
    options: WGSLOptions;
}

export class ComputeNode extends SequenceNode {
    computeOptions: WGSLOptions;
    bindGroupCollector: BindGroupCollector;
    pipeline?: GPUComputePipeline;
    constructor(descriptor: ComputeNodeDescriptor, collector: BindGroupCollector) {
        super(collector, descriptor.prev, descriptor.next);
        this.computeOptions = descriptor.options;
        this.bindGroupCollector = collector
    }
    async pipelineCompile(bindGroupLayout: GPUBindGroupLayout): Promise<GPUComputePipeline> {
        this.computeOptions.sources.forEach(source => {
            const resource = this.bindGroupCollector.virtualDataResourceMap.get(source.data);
            if(!resource) throw new Error("source's All layout not found.");
            source.binding = resource.binding;
        })
        console.log(this.computeOptions.sources);
        const shader = device.createShaderModule({
            code: WGSLCompile(this.computeOptions)
        });
        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });
        this.pipeline = await device.createComputePipelineAsync({
            layout: pipelineLayout,
            compute: {
                module: shader,
                entryPoint: this.computeOptions.entryPoint ? this.computeOptions.entryPoint : "main"
            }
        });
        return this.pipeline;
    }
    async GPUCommandBufferCompile(): Promise<GPUCommandBuffer> {
        if (!this.bindGroupCollector.virtualBindGroup.bindGroupCompose) throw new Error("GE Malloc not initialize.")
        if (!this.pipeline) this.pipeline = await this.pipelineCompile(this.bindGroupCollector.virtualBindGroup.bindGroupCompose.layout);
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass();
        pass.setBindGroup(0, this.bindGroupCollector.virtualBindGroup.bindGroupCompose.bindGroup);
        pass.setPipeline(this.pipeline);
        pass.dispatchWorkgroups(
            this.computeOptions.dispatchWorkGroups[0] ? this.computeOptions.dispatchWorkGroups[0] : 1,
            this.computeOptions.dispatchWorkGroups[1] ? this.computeOptions.dispatchWorkGroups[1] : 1,
            this.computeOptions.dispatchWorkGroups[2] ? this.computeOptions.dispatchWorkGroups[2] : 1,
        );
        pass.end();
        return encoder.finish();
    }
    async compile():Promise<GPUCommandBuffer> {
        return this.GPUCommandBufferCompile();
    }
    async run(commandBuffer: GPUCommandBuffer) {
        device.queue.submit([commandBuffer]);
    }
}

interface DataTransOptions {
    source: VirtualData;
    aim: VirtualData;
    copyByteLength:number;
}

interface DataTransNodeDescriptor {
    prev?: BranchNode | ComputeNode | DataTransNode;
    next?: BranchNode | ComputeNode | DataTransNode;
    options: DataTransOptions;
}

export class DataTransNode extends SequenceNode {
    transOptions: DataTransOptions;
    constructor(descriptor: DataTransNodeDescriptor, collector: BindGroupCollector) {
        super(collector, descriptor.prev, descriptor.next);
        this.transOptions = descriptor.options;
    }
    async GPUCommandBufferCompile(): Promise<GPUCommandBuffer> {
        const encoder = device.createCommandEncoder();
        if (!this.transOptions.source.bufferSource || !this.transOptions.aim.bufferSource) throw new Error("not GE malloc.")
        encoder.copyBufferToBuffer(
            this.transOptions.source.bufferSource.buffer,
            this.transOptions.source.bufferSource.offset ? this.transOptions.source.bufferSource.offset : 0,
            this.transOptions.aim.bufferSource.buffer,
            this.transOptions.aim.bufferSource.offset ? this.transOptions.aim.bufferSource.offset : 0,
            this.transOptions.copyByteLength
        );
        return encoder.finish();
    }
    async compile():Promise<GPUCommandBuffer> {
        return this.GPUCommandBufferCompile();
    }
    run(commandBuffer:GPUCommandBuffer) {
        device.queue.submit([commandBuffer]);
    }
}

interface BranchNodeDescriptor {
    checker: (...args: any[]) => Promise<boolean>,
    ifCollector: BindGroupCollector,
    elseCollector?: BindGroupCollector,
    prev?: BranchNode | ComputeNode | DataTransNode,
    next?: BranchNode | ComputeNode | DataTransNode
}

export class BranchNode extends SequenceNode {
    ifCollector: BindGroupCollector;
    elseCollector?: BindGroupCollector;
    checker: (...args: any[]) => Promise<boolean>
    constructor(descriptor: BranchNodeDescriptor, collector: BindGroupCollector) {
        super(collector, descriptor.prev, descriptor.next);
        this.ifCollector = descriptor.ifCollector;
        this.elseCollector = descriptor.elseCollector;
        this.checker = descriptor.checker;
    }
    async compile():Promise<void> {}
    async run():Promise<void> {
        const results = await this.checker();
        if(results) await this.collector.run();
        else {
            if(this.elseCollector) await this.elseCollector.run();
        }
    }
}

interface VirtualDataCompose {
    aim:any;
    source:VirtualData;
}

export class ReadNode extends SequenceNode {
    options:VirtualDataCompose[];
    resultBuffer?:GPUBuffer;
    constructor(aimOptions:VirtualDataCompose[], collector:BindGroupCollector) {
        super(collector)
        this.options = aimOptions;
    }
    encode() {

    }

    async read() {
        if(!this.resultBuffer) throw new Error("Read Buffer not set.");
        const buffer = this.resultBuffer;
        await buffer.mapAsync(GPUMapMode.READ);
        this.options.forEach(option => {
            if(!option.source.bufferSource) throw new Error("source not set.");
            const arrayBuffer = buffer.getMappedRange(option.source.bufferSource.offset, option.source.bufferSource.size);
            option.aim = WGSLToJS(arrayBuffer, option.source.type);
        });
        buffer.unmap();
    }
}

export class BindGroupCollector {
    encode:(...args:any[]) => void;
    
    globalLifeLength: number;
    virtualDataLayoutMap: Map<VirtualData, GPUBufferBindingLayout[]>;
    virtualDataResourceMap: Map<VirtualData, ResourceOnBindGroup>;
    compileNodes: Array<ComputeNode | DataTransNode>;
    firstNode?: BranchNode | ComputeNode | DataTransNode;
    lastNode?: BranchNode | ComputeNode | DataTransNode;
    virtualBindGroup: VirtualBindGroup;
    constructor(encode:(...args:any[]) => void) {
        this.encode = encode;
        this.virtualBindGroup = {
            vectors: []
        }
        this.compileNodes = [];
        this.virtualDataLayoutMap = new Map();
        this.virtualDataResourceMap = new Map();
        this.globalLifeLength = 0;
    }
    concatNode(node: BranchNode | ComputeNode | DataTransNode) {
        if (!this.firstNode || !this.lastNode) {
            this.firstNode = node;
            this.lastNode = node;
        }
        else {
            this.lastNode.nextNode = node;
            node.prevNode = this.lastNode;
            this.lastNode = node;
        }
        this.globalLifeLength += 1;
    }
    setFirstNode(node: BranchNode | ComputeNode | DataTransNode) {
        this.firstNode = node;
    }
    addComputeNode(node: ComputeNode) {
        this.concatNode(node);
        this.compileNodes.push(node);
        node.computeOptions.sources.forEach(source => {
            const data = source.data;
            const layouts = this.virtualDataLayoutMap.get(data);
            if(layouts) {
                layouts.push(source.bufferLayout);
                data.lifeEnd = this.globalLifeLength;
            }
            else {
                this.virtualDataLayoutMap.set(data, [source.bufferLayout]);
                data.lifeStart = this.globalLifeLength;
                data.lifeEnd = this.globalLifeLength;
            }
        });
        // console.log("...")
    };
    addDataTransNode(node: DataTransNode) {
        this.concatNode(node);
        this.compileNodes.push(node);
        const aim = node.transOptions.aim;
        const source = node.transOptions.source;
        source.lifeEnd = this.globalLifeLength;
        aim.lifeEnd = this.globalLifeLength;
    };
    addBranchNode(node: BranchNode) {
        this.concatNode(node);
    }
    setVirtualBindGroup() {
        // console.log("aaa")
        this.virtualBindGroup.vectors = [...this.virtualDataLayoutMap].map(([data, layouts]) => {
            const endLayout = getGPUBufferBindingLayout(layouts);
            const resource = {
                bufferLayout:endLayout,
                data
            }
            this.virtualDataResourceMap.set(data, resource);
            return resource;
        });
        this.virtualBindGroup.bindGroupCompose = VirtualBindGroupMalloc(this.virtualBindGroup);
        console.log(this.virtualBindGroup.vectors);
    }
    compile() {
        this.encode();
        this.setVirtualBindGroup();
        let tempNode:BranchNode | ComputeNode | DataTransNode | undefined = this.firstNode;
        const compilePromises = [];
        while(tempNode) {
            compilePromises.push({
                node:tempNode,
                compilePromise:tempNode.compile()
            });
            tempNode = tempNode.nextNode;
            console.log(tempNode);
        }
        return compilePromises;
    }
    async run() {
        const compilePromises = this.compile();
        for(let i = 0; i < compilePromises.length; i++) {
            const commandBuffer = await compilePromises[i].compilePromise;
            console.log(commandBuffer);
            const node = compilePromises[i].node;
            if(node instanceof BranchNode) await node.run();
            else if(commandBuffer) node.run(commandBuffer);
        }
    }
}

function getGPUBufferBindingLayout(bufferBindingLayouts: GPUBufferBindingLayout[]) {
    const layout: GPUBufferBindingLayout = {
        type: "read-only-storage", // 初始设为最低优先级
        hasDynamicOffset: false,
        minBindingSize: 0
    };

    let highestPriorityType: GPUBufferBindingType = "read-only-storage";
    
    for (const lay of bufferBindingLayouts) {
        // 类型优先级判断（参考网页1中资源绑定的布局规则）
        if (lay.type === "uniform") {
            highestPriorityType = "uniform";
        } else if (lay.type === "storage" && highestPriorityType !== "uniform") {
            highestPriorityType = "storage";
        } else if (lay.type === "read-only-storage" && highestPriorityType === "read-only-storage") {
            highestPriorityType = "read-only-storage";
        }

        // 属性合并逻辑（保持原正确逻辑）
        layout.hasDynamicOffset ||= lay.hasDynamicOffset || false;
        layout.minBindingSize = lay.minBindingSize 
            ? Math.max(lay.minBindingSize, <number>layout.minBindingSize)
            : layout.minBindingSize;
    }

    // 应用最终确定的最高优先级类型
    layout.type = highestPriorityType;
    
    console.log(layout);
    return layout;
}