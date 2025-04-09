import { BindGroupLayoutEntry, toWGSLVariableType } from "../type";
import { BufferWithLayoutEntry } from "../type/WebgpuType";
import { WGSLCompile, WGSLCompileOption } from "../WGSLOption/compile";

export class PipelineOrder {
    device:GPUDevice;
    virtualBuffers:Set<BufferWithLayoutEntry> = new Set();
    conflictSorted:boolean = false;
    static pipelinePool:Map<string, GPUComputePipeline> = new Map();

    bindGroup?:GPUBindGroup;

    WGSLCompileOption?: WGSLCompileOption;
    computePipeline?: GPUComputePipeline;

    renderPipeline?: GPURenderPipeline;
    constructor(device:GPUDevice) { 
        this.device = device;
    }
    setBufferLayoutWithEntry(virtualOperation:BufferWithLayoutEntry) {
        this.virtualBuffers.add(virtualOperation);
    }          
    solveConflictData() {
        if(this.conflictSorted) return;
        else this.conflictSorted = true;
        const set = this.virtualBuffers;
        for (let [selfOperation] of set.entries()) {
            for (let [operation] of set.entries()) {
                if (selfOperation.virtual === operation.virtual) continue;
                if (selfOperation.layoutEntry.buffer && operation.layoutEntry.buffer) {
                    if (selfOperation.layoutEntry.buffer.type === operation.layoutEntry.buffer.type) continue;
                }
                selfOperation.virtual.conflictBuffers.add(operation.virtual);
            }
        }
    }
    orderInit() {
        const entryGroup: BindGroupLayoutEntry[] = [];
        const bindingGroup: GPUBindGroupEntry[] = [];
        for (let [operation] of this.virtualBuffers.entries()) {
            entryGroup.push(operation.layoutEntry);
            const binding = operation.virtual.getBufferBinding();
            bindingGroup.push({
                binding: operation.layoutEntry.binding,
                resource: binding
            });
        }
        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: entryGroup
        });
        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });
        const bindGroup = this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: bindingGroup
        });
        return {
            pipelineLayout,
            bindGroup
        }
    }
    setOption(option:WGSLCompileOption) {
        this.WGSLCompileOption = option;
    }
    async computeInit(pipelineLayout: GPUPipelineLayout) {
        if(!this.WGSLCompileOption) throw new Error("WGSL option not set.");
        const WGSLString = WGSLCompile(this.WGSLCompileOption);
        const shader = this.device.createShaderModule({
            code: WGSLString
        });
        const pipeline = await this.device.createComputePipelineAsync({
            layout: pipelineLayout,
            compute: {
                module: shader,
                entryPoint: this.WGSLCompileOption.entryPoint ? this.WGSLCompileOption.entryPoint : "main"
            }
        });
        return pipeline;
    }
    async renderInit() { }

    getPipelinePoolKey(pipelineKey:string, options:WGSLCompileOption) {
        let key = `${pipelineKey}`;
        options.variables.forEach((variable) => {
            key += `-${toWGSLVariableType(variable.virtual.WGSLType)}`
        });
        return key;
    }
}