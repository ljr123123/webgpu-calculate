import { device, deviceLimits } from "./device";
import { LegalBinaryArray } from "./type";
type GPUBufferModel = "Piece" | "Join";
const maxBindingsPerBindGroup = deviceLimits.maxBindingsPerBindGroup;

interface GPUBufferWrapperDescriptor {
    originData: LegalBinaryArray[];
    shape: number[];
}

class GPUBufferWrapper {
    data: GPUBuffer[];
    shape: number[];
    pieceCompose: number[];
    pieces:number[];

    constructor({ originData, shape }: GPUBufferWrapperDescriptor) {
        // 假设originData已经是一维的，且内部元素全是TypedArray的数组
        // 且shape也是确定的了
        this.shape = shape;
        let shapeCount = 1;
        let i;
        for( i = 0; i < this.shape.length && i < 3; i++) {
            shapeCount *= this.shape[i];
            if(shapeCount > maxBindingsPerBindGroup) break;
        }
        if(shapeCount > maxBindingsPerBindGroup) {
            this.pieceCompose = this.shape.slice(0, i);
            // 回退
            shapeCount = shapeCount / this.shape[i];
            const _Z = Math.ceil(maxBindingsPerBindGroup / shapeCount);
            this.pieceCompose.push(_Z);
            this.pieces = this.shape.slice(i + 1, this.shape.length - 1);
            this.pieces.push(Math.ceil(this.shape[i] / _Z));
        }
        else {
            this.pieceCompose = this.shape;
            this.pieces = [1];
        }
        console.log("shape:", this.shape);
        console.log("")
        
    }
}

function getArrayDimensions(arr:any[]):number[] {
    let dimensions = 0;
    let shape:number[] = [];

    function recurse(subArr:any[]) {
        if (Array.isArray(subArr)) {
            dimensions++;
            shape.push(subArr.length);
            if (subArr.length > 0 && Array.isArray(subArr[0])) {
                recurse(subArr[0]);  // 递归检查下一级
            }
        }
    }

    recurse(arr);
    return shape;
}