export async function init():Promise<void> {
    adapter = await navigator.gpu.requestAdapter();
    if(adapter == null) throw new Error("this browser doesn't support WebGPU.");
    device = await adapter.requestDevice();
}
let device:GPUDevice;
let adapter:GPUAdapter | null;
await init();
export {
    device,
    adapter
}