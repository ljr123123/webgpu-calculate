import { device } from "./device";
import { GlobalDeviceGroup } from "./global";
import { BufferManager } from "./tfBufferManager";
import { Type } from "./type";
import { VirtualData } from "./virtualBuffer.test";
function test() {
    // const usageFlags: GPUBufferUsageFlags[] = [
    //     GPUBufferUsage.STORAGE,
    //     GPUBufferUsage.COPY_DST,
    //     GPUBufferUsage.COPY_SRC,
    //     GPUBufferUsage.MAP_READ,
    //     GPUBufferUsage.MAP_WRITE,
    //     GPUBufferUsage.QUERY_RESOLVE,
    //     GPUBufferUsage.UNIFORM,
    //     GPUBufferUsage.INDIRECT
    // ];
    // const activeBuffers: VirtualData[] = []; // 用于跟踪未释放的实例
    // const activeTfBuffers: GPUBuffer[] = [];
    // const releaseProbability = 0.9; // 每次循环有30%概率释放一个旧buffer
    // const bufferManager = new BufferManager(device);
    // for (let i = 0; i < 1000; i++) {
    //     // 随机释放旧buffer（模拟真实场景）
    //     if (Math.random() < releaseProbability && activeBuffers.length > 0) {
    //         const targetIndex = Math.floor(Math.random() * activeBuffers.length);
    //         activeBuffers[targetIndex].free(); // 调用释放方法
    //         activeBuffers.splice(targetIndex, 1); // 从活跃列表移除
    //         bufferManager.releaseBuffer(activeTfBuffers[targetIndex]);
    //         activeTfBuffers.splice(targetIndex, 1);
    //     }

    //     // 申请新buffer（原逻辑）
    //     const length = Math.ceil((Math.random() + 10) * 1000) * 256;
    //     const type = Type.array(Type.float32, length);
        
    //     const selectedUsages = usageFlags
    //         .sort(() => Math.random() - 0.5)
    //         .slice(0, 1 + Math.floor(Math.random() * 2));
        
    //     const usage = selectedUsages.reduce((acc, cur) => acc | cur, 0);

    //     const virtualData = new VirtualData(
    //         type,
    //         GlobalDeviceGroup.virtualBufferManager,
    //         usage
    //     );

    //     activeBuffers.push(virtualData); // 记录新申请的实例
        
    //     const byteLength = Type.getByteLength(type);
    //     const buffer = bufferManager.acquireBuffer(byteLength, usage, false, true);
    //     activeTfBuffers.push(<GPUBuffer>buffer);
    // }
    // console.log("TF分配的内存:", bufferManager.numBytesAllocated);
    // console.log("TF使用的内存", bufferManager.numBytesUsed);
    // console.log("TF内存池的连接数:", bufferManager.numFreeBuffers + bufferManager.numUsedBuffers);
    // // // 最终释放所有剩余buffer（测试完全释放场景）
    // // activeBuffers.forEach(buffer => buffer.free());
    
    // // 输出内存状态
    // console.log("最终分配内存:", 
    //     GlobalDeviceGroup.bufferManager.getMallocByteLength());
    // console.log("最终使用内存:", 
    //     GlobalDeviceGroup.bufferManager.getUsedByteLength());
    // console.log("内存池链接数:", 
    //     GlobalDeviceGroup.bufferManager.linkManagers.length);
}
test();
export const a = undefined;