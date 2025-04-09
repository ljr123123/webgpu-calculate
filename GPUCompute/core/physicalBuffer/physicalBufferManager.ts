import { VirtualBuffer } from "../virtualBuffer";
import { BufferBlock, LinkManager } from "./linkManager";

export class PhysicalBufferManager {
    device: GPUDevice;
    linkManagers: LinkManager[] = [];
    constructor(device: GPUDevice) {
        this.device = device;
    }
    malloc(buffer:VirtualBuffer, byteLength: number, usage: GPUBufferUsageFlags):{block:BufferBlock, manager:LinkManager} {
        const alignment =
            usage & GPUBufferUsage.STORAGE ? this.device.limits.minStorageBufferOffsetAlignment :
                usage & GPUBufferUsage.UNIFORM ? this.device.limits.minUniformBufferOffsetAlignment :
                    256;
        for (let manager of this.linkManagers) {
            if ((usage & manager.usage) === manager.usage) {
                const is_malloc = manager.malloc(alignment, byteLength, buffer.conflictBuffers);
                if (is_malloc) return is_malloc;
            }
        }
        const mallocByteLength = PhysicalBufferManager.byteLengthTo2Times(alignment, byteLength);
        const newManager = new LinkManager(this.device, mallocByteLength, usage);
        this.linkManagers.push(newManager);
        const is_malloc = newManager.malloc(alignment, byteLength, buffer.conflictBuffers);
        if (!is_malloc) throw new Error("memory not enough.");
        else return is_malloc;
    }
    /**
     * 
     * @param complete "true" means free all buffers of this manager;"false" means free buffers which mallocCount === freeCount.
     */
    dispose(complete?:boolean) {
        for(let i = this.linkManagers.length; i >= 0; i--) {
            const dispose = this.linkManagers[i].dispose(complete);
            if(dispose) this.linkManagers.splice(i, 1);
        }
    }

    static byteLengthTo2Times(alignment:number, byteLength: number) {
        const blockTimes = Math.ceil(Math.log2(byteLength));
        const mallocByteLength = Math.pow(2, blockTimes);
        return Math.max(alignment, mallocByteLength);
    }

    getMallocByteLength() {
        let sum = 0;
        this.linkManagers.forEach(manager => {
            sum += manager.getMallocByteLength();
        });
        return sum;
    }

    getUsedByteLength() {
        let sum = 0;
        this.linkManagers.forEach(manager => {
            sum += manager.getUsedByteLength();
        });
        return sum;
    }
}