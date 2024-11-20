let device: GPUDevice;
interface BindGroupCompose{
    bindGroup: {
        id:number,
        content:GPUBindGroup
    },
    pipeline: GPUComputePipeline,
    workGroupSize:number[]
}
interface ComputeCompose{
    
}
class GlobalController {
    ComputeQueue:BindGroupCompose[];
    constructor() {
        this.ComputeQueue = [];
    }
    async solve():Promise<boolean> {
        await device.queue.onSubmittedWorkDone();
        return true;
    }
};
let globalController = new GlobalController();



async function init(): Promise<void> {
    const adapter = await navigator.gpu.requestAdapter();
    if(adapter == null) return;
    device = await adapter.requestDevice();
}

await init(); // 等待初始化完成

export { device, globalController };

export async function stop() {
    await device.queue.onSubmittedWorkDone();
}
