import { DeviceManager } from "./device";
import { OrderManager } from "./order/manager";
import { PipelineOrder } from "./order/singleOrder";
import { PhysicalBufferManager } from "./physicalBuffer";
import { getByteLength, WGSLType } from "./type";
import { BufferWithLayoutEntry } from "./type/WebgpuType";
import { VirtualBuffer, VirtualBufferManager } from "./virtualBuffer";
import { WGSLCompileOption } from "./WGSLOption/compile";

async function init() {
    const adapter = await navigator.gpu.requestAdapter();
    if(!adapter) throw new Error("WebGPU not supported.");
    device = await adapter.requestDevice();
    const resourceManager = new ResourceManager(device);
    return resourceManager;
}

class ResourceManager {
    physicalBufferManager:PhysicalBufferManager;
    virtualBufferManager:VirtualBufferManager;
    orderManager:OrderManager;
    constructor(device:GPUDevice) {
        this.physicalBufferManager = new PhysicalBufferManager(device);
        this.virtualBufferManager = new VirtualBufferManager(device);
        this.orderManager = new OrderManager(device);
    }
}

let device:GPUDevice;
let resourceManager = await init();


export function createVirtualBuffer(label:string, WGSLType:WGSLType) {
    const byteLength = getByteLength(WGSLType);

    return resourceManager.virtualBufferManager.createBuffer({
        label:label,
        WGSLType:WGSLType,
        byteLength:byteLength
    })
}

export function malloc(buffer:VirtualBuffer, usage:GPUBufferUsageFlags) {
    buffer.malloc(resourceManager.physicalBufferManager, usage);
}

export function sendPipelineOrder(label:string, option:WGSLCompileOption) {
    const pipelineOrder = new PipelineOrder(device);
    pipelineOrder.setOption(option);
    option.variables.forEach(variable => {
        pipelineOrder.setBufferLayoutWithEntry(variable);
    })
    resourceManager.orderManager.linearOrders.push(pipelineOrder);
}

export async function readBuffer(buffer:VirtualBuffer) {
    await buffer.read(device, resourceManager.physicalBufferManager);
}

export async function writeBuffer(buffer:VirtualBuffer, data:number[]) {
    buffer.write(device, data);
}

export async function solve(dispose?:boolean, ) {
    // dispose 表示在solve结束后，是否需要把所有缓存区清除;()
    // refresh 表示在solve结束后，是否需要把mallocCount === freeCount 的缓存区进行清除;(循环类代码可能需要)
    await resourceManager.orderManager.linearOrdersRun();
}