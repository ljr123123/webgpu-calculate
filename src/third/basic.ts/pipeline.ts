import { device } from "./device";

interface GPUComputePipelineParams {
    key:number,
    bindGroupLayouts:GPUBindGroupLayout[] | undefined,
    code:string
}

class PipelineController {
    pipelineMap:Map<number, GPUComputePipeline>
    constructor() {
        this.pipelineMap = new Map();
    }
    pipeline({key,bindGroupLayouts,code}:GPUComputePipelineParams):GPUComputePipeline {
        if(this.pipelineMap.has(key)) return this.pipelineMap.get(key)!;
        if(bindGroupLayouts == undefined || code == undefined) throw new Error("bindGroupLayouts & code not set!!! ");
        
        const computePipeline = device.createComputePipeline({
            layout:device.createPipelineLayout({
                bindGroupLayouts:bindGroupLayouts
            }),
            compute: {
                module:device.createShaderModule({
                    code:code
                })
            }
        })
        this.pipelineMap.set(key, computePipeline)
        return computePipeline;
    }
};

export const pipelineController = new PipelineController();

