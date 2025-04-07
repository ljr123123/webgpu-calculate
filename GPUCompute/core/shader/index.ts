import { VirtualData } from "../virtualData";

export interface VirtualDataWithLayout {
    binding:number;
    data:VirtualData;
    bindingLayout:GPUBufferBindingLayout;
}
export interface WGSLOptions {
    datas:VirtualDataWithLayout[];
    entryFunction: string;
    entryPoint?: string;
    workgroup_size: number[];
    local_id?: {
        label: string;
        range: number;
    };
    dispatchWorkGroups: number[];
    global_id?: {
        label: string;
        range: number;
    };
}

const ShaderPool = new Map<string, GPUShaderModule>();

export async function getShader(key:string):GPUShaderModule {

}