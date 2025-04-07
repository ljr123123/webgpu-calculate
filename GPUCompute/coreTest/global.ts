import { BufferManager } from "./bufferManager.test";
import { device } from "./device";
import { ComputeOrderManager } from "./order";
import { VirtualBufferManager } from "./virtualBuffer.test";

function createDeviceGroup(device:GPUDevice) {
    const bufferManager = new BufferManager(device);
    const virtualBufferManager = new VirtualBufferManager(bufferManager);
    const orderManager = new ComputeOrderManager();
    return {
        device:device,
        virtualBufferManager:virtualBufferManager,
        bufferManager:bufferManager,
        orderManager:orderManager
    }
}

export const GlobalDeviceGroup = createDeviceGroup(device);


