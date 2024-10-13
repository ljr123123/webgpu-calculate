import { device } from "../basic";
import { GPUQueue } from "../basic";

export class Tensor {
    dtype: string | undefined;
    shape: number[];
    buffer: GPUBuffer;
    size:number;

    constructor(data: any[] | undefined, dtype: "int8" | "unit8" | "int16" | "uint16" | "int32" | "uint32" | "float32" | "float64" | "bigint64" | "biguint64" | undefined) {
        if(data == undefined) {
            this.buffer = device.createBuffer({
                size:0,
                usage:GPUBufferUsage.COPY_DST
            });
            this.shape = [];
            this.dtype = "none";
            this.size = 0;
            return;
        }
        this.dtype = dtype;
        this.shape = getMatrixDimensions(data);
        const linearArr = flattenArray(data);
        this.size = linearArr.length;
        let typedArray: any;
        if (this.dtype === "int8") {
            typedArray = new Int8Array(linearArr);
        } else if (this.dtype === "uint8") {
            typedArray = new Uint8Array(linearArr);
        } else if (this.dtype === "int16") {
            typedArray = new Int16Array(linearArr);
        } else if (this.dtype === "uint16") {
            typedArray = new Uint16Array(linearArr);
        } else if (this.dtype === "int32") {
            typedArray = new Int32Array(linearArr);
        } else if (this.dtype === "uint32") {
            typedArray = new Uint32Array(linearArr);
        } else if (this.dtype === "float32") {
            typedArray = new Float32Array(linearArr);
        } else if (this.dtype === "float64") {
            typedArray = new Float64Array(linearArr);
        }
        this.buffer = device.createBuffer({
            size: typedArray.byteLength,
            usage: GPUBufferUsage.COPY_SRC |
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this.buffer, 0, typedArray);
    }

    async getData(): Promise<any> {
        await GPUQueue.resolvePromise();
        const returnBuffer = device.createBuffer({
            size: this.buffer.size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        const encoder = device.createCommandEncoder();
        encoder.copyBufferToBuffer(this.buffer, 0, returnBuffer, 0, returnBuffer.size);
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        await returnBuffer.mapAsync(GPUMapMode.READ);
        let result:any;
        if (this.dtype === "float32") {
            result = new Float32Array(returnBuffer.getMappedRange());
        } else if (this.dtype === "int8") {
            result = new Int8Array(returnBuffer.getMappedRange());
        } else if (this.dtype === "uint8") {
            result = new Uint8Array(returnBuffer.getMappedRange());
        } else if (this.dtype === "int16") {
            result = new Int16Array(returnBuffer.getMappedRange());
        } else if (this.dtype === "uint16") {
            result = new Uint16Array(returnBuffer.getMappedRange());
        } else if (this.dtype === "int32") {
            result = new Int32Array(returnBuffer.getMappedRange());
        } else if (this.dtype === "uint32") {
            result = new Uint32Array(returnBuffer.getMappedRange());
        } else if (this.dtype === "float64") {
            result = new Float64Array(returnBuffer.getMappedRange());
        }
        return reshapeArray([...result], this.shape);

    }
}
function reshapeArray<T>(arr: T[], dimensions: number[]): any[] {
    if (dimensions.length === 1) {
        // 如果只有一个维度，直接返回一维数组
        return arr as any;
    }

    const size = dimensions[0];
    const result: any[] = [];
    const remainingDimensions = dimensions.slice(1);
    for (let i = 0; i < size; i++) {
        const start = i * (arr.length / dimensions[0]);
        const end = start + (arr.length / dimensions[0]);
        result.push(reshapeArray(arr.slice(start, end), remainingDimensions));
    }

    return result as any;
}
function flattenArray(arr: any[]): number[] {
    return arr.reduce((acc: number[], val: any) => {
        if (Array.isArray(val)) {
            acc.push(...flattenArray(val)); // 递归调用
        } else {
            acc.push(val); // 添加基本元素
        }
        return acc;
    }, []);
}
function getMatrixDimensions(arr: any[]): number[] {
    const dimensions: number[] = [];

    function helper(innerArr: any[]) {
        dimensions.push(innerArr.length);
        if (Array.isArray(innerArr) && innerArr.length > 0) {
            for (const item of innerArr) {
                if (Array.isArray(item)) {
                    helper(item);
                    break;
                }
            }
        }
    }

    helper(arr);
    return dimensions;
}
