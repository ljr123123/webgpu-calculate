import { ComputeCompose } from "./type";
import { GPUBufferWrapper } from "./GPUBufferWrapper";
import { device, deviceLimits } from "./global";
class GlobalController {
    constructor() {}
    submit(compose: ComputeCompose) {
        const pipeline = device.createComputePipeline({
            layout: "auto",
            compute: {
                module: device.createShaderModule({ code: compose.module }),
                entryPoint: 'main',
            },
        });
        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: Array.from(compose.entries).map((entry, index) => {
                if(entry.buffer == undefined) throw new Error("")
                if (entry.buffer instanceof GPUBufferWrapper) {
                    return {
                        binding: entry.binding,
                        resource: { buffer: entry.buffer.selfGPUBuffer }
                    }
                }
                else return {
                    binding: entry.binding,
                    resource: { buffer: entry.buffer }
                }
            })
        });

        const commandEncoder = device.createCommandEncoder();
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        if(compose.workGroupSize == undefined) throw new Error("")
        pass.dispatchWorkgroups(compose.workGroupSize);
        pass.end();
        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);
    }
    async solve(): Promise<void> {
        await device.queue.onSubmittedWorkDone();
    }
}

class GPUBufferController {
    GPUBufferSet:Set<GPUBuffer[]>
    constructor() {
        this.GPUBufferSet = new Set();
    }
};

class BindGroupController {
    BindGroupSet:Set<GPUBindGroup>
    constructor() {
        this.BindGroupSet = new Set();
    }
};

class PipelineController {
    PipelineSet:Set<GPUComputePipelineDescriptor>
    constructor() {
        this.PipelineSet = new Set();
    }
};
/*
const device = await navigator.gpu.requestDevice();
const bindGroup1 = device.createBindGroup({});
const bindGroup1 = device.createBindGroup({});
const bindGroup1 = device.createBindGroup({});
const bindGroup1 = device.createBindGroup({});
const bindGroup1 = device.createBindGroup({});
*/
const maxBindGroups = deviceLimits.maxBindGroups;

/*
entries: [
        { binding: 0, resource: { buffer: buffer1 } },
        { binding: 1, resource: { buffer: buffer2 } },
        { binding: 2, resource: { buffer: buffer3 } },
        { binding: 3, resource: { buffer: buffer4 } },
        { binding: 4, resource: { buffer: buffer5 } },  // 超过了 maxBindingsPerBindGroup 的限制
    ]
*/
const maxBindingsPerBindGroup = deviceLimits.maxBindingsPerBindGroup;

/*
pass.dispatchWorkgroups(infinite)
*/
const maxComputeInvocationsPerWorkgroup = deviceLimits.maxComputeInvocationsPerWorkgroup;

/*
computePass.dispatchWorkgroups(workgroupSizeX, 1, 1);
*/
const maxComputeWorkgroupSizeX = deviceLimits.maxComputeWorkgroupSizeX;
const maxComputeWorkgroupSizeY = deviceLimits.maxComputeWorkgroupSizeY;
const maxComputeWorkgroupSizeZ = deviceLimits.maxComputeWorkgroupSizeZ;
/*
const buffer = device.createBuffer({
        size: workgroupStorageSize,
        usage: GPUBufferUsage.STORAGE,
    });

    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, bindGroup);
    computePass.dispatchWorkgroups(1, 1, 1);
    computePass.endPass();
*/
const maxComputeWorkgroupStorageSize = deviceLimits.maxComputeWorkgroupStorageSize;
const maxComputeWorkgroupsPerDimension = deviceLimits.maxComputeWorkgroupsPerDimension;

/*
const buffer = device.createBuffer({
    size: maxStorageBufferBindingSize + 1,  // 超过 maxStorageBufferBindingSize 的大小
    usage: GPUBufferUsage.STORAGE,
});
*/
const maxStorageBufferBindingSize = deviceLimits.maxStorageBufferBindingSize;

const gpuBufferController = new GPUBufferController();
const bindGroupController = new BindGroupController();
const pipelineController = new PipelineController();
const globalController = new GlobalController();

export { globalController };