import { Order } from "./orderQueue";
import { WGSLType } from "./type";

export class VirtualData {
    static index = 0;

    WGSLType: WGSLType;
    byteLength: number;
    bindingLayouts:Map<Order, GPUBufferBindingLayout>;
    storageBinding?: GPUBufferBinding;

    readFromGPU: boolean;
    readBinding?: GPUBufferBinding;


    constructor(
        WGSLType: WGSLType,
        byteLength: number,
        readFromGPU: boolean = false) {
        this.WGSLType = WGSLType;
        this.byteLength = byteLength;
        this.readFromGPU = readFromGPU;
        this.bindingLayouts = new Map();
    }
    addBindingLayouts(order:Order, layout:GPUBufferBindingLayout) {
        this.bindingLayouts.set(order, layout);
    }
    getStorageBinding():GPUBufferBinding {
        if(!this.storageBinding) throw new Error("VirtualData's storageBinding not bind to any buffer.");
        return this.storageBinding;
    }
    getReadBinding():GPUBufferBinding {
        if(!this.readBinding) throw new Error("VirtualData's readBinding not bind to any buffer.");
        return this.readBinding;
    }
    async toGPU() {}
    async toCPU() {}
}
