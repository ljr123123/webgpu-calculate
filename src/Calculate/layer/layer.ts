import { globalController } from "../basic/GlobalController";
import { GPUBufferWrapper } from "../basic/GPUBufferWrapper";
import { Tensor } from "../tensor/tensor";

export class Layer {
    input_size:number;
    output_size:number;
    constructor(input_size:number, output_size:number){
        this.input_size = input_size;
        this.output_size = output_size;
    }
    forward(X:Tensor[]):Tensor[]{ return X; }
};

export class Linear extends Layer {
    parameterMatrix:GPUBufferWrapper;
    biasMatrix:GPUBufferWrapper;
    constructor(input_size:number, output_size:number) {
        super(input_size, output_size);

        const origin_parameter = new Float32Array(input_size*output_size).fill(1.0);
        this.parameterMatrix = new GPUBufferWrapper(origin_parameter.length, "float32");
        this.parameterMatrix.writeBinary(origin_parameter, 0);

        const origin_bias = new Float32Array(output_size).fill(0.0);
        this.biasMatrix = new GPUBufferWrapper(origin_bias.length, "float32");
        this.biasMatrix.writeBinary(origin_bias, 0);
    }
    forward(X:Tensor[]):Tensor[] {
        X.forEach(tensor => {
            if(tensor.GPUBuffer == undefined) throw new Error("GPUBuffer undefined")
            const new_vector = new GPUBufferWrapper(this.output_size, "float32");
            globalController.submit({
                module:`
                @group(0) @binding(0) var<storage, read_write> tensor:array<f32>;
                @group(0) @binding(1) var<storage, read_write> param:array<f32>;
                @group(0) @binding(2) var<storage, read_write> bias:array<f32>;
                @group(0) @binding(3) var<storage, read_write> new_vector:array<f32>;

                @compute @workgroup_size(1, 1)
                fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
                    let idx = globalId.x;
                    var result:f32 = 0;
                    if(idx >= ${this.output_size}u) { return; }
                    for(var idy = 0u; idy < ${this.input_size}u; idy++) {
                        result = result + (tensor[idy] * param[idx * ${this.input_size}u + idy]);
                    }
                    new_vector[idx] = result + bias[idx];
                }
                `,
                entries:[
                    {binding:0, buffer:tensor.GPUBuffer},
                    {binding:1, buffer:this.parameterMatrix},
                    {binding:2, buffer:this.biasMatrix},
                    {binding:3, buffer:new_vector}
                ],
                workGroupSize:Math.max(this.input_size, this.output_size)
            });
            tensor.GPUBuffer = new_vector;
            tensor.size = this.output_size;
        });
        return X;
    }
};

export class Input extends Linear {
    constructor(input_tensor:Tensor[], output_size:number) {
        if(input_tensor[0].size == undefined) throw new Error("");
        super(input_tensor[0].size, output_size);
    }
}

type ActivateFunctionName = "ReLU" | "Softmax" | "Sigmoid";
export class Activation extends Layer {
    activate_type:ActivateFunctionName;
    constructor(activate:ActivateFunctionName) {
        super(0, 0);
        this.activate_type = activate;
    }
    forward(X:Tensor[]):Tensor[] {
        switch(this.activate_type) {
            case "ReLU": return this.ReLU(X);
            case "Softmax": return this.Softmax(X);
            case "Sigmoid": return this.Sigmoid(X);
            default: throw new Error(`Activation层.activate参数设置错误:${this.activate_type},应该:ReLU,Softmax,Sigmoid`);
        }
    }
    ReLU(X:Tensor[]):Tensor[] {
        X.forEach(tensor => {
            if(tensor.size == undefined || tensor.GPUBuffer == undefined) throw new Error("Tensor 未初始化")
            globalController.submit({
                module:`
                @group(0) @binding(0) var<storage, read_write> tensor: array<f32>;
                @compute @workgroup_size(1)
                fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
                    let index = globalId.x;
                    if(index >= ${tensor.size}) { return; }

                    tensor[index] = max(tensor[index], 0.0);
                }
                `,
                entries:[
                    {binding:0, buffer:tensor.GPUBuffer}
                ],
                workGroupSize:tensor.size
            })
        })
        return X;
    }
    Softmax(X:Tensor[]):Tensor[] {
        X.forEach(tensor => {
            if(tensor.GPUBuffer == undefined) throw new Error("GPUBuffer undefined")
            globalController.submit({
                module:`
                @group(0) @binding(0) var<storage, read_write> tensor:array<f32>;
                @compute @workgroup_size(1)
                fn main() {
                    var sum:f32 = 0;
                    var max_result:f32 = -999999;
                    for(var i = 0u; i < ${tensor.size}u; i++) {
                        max_result = max(max_result, tensor[i]);
                    }
                    for(var i = 0u; i < ${tensor.size}u; i++) {
                        sum = sum + exp(tensor[i] - max_result);
                    }
                    for(var i = 0u; i < ${tensor.size}u; i++) {
                        tensor[i] = exp(tensor[i] - max_result) / sum;
                    }
                }
                `,
                entries:[
                    {binding:0, buffer:tensor.GPUBuffer}
                ],
                workGroupSize:1
            })
        })
        return X;
    }
    Sigmoid(X:Tensor[]):Tensor[] {
        if(X[0].size != 1) throw new Error(`Sigmoid函数只需要一个特征:${X[0].size}`);
        X.forEach(tensor => {
            if(tensor.size == undefined || tensor.GPUBuffer == undefined) throw new Error("Tensor 未初始化")
            globalController.submit({
                module:`
                @group(0) @binding(0) var<storage, read_write> tensor:array<f32>;
                @compute @workgroup_size(1)
                fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
                    let index = globalId.x;
                    if(index >= ${tensor.size}u) { return; }

                    tensor[index] = 1.0 / (1.0 + exp(-tensor[index]));
                }
                `,
                entries:[
                    {binding:0, buffer:tensor.GPUBuffer}
                ],
                workGroupSize:tensor.size
            })
        })
        return X;
    }
}