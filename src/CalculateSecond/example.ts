import { GPUBufferWrapper, globalController } from "./basic";
import { tensor } from "./tensor";
import { StandScaler } from "./preprocess";
import { Linear } from "./layer";

const tensor_1 = tensor.JSArray([1.1, 1.1]);
const tensor_2 = tensor.JSArray([1.1, 1.1]);

const tensor_array = [tensor_1, tensor_2];
const linear = new Linear(tensor_1.size, 1);
linear.forward(tensor_array);
const data = await tensor_1.read();
console.log(data);



const nothing = undefined;
export {
    nothing
}
