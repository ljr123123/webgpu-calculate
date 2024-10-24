import { device } from "../basic";
export async function getDataFromBuffer(buffer:GPUBuffer, dtype:"f32" | "u32" | "i32") : Promise<any> {
    const returnBuffer = device.createBuffer({
        size: buffer.size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(buffer, 0, returnBuffer, 0, returnBuffer.size);
    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
    await device.queue.onSubmittedWorkDone();
    await returnBuffer.mapAsync(GPUMapMode.READ);
    let result: any;
    if (dtype === "f32") {
        result = new Float32Array(returnBuffer.getMappedRange());
    } else if(dtype === "i32"){
        result = new Int32Array(returnBuffer.getMappedRange());
    } else if (dtype === "u32") {
        result = new Uint32Array(returnBuffer.getMappedRange());
    } 
    return result;
}