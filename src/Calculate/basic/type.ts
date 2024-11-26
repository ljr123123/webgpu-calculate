import { GPUBufferWrapper } from "./GPUBufferWrapper";

export interface ComputeCompose {
    module: string;
    entries: Iterable<GPUBindGroupEntryWrapper>;
    workGroupSize: number | undefined;
}
export interface GPUBindGroupEntryWrapper {
    binding: number;
    buffer: GPUBufferWrapper | GPUBuffer | undefined
}
export interface GPUBufferOrder {
    buffer: GPUBuffer;
    order: number;
}

export type ShortDataType = "f32" | "i32" | "u32";
export type LongDataType = "float32" | "int32" | "uint32";
export type BinaryArray = Float32Array | Int32Array | Uint32Array;
export type TypedArray = Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array;


function LongToShort(type: LongDataType): ShortDataType {
    switch (type) {
        case "float32": return "f32";
        case "int32": return "i32";
        case "uint32": return "u32";
        default: throw new Error(`内存定义时使用了不合法的类型:${type},希望的类型是float32,int32,uint32`);
    }
}

function ShortToLong(type:ShortDataType):LongDataType {
    switch (type) {
        case "f32": return "float32";
        case "i32": return "int32";
        case "u32": return "uint32";
        default: throw new Error(`内存定义时使用了不合法的类型:${type},希望的类型是f32,i32,u32`);
    }
}

function ShortToArray(data: ArrayBuffer, type: ShortDataType): BinaryArray {
    if (type == "f32") return new Float32Array(data);
    else if (type == "i32") return new Int32Array(data);
    else if (type == "u32") return new Uint32Array(data);
    else throw new Error(`返回二进制数组时使用了不合法的类型:${type},希望的类型是float32,int32,uint32`);
}

export const typeTrans = {
    LongToShort,
    ShortToArray,
    ShortToLong
}

export function isBinaryArray(data: any): data is BinaryArray {
    return ArrayBuffer.isView(data) && [Float32Array, Int32Array, Uint32Array].some(type => data instanceof type);
}