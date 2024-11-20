import { globalController } from "./basic";
import { Tensor, tensor } from "./tensor";
import { Layer } from "./layer";
class Module {
    layers:Layer[];
    constructor(){
        this.layers = [];
    }
    fit(X:Tensor[], Y:Tensor[]):void{}
    predict(X:Tensor[]):Tensor[]{ return []; }
    
};