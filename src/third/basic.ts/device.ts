async function init(): Promise<void> {
    const adapter = await navigator.gpu.requestAdapter();
    if (adapter == null) throw new Error("This browser isn't supported WebGPU.");

    device = await adapter.requestDevice();
    deviceLimits = device.limits;
}
let device: GPUDevice;
let deviceLimits:GPUSupportedLimits;
await init(); // 等待初始化完成
export { device, deviceLimits }