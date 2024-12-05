import { BufferWrapper } from "./buffer";
import { device } from "./device";

interface ComputeGroupDescriptor {
    firstBuffer: BufferWrapper;
    secondBuffer: BufferWrapper;
    pipeline: GPUComputePipeline;
}

interface BindGroupCompose {
    layout: GPUBindGroupLayout;
    entries: Iterable<GPUBindGroupEntry>
}

export class ComputeGroup {
    private firstBuffer: BufferWrapper;
    private secondBuffer: BufferWrapper;
    private pipeline: GPUComputePipeline;
    constructor({ firstBuffer, secondBuffer, pipeline }: ComputeGroupDescriptor) {
        this.firstBuffer = firstBuffer;
        this.secondBuffer = secondBuffer;
        this.pipeline = pipeline;
    }
    encoding(indexs: number[], bindGroupLayouts: BindGroupCompose[]): GPUCommandBuffer {

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass();
        bindGroupLayouts.forEach((compose, index) => {
            const bindGroup = device.createBindGroup({ layout: compose.layout, entries: compose.entries })
            pass.setBindGroup(index, bindGroup);
        })
        pass.setPipeline(this.pipeline);
        pass.end();
        return encoder.finish();
    }
}