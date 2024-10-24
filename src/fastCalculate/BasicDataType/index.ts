import { device } from "../basic";

export class Tensor {
    dtype?: string;
    shape: number[];
    buffer?: GPUBuffer;
    size: number;

    constructor(data?: any[], shape?: number[]) {
        // if data is undefined, set Tensor is empty.
        if (!data) {
            this.setTensorWithoutData();
            return;
        }
        let convertData = convertArrayTypes(data);
        if (convertData instanceof Array) {
            this.shape = shape ? shape : getMatrixDimensions(convertData);
            convertData = flattenArray(data);
            const result = checkArrayTypes(convertData);
            if (result.includes("Integer")) {
                convertData = new Int32Array(convertData);
            }
            else if (result.includes("Float")) {
                convertData = new Float32Array(convertData);
            }
        }
        else {
            this.shape = shape ? shape : [1];
        }
        if(convertData instanceof Float32Array) {
            this.dtype = "f32";
        }
        else if(convertData instanceof Int32Array) {
            this.dtype = "i32";
        }
        else if(convertData instanceof Uint32Array) {
            this.dtype = "u32";
        }
        this.size = convertData.length;
        this.buffer = device.createBuffer({
            size: convertData.byteLength,
            usage: GPUBufferUsage.COPY_SRC |
                GPUBufferUsage.STORAGE |
                GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this.buffer, 0, convertData);
    }

    setTensorWithoutData() {
        this.shape = [];
        this.size = 0;
    }

    async getData(): Promise<any> {
        const returnBuffer = device.createBuffer({
            size: this.buffer.size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        const encoder = device.createCommandEncoder();
        encoder.copyBufferToBuffer(this.buffer, 0, returnBuffer, 0, returnBuffer.size);
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
        await device.queue.onSubmittedWorkDone();
        await returnBuffer.mapAsync(GPUMapMode.READ);
        let result: any;
        if (this.dtype === "f32") {
            result = new Float32Array(returnBuffer.getMappedRange());
        }
        else if(this.dtype === "i32"){
            result = new Int32Array(returnBuffer.getMappedRange());
        } else if (this.dtype === "u32") {
            result = new Uint32Array(returnBuffer.getMappedRange());
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

function convertArrayTypes(arr: any[] | TypedArray) {
    if (arr instanceof Array) return arr;
    else if (arr instanceof Uint8Array || arr instanceof Uint16Array || arr instanceof Uint32Array || arr instanceof Uint8ClampedArray) {
        return convertBinaryArray(arr, "Uint32Array");
    }
    else if (arr instanceof Int8Array || arr instanceof Int16Array || arr instanceof Int32Array) {
        return convertBinaryArray(arr, "Int32Array");
    }
    else if (arr instanceof Float32Array) {
        return convertBinaryArray(arr, "Float32Array");
    }
    else if (arr instanceof Float64Array) {
        console.warn("In WGSL, float64 must be converted to float32, which will result in some loss of precision.")
        return convertBinaryArray(arr, "Float32Array");
    }
}

type TypedArray = Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array

function convertBinaryArray(array: TypedArray, targetType: string) {
    // 将输入数组转换为普通数组
    const values = Array.from(array);

    // 根据目标类型进行转换
    switch (targetType) {
        case 'Int32Array':
            return new Int32Array(values);
        case 'Uint8Array':
            return new Uint8Array(values);
        case 'Uint16Array':
            return new Uint16Array(values);
        case 'Uint32Array':
            return new Uint32Array(values);
        case 'Float32Array':
            return new Float32Array(values);
        case 'Float64Array':
            return new Float64Array(values);
    }
}

function checkArrayTypes(arr: number[]) {
    return arr.map(value => {
        if (Number.isInteger(value)) {
            return 'Integer';
        } else if (typeof value === 'number') {
            return 'Float';
        } else {
            return 'Not a number';
        }
    });
}