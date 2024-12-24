import { GPUBufferGroup, GPUBufferWrapper } from "./buffer";
import { device } from "./device";

interface UniformEntry {
    buffer: GPUBufferWrapper;
    name: string;
}

interface StorageGroupEntry {
    bufferGroup: GPUBufferGroup;
    name: string;
}

interface ComputeGroupDescriptor {
    main: string;
    parallel: number;
    storageGroups: StorageGroupEntry[];
    uniformBuffers: UniformEntry[];
    setting: WGSLSetting;
}

interface BindGroupCompose {
    storage:GPUBindGroup;
    uniform:GPUBindGroup;
}

export class ComputeGroup {
    WGSL: GPUShaderModule;
    pipeline: GPUComputePipeline;
    UniformLayout: GPUBindGroupLayout;
    StorageLayout: GPUBindGroupLayout;
    bindGroup: BindGroupCompose[];
    setting:WGSLSetting;

    constructor({ parallel, setting }: ComputeGroupDescriptor) {
        this.setting = setting;
        this.WGSL = device.createShaderModule({ code: WGSLCompose(setting) });
        this.UniformLayout = device.createBindGroupLayout({
            entries: setting.STATIC.map((element, index) => { 
                return { binding: index, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } }; 
            })
        });
        this.StorageLayout = device.createBindGroupLayout({
            entries:setting.bufferGroups.map((element, index) => { 
                return { binding: index, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }; 
            })
        });
        this.pipeline = device.createComputePipeline({
            layout:device.createPipelineLayout({
                bindGroupLayouts:[this.UniformLayout, this.StorageLayout]
            }),
            compute:{
                module:this.WGSL,
                entryPoint:"main"
            }
        });
        this.bindGroup = [];
    }
    compose():void {}
    encode(X:number, Y:number, Z:number):GPUCommandBuffer[] {
        return this.bindGroup.map(element => {
            const commandEncoder = device.createCommandEncoder();
            const pass = commandEncoder.beginComputePass();
            pass.setBindGroup(0, element.uniform);
            pass.setBindGroup(1, element.uniform);
            pass.setPipeline(this.pipeline);
            pass.dispatchWorkgroups(X, Y, Z);
            pass.end();
            return commandEncoder.finish();
        })
    }
}

interface WGSLSetting {
    main: string;
    workgroup_size_X: number;
    workgroup_size_Y: number;
    workgroup_size_Z: number;
    global_id: boolean;
    local_id: boolean;
    bufferGroups: StorageGroupEntry[];
    STATIC: UniformEntry[];
}

export function WGSLCompose({ main, workgroup_size_X, workgroup_size_Y, workgroup_size_Z, global_id, local_id, bufferGroups, STATIC }: WGSLSetting): string {
    let WGSL = "";
    STATIC.forEach((element, index) => {
        WGSL = WGSL.concat(`@group(0) @binding(${index}) var<uniform, read> ${element.name}:array<${element.buffer.type}>;\n`)
    });
    bufferGroups.forEach((element, index) => {
        WGSL = WGSL.concat(`@group(1) @binding(${index}) var<storage, read_write> ${element.name}:array<${element.bufferGroup.type}>;\n`)
    });
    WGSL = WGSL.concat(`@compute @workgroup_size(${workgroup_size_X},${workgroup_size_Y},${workgroup_size_Z})\n fn main(${global_id ? '@builtin(global_invocation_id) globalId: vec3<u32>,' : ''}${local_id ? '@builtin(local_invocation_id) localId: vec3<u32>' : ''}){\n`);
    WGSL = WGSL.concat(main.concat("\n}\n"));
    return WGSL;
}