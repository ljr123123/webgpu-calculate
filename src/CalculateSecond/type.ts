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

function ShortToArray(data: ArrayBuffer, type: ShortDataType): BinaryArray {
    if (type == "f32") return new Float32Array(data);
    else if (type == "i32") return new Int32Array(data);
    else if (type == "u32") return new Uint32Array(data);
    else throw new Error(`返回二进制数组时使用了不合法的类型:${type},希望的类型是float32,int32,uint32`);
}

const typeTrans = {
    LongToShort,
    ShortToArray
}
export {
    typeTrans
}

export function isBinaryArray(data: any): data is BinaryArray {
    return ArrayBuffer.isView(data) && [Float32Array, Int32Array, Uint32Array].some(type => data instanceof type);
}
