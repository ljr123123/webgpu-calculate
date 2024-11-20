import { GPUBufferWrapper, globalController } from "./basic"
import { ShortDataType, LongDataType, BinaryArray, TypedArray } from "./type";
export class Tensor {
    GPUBuffer: GPUBufferWrapper;
    shape: number[];
    type: ShortDataType;
    size:number;
    constructor(size: number, type: LongDataType, shape: number[], data: BinaryArray) {
        this.GPUBuffer = new GPUBufferWrapper(size, type);
        this.size = size;
        this.GPUBuffer.writeBinary(data, 0);
        this.shape = shape;
        this.type = this.GPUBuffer.dataType;
    }

    // 重新定型
    reshape(shape:number[]) {
        this.shape = shape;
    }

    // 对应i, j, k...写入数据
    write(indexes:number[], data:number) {

    }

    // 扁平化
    flatten() {
        let new_shape = 1;
        this.shape.forEach(dim => new_shape *= dim);
        this.shape = [new_shape];
    }

    // 读取数据
    async read() {
        return await this.GPUBuffer.read();
    }

    // 转置
    T() {

    }

    // 转换类型
    astype(type:LongDataType) {
        this.GPUBuffer.astype(type);
        this.type = this.GPUBuffer.dataType;
    }
};

class TensorCreator {
    constructor() {}

    // 二进制数组的方式创建
    binary(data: TypedArray, shape?: number[], type?: LongDataType):Tensor {
        let old_data: TypedArray = data;

        if (type != undefined) {
            if (type == "int32") data = new Int32Array(old_data);
            else if (type == "float32") data = new Float32Array(old_data);
            else if (type == "uint32") data = new Uint32Array(old_data);
            else throw new Error(`type参数设置不正确:${type},应该是int32,float32,uint32`)
        }
        else {
            if (data instanceof Int8Array || data instanceof Int16Array || data instanceof Int32Array) {
                type = "int32";
                data = new Int32Array(old_data);
            }
            else if (data instanceof Uint8Array || data instanceof Uint16Array || data instanceof Uint32Array || data instanceof Uint8ClampedArray) {
                type = "uint32";
                data = new Uint32Array(old_data);
            }
            else if (data instanceof Float32Array || data instanceof Float64Array) {
                type = "float32";
                data = new Float32Array(old_data);
            }
            else throw new Error(`data参数设置不正确:${data},应该是TypedArray类型的`)
        }
        if (shape == undefined) {
            return new Tensor(data.length, type, [data.length], data);
        }
        else {
            return new Tensor(data.length, type, shape, data);
        }
    }
    JSArray(data:number[], shape?: number[], type?: LongDataType):Tensor {
        data = data.flat(Infinity);
        let binary_array:BinaryArray;
        if (type != undefined) {
            if (type == "int32") binary_array = new Int32Array(data);
            else if (type == "float32") binary_array = new Float32Array(data);
            else if (type == "uint32") binary_array = new Uint32Array(data);
            else throw new Error(`type参数设置不正确:${type},应该是int32,float32,uint32`)
        }
        else {
            type = "float32";
            binary_array = new Float32Array(data);
        }
        if (shape == undefined) {
            return new Tensor(data.length, type, [data.length], binary_array);
        }
        else {
            return new Tensor(data.length, type, shape, binary_array);
        }
    }
    fill(filler:number, size:number, shape?: number[], type?: LongDataType):Tensor {
        let binary_array:BinaryArray;
        if (type != undefined) {
            if (type == "int32") binary_array = new Int32Array(size).fill(filler);
            else if (type == "float32") binary_array = new Float32Array(size).fill(filler);
            else if (type == "uint32") binary_array = new Uint32Array(size).fill(filler);
            else throw new Error(`type参数设置不正确:${type},应该是int32,float32,uint32`)
        }
        else {
            type = "float32";
            binary_array = new Float32Array(size).fill(filler);
        }
        if (shape == undefined) {
            return new Tensor(size, type, [size], binary_array);
        }
        else {
            return new Tensor(size, type, shape, binary_array);
        }
    }
}

const tensor = new TensorCreator()
export { tensor }
