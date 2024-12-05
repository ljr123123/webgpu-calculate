import { BufferWrapper } from "../basic/buffer";
import { LongNumberType } from "../basic/type";

interface TensorDescriptor {
    shape:number[];
    type:LongNumberType;
    batchSize:number;
}

class Tensor {
    shape:number[];
    type:LongNumberType;
    batchSize:number;
    bufferWrappers:BufferWrapper[];
    constructor({shape, type, batchSize}:TensorDescriptor) {
        this.shape = shape;
        this.type = type;
        this.batchSize = batchSize;
        for(let i = 0; i < batchSize; i++) {
            
        }
    }
}