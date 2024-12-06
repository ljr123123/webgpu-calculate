import { GPUBufferGroup, GPUBufferWrapper } from "./buffer";
import { device } from "./device";

interface ComputeOrder {
    buffers: GPUBufferWrapper[];
    bindGroupLayout: GPUBindGroupLayout;
}

class ComputeWrapper {
    computeOrders: ComputeOrder[];
    pipeline:GPUComputePipeline;
    constructor(computeOrders: ComputeOrder[], pipeline: GPUComputePipeline) {
        this.computeOrders = computeOrders;
        this.pipeline = pipeline;
    }
    encode(): GPUCommandBuffer {
        const bindGroups = this.computeOrders.map(element => {
            return device.createBindGroup({
                layout: element.bindGroupLayout,
                entries: element.buffers.map((buffer, index) => {
                    return {
                        binding: index, resource: { buffer: buffer.buffer }
                    }
                })
            })
        });
        const commandEncoder = device.createCommandEncoder();
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(this.pipeline);
        bindGroups.forEach((element, index) => {
            pass.setBindGroup(index, element);
        });
        pass.end();
        return commandEncoder.finish();
    }
}