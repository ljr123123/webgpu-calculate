import { VirtualBuffer } from "../virtualBuffer";

export interface BufferBindingLayout extends GPUBufferBindingLayout {
    type: GPUBufferBindingType;
    hasDynamicOffset: boolean;
    minBindingSize: GPUSize64;
}

export interface BindGroupLayoutEntry extends GPUBindGroupLayoutEntry {
    binding: number;
    buffer?: BufferBindingLayout;
}

export interface BufferBinding extends GPUBufferBinding {
    buffer:GPUBuffer;
    size:number;
    offset:number;
}

export interface BufferWithLayoutEntry {
    virtual:VirtualBuffer;
    layoutEntry:BindGroupLayoutEntry;
}
