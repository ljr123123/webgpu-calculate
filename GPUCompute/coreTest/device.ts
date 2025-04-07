let device:GPUDevice;
let adapter:GPUAdapter | null;

async function init() {
    adapter = await navigator.gpu.requestAdapter();
    if(!adapter) throw new Error("WebGPU not supported.");
    device = await adapter.requestDevice();
}

await init();

export {
    device,
    adapter
}