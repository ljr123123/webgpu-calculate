import { GPUBufferWrapper } from "./basic/GPUBufferWrapper";
import { globalController } from "./basic/GlobalController";
import { tensor, tensorsRead } from "./tensor/tensor";
import { StandScaler } from "./preprocess/preprocess";
import { Linear, Activation, Input, Layer } from "./layer/layer";
import { Module } from "./model/nn";
import { createSeededRandom } from "./plugin/plugin";

const rng = createSeededRandom(42);
class Model extends Module {
    constructor() {
        super();
    }  
}
function generateRandomArrays (numArrays:number, dimensions:number)  {
    let arrays = [];
    
    for (let i = 0; i < numArrays; i++) {
      let randomArray = [];
      for (let j = 0; j < dimensions; j++) {
        randomArray.push(rng() * 10); // 生成 0 到 1 之间的随机数
      }
      arrays.push(tensor.JSArray(randomArray));
    }
    return arrays;
};

function randomY(){}
  
export function test() {
    const randomArrays = generateRandomArrays(1000, 10000);
    const scaler = new StandScaler();
    scaler.fit_transform(randomArrays);

    const model = new Model();
    model.setLayers([
        new Input(randomArrays, 200),
        new Activation("ReLU"),
        new Linear(200, 10),
        new Activation("Softmax")
    ])
    model.fit(randomArrays, randomArrays);
    model.predict(randomArrays);
    tensorsRead(randomArrays)
    .then(res => {
        console.log(res);
    })
}
