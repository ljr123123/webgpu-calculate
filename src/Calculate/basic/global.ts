async function init(): Promise<void> {
    adapter = await navigator.gpu.requestAdapter();
    if (adapter == null) return;
    device = await adapter.requestDevice();
    deviceLimits = device.limits;
    console.log(deviceLimits)
}
let device: GPUDevice;
let deviceLimits:GPUSupportedLimits;
let adapter: GPUAdapter | null;
await init(); // 等待初始化完成
export { device, deviceLimits, adapter }

