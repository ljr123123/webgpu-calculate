import { VirtualData } from "./GE2";
import { BasicType, basicTypeByteLength, WGSLArray, WGSLType } from "./type";

export class Tensor {
    type:BasicType;
    shape:number[];
    virtualData:VirtualData;
    constructor(type:BasicType, shape:number[], label?:string) {
        this.type = type;
        this.shape = shape;
        this.virtualData = {
            type:this.type,
            label:label,
            lifeEnd:0,
            lifeStart:0,
            byteLength:this.shape.reduce((sum, element) => {
                return sum *= element;
            }, 1) * basicTypeByteLength[type]
        }
    }
    read() {
        
    }
}