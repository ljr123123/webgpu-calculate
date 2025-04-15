import { BindGroupLayoutEntry, toWGSLVariableType, WGSLType } from "../type";
import { BufferWithLayoutEntry } from "../type/WebgpuType";
import { WGSLArray } from "../type/WGSLType";
import { VirtualBuffer } from "../virtualBuffer";
import { WGSLCompile, WGSLCompileOption } from "../WGSLOption/compile";

export function add(a:VirtualBuffer, b:VirtualBuffer):VirtualBuffer {
    const aSlot = {
        label:"A",
        availableType:[WGSLArray],
        readonly:true
    };
    const bSlot = {
        label:"B",
        availableType:[WGSLArray],
        readonly:true
    };
    const cSlot = {
        label:"C",
        availableType:[WGSLArray],
        readonly:false
    };
    const map:Map<OriginSlotOptions, CompileSlotOptions> = new Map();
    

}

interface OriginSlotOptions {
    [binding: number]: {
        label:string
        availableType:WGSLType[];
        readonly:boolean;
    };
}

interface CompileSlotOptions {
    group:number;
    [binding:number]:{
        label:string;
        virtualBuffer:VirtualBuffer;
        bindingType:GPUBufferBindingType;
    }
}


export class FunctionNode {
    computeGroupNodeMap: Map<string, ComputeGroupNode> = new Map();
    pipelineKey: string;

    device: GPUDevice;
    WGSLMain: string;
    slotOptions: OriginSlotOptions;
    constructor(device: GPUDevice, pipelineKey: string, slotOptions: OriginSlotOptions, WGSLMain: string,) {
        this.device = device;
        this.WGSLMain = WGSLMain;
        this.pipelineKey = pipelineKey;
        this.slotOptions = slotOptions;
    }
    setCompileSlotOptions(){}
    static getComputeGroupNodeMapKey(pipelineKey: string, bufferWithLayoutEntries: BufferWithLayoutEntry[]) {
        let key = pipelineKey;
        bufferWithLayoutEntries.sort((a, b) => { return a.layoutEntry.binding - b.layoutEntry.binding });
        bufferWithLayoutEntries.forEach((resource) => {
            if (!resource.layoutEntry.buffer) {
                console.log("this part will fix sooner.")
                throw new Error("only buffer allowed.");
            }
            key += `${resource.layoutEntry.buffer.type}-${toWGSLVariableType(resource.virtual.WGSLType)}`
        });
        return key;
    }
}
export class ComputeGroupNode {
    computeNodeMap: Map<string, ComputeNode> = new Map();
    promiseGPUComputePipelines: Map<string, Promise<GPUComputePipeline>> = new Map();
    GPUComputePipelines: Map<string, GPUComputePipeline> = new Map();
    shader: GPUShaderModule;

    BindGroupLayout: GPUBindGroupLayout;
    pipelineLayout: GPUPipelineLayout;
    device: GPUDevice;
    constructor(device: GPUDevice, functionNode:FunctionNode, ) {
        this.device = device;
        this.BindGroupLayout = device.createBindGroupLayout({ entries: variables.map(va => { return va.layoutEntry }) });
        this.pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [this.BindGroupLayout] });
        this.shader = device.createShaderModule({ code: WGSLCompile(WGSLCompileOption, variables) });
    }
    createComputePipeline(entryPoint: string) {
        const pipelinePromise = this.device.createComputePipelineAsync({
            layout: this.pipelineLayout,
            compute: {
                module: this.shader,
                entryPoint: entryPoint
            }
        });
        this.promiseGPUComputePipelines.set(entryPoint, pipelinePromise);
        pipelinePromise.then((pipeline) => {
            this.GPUComputePipelines.set(entryPoint, pipeline);
            this.promiseGPUComputePipelines.delete(entryPoint);
            return pipeline;
        });
        return pipelinePromise;
    }
    getComputePipeline(entryPoint: string): Promise<GPUComputePipeline> | GPUComputePipeline {
        const pipeline = this.GPUComputePipelines.get(entryPoint);
        if (pipeline) return pipeline;

        const pipelinePromise = this.promiseGPUComputePipelines.get(entryPoint);
        if (pipelinePromise) return pipelinePromise;

        return this.createComputePipeline(entryPoint);
    }
    createComputeNode(entryPoint: string, bufferWithLayoutEntries: BufferWithLayoutEntry[], dispatchWorkGroups: number[] | VirtualBuffer) {
        return new ComputeNode(
            this.device,
            this.BindGroupLayout,
            bufferWithLayoutEntries.map(b => {
                return {
                    binding: b.layoutEntry.binding,
                    resource: b.virtual.getBufferBinding()
                }
            }),
            entryPoint,
            this,
            dispatchWorkGroups
        )
    }
    static getComputeNodeMapKey(pipelineKey: string, virtualBuffers: VirtualBuffer[]) {
        let key = pipelineKey;
        virtualBuffers.sort((a, b) => { return a.label > b.label ? 1 : -1 });
        for (let buffer of virtualBuffers) {
            key += `-${buffer.label}`;
        }
        return key;
    }
}

export class ComputeNode {
    group: ComputeGroupNode;
    entryPoint: string;
    GPUBindGroup: GPUBindGroup;
    device: GPUDevice;
    dispatchWorkGroups: number[] | VirtualBuffer
    constructor(
        device: GPUDevice,
        bindGroupLayout: GPUBindGroupLayout,
        entries: GPUBindGroupEntry[],
        entryPoint: string,
        group: ComputeGroupNode,
        dispatchWorkGroups: number[] | VirtualBuffer
    ) {
        this.dispatchWorkGroups = dispatchWorkGroups;
        this.device = device;
        this.GPUBindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: entries
        });
        this.entryPoint = entryPoint;
        this.group = group;
    }
    async pipelineBindGroupDispatchWorkgroupsInit(
        dispatchWorkGroupsCaller?: (...args: any[]) => number[], ...args: any[]
    ): Promise<{
        pipeline: GPUComputePipeline,
        bindGroup: GPUBindGroup,
        dispatchWorkGroups: number[] | VirtualBuffer
    }> {
        const pipelinePromise = this.group.getComputePipeline(this.entryPoint);
        let pipeline: GPUComputePipeline;
        if (pipelinePromise instanceof Promise) pipeline = await pipelinePromise;
        else pipeline = pipelinePromise;
        if (dispatchWorkGroupsCaller) this.dispatchWorkGroups = dispatchWorkGroupsCaller(args);
        return {
            pipeline: pipeline,
            bindGroup: this.GPUBindGroup,
            dispatchWorkGroups: this.dispatchWorkGroups
        }
    }

}