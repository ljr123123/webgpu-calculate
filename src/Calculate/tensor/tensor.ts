import { GPUBufferWrapper } from "../basic/GPUBufferWrapper";
import { globalController } from "../basic/GlobalController";
import { ShortDataType, LongDataType, BinaryArray, TypedArray, typeTrans } from "../basic/type";
export class Tensor {
    GPUBuffer: GPUBufferWrapper | undefined;
    shape: number[] | undefined;
    type: ShortDataType | undefined;
    size:number | undefined;
    constructor(size?: number, type?: LongDataType, shape?: number[], data?: BinaryArray) {
        if(data == undefined || size == undefined || type == undefined) {
            this.GPUBuffer == undefined;
            this.shape = undefined;
            this.size = undefined;
            this.type = undefined;
            return;
        }
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
        if(this.shape == undefined) throw new Error("shape 未定义")
        this.shape.forEach(dim => new_shape *= dim);
        this.shape = [new_shape];
    }

    // 读取数据
    async read() {
        if(this.GPUBuffer == undefined) throw new Error("GPUBuffer undefined")
        return await this.GPUBuffer.read();
    }

    // 转置
    T() {

    }

    // 转换类型
    astype(type:LongDataType) {
        if(this.GPUBuffer == undefined) throw new Error("GPUBuffer undefined")
        this.GPUBuffer.astype(type);
        this.type = this.GPUBuffer.dataType;
    }

    copy():Tensor {
        if(this.type == undefined || this.size == undefined || this.GPUBuffer == undefined) throw new Error("")
        const new_tensor = new Tensor();
        new_tensor.type = this.type;
        new_tensor.size = this.size;
        new_tensor.shape = this.shape;
        const new_buffer = new GPUBufferWrapper(new_tensor.size, typeTrans.ShortToLong(new_tensor.type))

        globalController.submit({
            module:`
            @group(0) @binding(0) var<storage, read_write> old:array<${this.type}>;
            @group(0) @binding(1) var<storage, read_write> new:array<${this.type}>;

            @compute @workgroup_size(1)
            fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
                let index = globalId.x;
                if(index >= ${this.size}u) { return; }

                new[index] = old[index];
            }
            `,
            entries:[
                {binding:0, buffer:this.GPUBuffer},
                {binding:1, buffer:new_buffer}
            ],
            workGroupSize:this.size
        })

        return new_tensor;
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

export async function tensorsRead(tensor_array:Tensor[]):Promise<number[][]>  {
    const read_promise = tensor_array.map(tensor => {return tensor.read()});
    let result = await Promise.all(read_promise);
    return result.map(res => {return Array.from(res)});
}

const tensor = new TensorCreator()
export { tensor }
