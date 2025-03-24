enum Int1To4 {
    one = 1,
    two = 2,
    three = 3,
    four = 4
}

export enum BasicType {
    float32 = "f32",
    int32 = "i32",
    uint32 = "u32"
}

export const basicTypeByteLength = {
    f32:4,
    i32:4,
    u32:4
}

export class Mat {
    width:Int1To4;
    height:Int1To4;
    type:BasicType;
    constructor(type:BasicType, width:Int1To4, height:Int1To4) {
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

export class Vec {
    length:Int1To4;
    type:BasicType;
    constructor(type:BasicType, length:number) {
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

export class Struct {
    typename:string;
    structSelf:{[key:string]:Struct | Mat | Vec | BasicType};
    define:string;
    constructor(typename:string, Struct:{[key:string]:Struct | Mat | Vec | BasicType}, define:string) { 
        this.typename = typename;
        this.structSelf = Struct;
        this.define = define;
    }
    byteLength() {
        let sum = 0;
        Object.keys(this.structSelf).forEach(key => {
            if(typeof this.structSelf[key] === "string") sum += basicTypeByteLength[this.structSelf[key]];
            else sum += this.structSelf[key].byteLength();
        })
        return sum;
    }
    toWGSL() {
        let WGSL = `${this.typename}{\n`;
        Object.keys(this.structSelf).forEach(key => {
            if(typeof this.structSelf[key] === "string") WGSL += `${key}:${this.structSelf[key]}\n`;
            else WGSL += `${key}:${this.structSelf[key].toWGSL()}`;
        })
        WGSL += "}\n"
        return WGSL;
    }
}

export class WGSLArray {
    length:number;
    type:BasicType | Vec | Mat | Struct;
    constructor(type:BasicType | Vec | Mat | Struct, length:number) {
        this.length = length;
        this.type = type;
    }
    byteLength() {
        if(typeof this.type === "string") return basicTypeByteLength[this.type] * this.length;
        else return this.type.byteLength() * this.length;
    }
    toWGSL() {
        if(typeof this.type === "string") return `array<${this.type},${this.length}>`;
        else if(this.type instanceof Struct) return `array<${this.type.typename},${this.length}>`;
        else return `array<${this.type.toWGSL()},${this.length}>`;
    }
}

export type WGSLType = BasicType | Vec | Mat | Struct | WGSLArray;
export const Type = {
    float32:BasicType.float32,
    int32:BasicType.int32,
    uint32:BasicType.uint32,
    vec:(type:BasicType, length:number) => {
        return new Vec(type, length);
    },
    mat:(type:BasicType, width:number, height:number) => {
        return new Mat(type, width, height);
    },
    struct:(typename:string, self:{[key:string]:Struct | Mat | Vec | BasicType}, define:string) => {
        return new Struct(typename, self, define);
    },
    array:(type:BasicType | Vec | Mat | Struct, length:number) => {
        return new WGSLArray(type, length);
    },
    getByteLength:(type:WGSLType) => {
        if(typeof type === "string") return basicTypeByteLength[type];
        else return type.byteLength();
    } 
}

export function ArrayBufferToBinaryArray(arrayBuffer:ArrayBuffer, type:BasicType) {
    switch(type) {
        case BasicType.uint32: return new Uint32Array(arrayBuffer);
        case BasicType.int32: return new Int32Array(arrayBuffer);
        case BasicType.float32: return new Float32Array(arrayBuffer);
    }
}

export function WGSLArrayToJSArray(arrayBuffer:ArrayBuffer, type:WGSLArray) {
    const subType = type.type;
    if(subType instanceof Struct) {
        // 这个后面再写
        const structByteLength = subType.byteLength();
        return [...ArrayBufferToBinaryArray(arrayBuffer, BasicType.float32)];
    }
    else if(subType instanceof Mat) return reshape([...ArrayBufferToBinaryArray(arrayBuffer, subType.type)], [subType.width, subType.height]);
    else if(subType instanceof Vec) return reshape([...ArrayBufferToBinaryArray(arrayBuffer, subType.type)], [subType.length]);
    else return [...ArrayBufferToBinaryArray(arrayBuffer, subType)];
}

export function WGSLToJS(arrayBuffer:ArrayBuffer, type:WGSLType) {
    if(type instanceof WGSLArray) return WGSLArrayToJSArray(arrayBuffer, type);
    else if(type instanceof Struct) return [...ArrayBufferToBinaryArray(arrayBuffer, BasicType.float32)];
    else if(type instanceof Mat) return reshape([...ArrayBufferToBinaryArray(arrayBuffer, type.type)], [type.width, type.height])[0];
    else if(type instanceof Vec) return reshape([...ArrayBufferToBinaryArray(arrayBuffer, type.type)], [type.length])[0];
    else return [...ArrayBufferToBinaryArray(arrayBuffer, type)][0];
}

export function ArrayBufferSetJS(arrayBuffer:ArrayBuffer, type:WGSLType, data:any){}
function reshape<T extends number[]>(
    linearArray: number[],
    subShape: [...T]
): NestedArray<T> {
    // 维度校验
    const totalElements = subShape.reduce((a, b) => a * b, 1);
    if (totalElements !== linearArray.length) {
        throw new Error(`Cannot reshape array of length ${linearArray.length} into shape [${subShape}]`);
    }

    // 递归重塑核心逻辑
    const recursiveReshape = (arr: number[], dims: number[]): any => {
        if (dims.length === 0) return arr[0];
        
        const [currentDim, ...remainingDims] = dims;
        const chunkSize = remainingDims.reduce((a, b) => a * b, 1);
        
        return Array.from({ length: currentDim }, (_, i) => 
            recursiveReshape(
                arr.slice(i * chunkSize, (i + 1) * chunkSize),
                remainingDims
            )
        );
    };

    return recursiveReshape(linearArray, subShape);
}

// 类型推导工具
type NestedArray<T extends number[]> = 
    T extends [infer First, ...infer Rest] 
        ? First extends number 
            ? Rest extends number[] 
                ? Array<NestedArray<Rest>> 
                : never 
            : never 
        : number;