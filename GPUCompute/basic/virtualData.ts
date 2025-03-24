import { device } from "./device";
import { WGSLType } from "./type";

export interface VirtualData {
    label:string; // 应用在WGSL代码中的变量名称
    byteLength:number; // 数据的字节长度
    type:WGSLType;
    gpuBufferBinding?:GPUBufferBinding;
    lifeStart:number;
    lifeEnd:number;
}

export interface ResourceOnBindGroup {
    virtual:VirtualData;
    binding:number;
    bindingLayout:GPUBufferBindingLayout;
}

export interface VirtualBindGroup {
    resources:ResourceOnBindGroup[];
    bindGroup?:GPUBindGroup;
    bindGroupLayout?:GPUBindGroupLayout;
}

export function bufferMalloc(byteLength:number, usage:GPUBufferUsageFlags) {
    return device.createBuffer({
        size:byteLength,
        usage:usage
    });
} 