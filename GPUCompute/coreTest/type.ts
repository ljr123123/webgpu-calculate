import { device } from "./device";

enum Int1To4 {
    one = 1,
    two = 2,
    three = 3,
    four = 4
}


// WGSL中的基本类型
export enum BasicType {
    float32 = "f32",
    int32 = "i32",
    uint32 = "u32"
}

export const basicTypeByteLength = {
    f32: 4,
    i32: 4,
    u32: 4
}

// WGSL 中的矩阵类型
export class Mat {
    width: Int1To4;
    height: Int1To4;
    type: BasicType;
    constructor(type: BasicType, width: Int1To4, height: Int1To4) {
        this.width = width;
        this.height = height;
        this.type = type;
    }
    byteLength() {
        return basicTypeByteLength[this.type] * this.width * this.height;
    }
    toWGSL() {
        return `Mat${this.width}x${this.height}<${this.type}>`;
    }
}


// WGSL 中的vec类型
export class Vec {
    length: Int1To4;
    type: BasicType;
    constructor(type: BasicType, length: number) {
        this.length = length;
        this.type = type;
    }
    byteLength() {
        return basicTypeByteLength[this.type] * this.length;
    }
    toWGSL() {
        return `Vec${this.length}<${this.type}>`
    }
}


// WGSL中的struct类型
export class Struct {
    typename: string; // Struct类别名称
    structSelf: { [key: string]: Struct | Mat | Vec | BasicType };
    constructor(typename: string, Struct: { [key: string]: Struct | Mat | Vec | BasicType }) {
        this.typename = typename;
        this.structSelf = Struct;
    }
    byteLength() {
        let sum = 0;
        Object.keys(this.structSelf).forEach(key => {
            if (typeof this.structSelf[key] === "string") sum += basicTypeByteLength[this.structSelf[key]];
            else sum += this.structSelf[key].byteLength();
        })
        return sum;
    }
    toWGSL() {
        let WGSL = `${this.typename}{\n`;
        Object.keys(this.structSelf).forEach(key => {
            if (typeof this.structSelf[key] === "string") WGSL += `${key}:${this.structSelf[key]}\n`;
            else WGSL += `${key}:${this.structSelf[key].toWGSL()}`;
        })
        WGSL += "}\n"
        return WGSL;
    }
}


// WGSL 中的数组类型
export class WGSLArray {
    length: number;
    type: BasicType | Vec | Mat | Struct;
    constructor(type: BasicType | Vec | Mat | Struct, length: number) {
        this.length = length;
        this.type = type;
    }
    byteLength() {
        if (typeof this.type === "string") return basicTypeByteLength[this.type] * this.length;
        else return this.type.byteLength() * this.length;
    }
    toWGSL() {
        if (typeof this.type === "string") return `array<${this.type},${this.length}>`;
        else if (this.type instanceof Struct) return `array<${this.type.typename},${this.length}>`;
        else return `array<${this.type.toWGSL()},${this.length}>`;
    }
}

export type WGSLType = BasicType | Vec | Mat | Struct | WGSLArray;
export const Type = {
    float32: BasicType.float32,
    int32: BasicType.int32,
    uint32: BasicType.uint32,
    vec: (type: BasicType, length: number) => {
        return new Vec(type, length);
    },
    mat: (type: BasicType, width: number, height: number) => {
        return new Mat(type, width, height);
    },
    struct: (typename: string, self: { [key: string]: Struct | Mat | Vec | BasicType }, define: string) => {
        return new Struct(typename, self, define);
    },
    array: (type: BasicType | Vec | Mat | Struct, length: number) => {
        return new WGSLArray(type, length);
    },
    getByteLength: (type: WGSLType) => {
        if (typeof type === "string") return basicTypeByteLength[type];
        else return type.byteLength();
    },
    toWGSLVariableType: (type:WGSLType) => {
        if(typeof type === "string") return type;
        else return type.toWGSL();
    }
}

export function JSToArrayBuffer(jsData:Array<any> | Object, type:WGSLType):ArrayBuffer {

}

export function ArrayBufferToJS(arrayBuffer:ArrayBuffer, type:WGSLType):Array<any> | Object{

}


export interface BufferBindingLayout extends GPUBufferBindingLayout {
    type: GPUBufferBindingType;
    hasDynamicOffset: boolean;
    minBindingSize: GPUSize64;
}

export interface BindGroupLayoutEntry extends GPUBindGroupLayoutEntry {
    binding: number;
    buffer?: BufferBindingLayout;
}

export interface BufferBinding extends GPUBufferBinding {
    buffer:GPUBuffer;
    size:number;
    offset:number;
}