import { BufferWrapper } from "../basic/buffer";
import { device } from "../basic/device";
import { LongNumberType, RecursiveArray } from "../basic/type";

interface TensorDescriptor {
    shape:number[];
    type:LongNumberType;
    batchSize:number;
}

export class Tensor {
    shape:number[];
    type:LongNumberType;
    batchSize:number;
    bufferWrappers:BufferWrapper[];
    constructor({shape, type, batchSize}:TensorDescriptor) {
        let piece = 1;
        for(let i = 1; i < shape.length; i++) piece *= shape[i];
        this.shape = shape;
        this.type = type;
        this.batchSize = batchSize;
        this.bufferWrappers = [];
        for(let i = 0; i < batchSize; i++) {
            const new_buffer_wrapper = new BufferWrapper({
                size:shape[0],
                shape:shape,
                type:type,
                piece:piece
            });
            this.bufferWrappers.push(new_buffer_wrapper);
        }
    }
}

export function fillTensor(filler:number, tensor:Tensor):void {

    tensor.bufferWrappers.forEach(element => {
        element.fill(filler);
    });
}

export function writeTensor(writer:number[], tensor:Tensor):void {
    
}