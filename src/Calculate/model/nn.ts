import { globalController } from "../basic/GlobalController";
import { Tensor, tensor } from "../tensor/tensor";
import { Layer } from "../layer/layer";
export class Module {
    layers:Layer[];
    constructor(){
        this.layers = [];
    }
    fit(X:Tensor[], Y:Tensor[]):void{}
    predict(X:Tensor[]):Tensor[]{ 
        this.layers.forEach(layer => X = layer.forward(X));
        return X; 
    }
    setLayers(layers:Layer[]):void {
        this.layers = layers;
    }
};