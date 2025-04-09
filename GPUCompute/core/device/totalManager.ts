export class DeviceManager {
    devices:GPUDevice[] = [];
    availableDevice?:GPUDevice;
    constructor() {
        
    }
    async requestDevice(
        adapterOptions?:GPURequestAdapterOptions,
        deviceDescriptor?:GPUDeviceDescriptor
    ) {
        const adapter = await navigator.gpu.requestAdapter(adapterOptions);
        if(!adapter) return this.availableDevice;
        const device = await adapter.requestDevice(deviceDescriptor);
        this.devices.push(device);
        this.availableDevice = device;
        return device;
    }
}