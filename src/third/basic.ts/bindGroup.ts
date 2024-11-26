import { device, deviceLimits } from "./device";

interface BindGroupLayoutParams {
    key:number;
    bindGroupEntries:Iterable<GPUBindGroupLayoutEntry>
}

interface BindGroupCompose {
    key:number;
    bindGroupLayout:[]
}

class BindGroupController {
    bindGroupLayouts:Map<number, GPUBindGroupLayout>;
    bindGroups:GPUBindGroup[];
    maxBindGroup:number
    constructor(maxBindGroup:number) {
        this.bindGroupLayouts = new Map();
        this.bindGroups = [];
        this.maxBindGroup = maxBindGroup;
    }
    bindGroupLayout({key, bindGroupEntries}:BindGroupLayoutParams):GPUBindGroupLayout {
        if(this.bindGroupLayouts.has(key)) return this.bindGroupLayouts.get(key)!;
        if(bindGroupEntries == undefined) throw new Error("bindGroupEntries not set!!! ");
                const bindGroupLayouts = device.createBindGroupLayout({
            entries:bindGroupEntries
        })
        this.bindGroupLayouts.set(key, bindGroupLayouts)
        return computePipeline;
    }
}