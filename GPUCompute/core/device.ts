let adapter:GPUAdapter | null;
let device:GPUDevice;

async function init() {
    adapter = await navigator.gpu.requestAdapter();
    if(!adapter) throw new Error("WebGPU not supported.");
    device = await adapter.requestDevice();
}
await init();
export {
    adapter,
    device
}