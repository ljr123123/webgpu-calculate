class ComputeQueue{
    queue: GPUCommandBuffer[];
    constructor() {
        this.queue = [];
    }
    addCommand(commandBuffer:GPUCommandBuffer){
        this.queue.push(commandBuffer);
    }
    async resolvePromise() {
        device.queue.submit(this.queue);
        await device.queue.onSubmittedWorkDone();
    }
};
export const GPUQueue = new ComputeQueue();

let device: GPUDevice;

async function init(): Promise<void> {
    const adapter = await navigator.gpu.requestAdapter();
    if(adapter == null) return;
    device = await adapter.requestDevice();
}

await init(); // 等待初始化完成

export { device };
