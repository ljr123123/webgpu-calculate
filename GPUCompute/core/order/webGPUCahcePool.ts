import { createVirtualBuffer } from "../global";
import { Type, WGSLType } from "../type";
import { BasicType, WGSLArray } from "../type/WGSLType";
import { VirtualBuffer } from "../virtualBuffer";

export class WebGPUCachePool {

}


function add(a:VirtualBuffer, b:VirtualBuffer, labelOfc:string):VirtualBuffer {
    if(a.WGSLType instanceof WGSLArray && b.WGSLType instanceof WGSLArray && typeof a.WGSLType.) {
        const checkType = (...args:BasicType[]) => {
            const isFloat32 = args.some((type) => {
                return type === Type.float32;
            });
            if(isFloat32) return Type.float32;
            const isInt32 = args.some((type) => {
                return type === Type.int32;
            })
            if(isInt32) return Type.int32;
            return Type.uint32;
        }
        const c = createVirtualBuffer(labelOfc, checkType([a.WGSLType.type]))
    }
}