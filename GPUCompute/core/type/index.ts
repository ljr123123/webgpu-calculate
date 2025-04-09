import { BasicType, getByteLength, Mat, Struct, Vec, WGSLArray, toWGSLVariableType } from "./WGSLType";


export const Type = {
    float32: BasicType.float32,
    int32: BasicType.int32,
    uint32: BasicType.uint32,
    vec: (type: BasicType, length: number) => { return new Vec(type, length) },
    mat: (type: BasicType, width: number, height: number) => { return new Mat(type, width, height) },
    array: (type: BasicType | Mat | Vec | Struct, length: number) => { return new WGSLArray(type, length) },
    struct: (typename: string, StructSelf: {
        [key: string]: Struct | Mat | Vec | BasicType;
    }) => { return new Struct(typename, StructSelf) }
}

export {
    getByteLength,
    toWGSLVariableType
}

export type { WGSLType } from "./WGSLType"
export type { BufferBinding, BufferBindingLayout, BindGroupLayoutEntry } from "./WebgpuType"