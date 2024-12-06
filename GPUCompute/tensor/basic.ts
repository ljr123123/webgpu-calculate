import { GPUBufferGroup } from "../basic/buffer";
import { LongNumberType } from "../basic/type";

interface TensorDescriptor {
    data?:any;
    type:LongNumberType;
    shape:number[];
}

export class Tensor {
    private GPUBufferGroup:GPUBufferGroup;
    public type:LongNumberType;
    public shape:number[];
    constructor({data, type, shape}:TensorDescriptor) {
        this.type = type;
        this.shape = shape;
        this.GPUBufferGroup = new GPUBufferGroup({
            shape:shape,
            type:type,
            data:data
        });
    }
}

interface BatchDescriptor {
    batchsize:number;
    data:any;
}

class Batch {
    size:number;
    tensors:Tensor[];
    constructor({data, batchsize}:BatchDescriptor) {
        
    }
}