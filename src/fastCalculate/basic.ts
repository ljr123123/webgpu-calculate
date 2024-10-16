let device: GPUDevice;

async function init(): Promise<void> {
    const adapter = await navigator.gpu.requestAdapter();
    if(adapter == null) return;
    device = await adapter.requestDevice();
}

await init(); // 等待初始化完成

export { device };

export async function stop() {
    await device.queue.onSubmittedWorkDone();
}
