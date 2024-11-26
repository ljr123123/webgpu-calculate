import { Tensor } from "../tensor/tensor";
import { globalController } from "../basic/GlobalController";
import { GPUBufferWrapper } from "../basic/GPUBufferWrapper";

export class Scaler{
    constructor() {}
    fit(tensor_array:Tensor[]):void {}
    transform(tensor_array:Tensor[]):Tensor[] {
        return tensor_array;
    }
    fit_transform(tensor_array:Tensor[]):Tensor[] {
        return tensor_array;
    }
};

export class StandScaler extends Scaler {
    mean:GPUBufferWrapper | undefined;
    variance:GPUBufferWrapper | undefined;
    fitPosition:GPUBufferWrapper | undefined;
    constructor(fit_pos?: number[]) {
        super();
        if (fit_pos != undefined) {
            const fitPosSet = new Set(fit_pos);
            const maxNum = Math.max(...fit_pos);
            fit_pos = Array.from({ length: maxNum + 1 }, (_, i) => 
                fitPosSet.has(i) ? i : -1
            );
            const origin_position = new Int32Array(fit_pos);
            this.fitPosition = new GPUBufferWrapper(origin_position.length, "int32");
            this.fitPosition.writeBinary(origin_position);
        }
    }
    
    fit(tensor_array:Tensor[]):void {
        // 如果fitPosition未定义，则默认对整个tensor进行标准化
        if(this.fitPosition == undefined) {
            const origin_position = [...Array(tensor_array[0].size).keys()];
            const binary_position = new Int32Array(origin_position);
            this.fitPosition = new GPUBufferWrapper(binary_position.length, "int32");
            this.fitPosition.writeBinary(binary_position);
        }

        const origin_mean = new Float32Array(this.fitPosition.size).fill(0);
        const origin_variance = new Float32Array(this.fitPosition.size).fill(0);

        this.mean = new GPUBufferWrapper(origin_mean.length, "float32");
        this.variance = new GPUBufferWrapper(origin_variance.length, "float32");
        

        this.mean.writeBinary(origin_mean, 0);
        this.variance.writeBinary(origin_variance, 0);


        tensor_array.forEach((tensor, index) => {
            if(tensor.size == undefined || tensor.GPUBuffer == undefined) throw new Error("Tensor 未初始化")
            if(tensor.type !== "f32") tensor.astype("float32");

            globalController.submit({
                module:`
                @group(0) @binding(0) var<storage, read_write> mean: array<f32>;
                @group(0) @binding(1) var<storage, read_write> variance: array<f32>;
                @group(0) @binding(2) var<storage, read_write> tensor: array<f32>;
                @group(0) @binding(3) var<storage, read_write> position: array<i32>;

                @compute @workgroup_size(1)
                fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
                    let index = globalId.x;
                    if(index >= ${tensor.size}u || i32(index) != position[index]) { return; }

                    let n = f32(${index});
                    let old_mean = mean[index];
                    let old_variance = variance[index];
                    let new_mean = old_mean + (tensor[index] - old_mean) / (n + 1.0);
                    let new_variance = old_variance + ((tensor[index] - old_mean) * (tensor[index] - new_mean) / (n + 1.0));
                    
                    mean[index] = new_mean;
                    variance[index] = new_variance;
                }
                `,
                entries:[
                    {binding:0, buffer: this.mean as unknown as GPUBufferWrapper},
                    {binding:1, buffer: this.variance as unknown as GPUBufferWrapper},
                    {binding:2, buffer: tensor.GPUBuffer},
                    {binding:3, buffer: this.fitPosition as unknown as GPUBufferWrapper}
                ],
                workGroupSize:tensor.size
            });
        });

    }
    transform(tensor_array:Tensor[]):Tensor[] {
        tensor_array.forEach((tensor, index) => {
            if(tensor.size == undefined || tensor.GPUBuffer == undefined) throw new Error("Tensor 未初始化")

            globalController.submit({
                module:`
                @group(0) @binding(0) var<storage, read_write> mean: array<f32>;
                @group(0) @binding(1) var<storage, read_write> variance: array<f32>;
                @group(0) @binding(2) var<storage, read_write> tensor: array<f32>;
                @group(0) @binding(3) var<storage, read_write> position: array<i32>;

                @compute @workgroup_size(1)
                fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
                    let index = globalId.x;
                    if(index >= ${tensor.size}u || i32(index) != position[index]) { return; }

                    tensor[index] = (tensor[index] - mean[index]) / sqrt(variance[index]);
                }
                `,
                entries:[
                    {binding:0, buffer: this.mean as unknown as GPUBufferWrapper},
                    {binding:1, buffer: this.variance as unknown as GPUBufferWrapper},
                    {binding:2, buffer: tensor.GPUBuffer},
                    {binding:3, buffer: this.fitPosition as unknown as GPUBufferWrapper}
                ],
                workGroupSize:tensor.size
            });
        });
        return tensor_array;
    }
    fit_transform(tensor_array:Tensor[]):Tensor[] {
        this.fit(tensor_array);
        tensor_array = this.transform(tensor_array);
        return tensor_array;
    }

};

export class MinMaxScaler extends Scaler {
    constructor() {
        super();
    }
    fit(tensor_array:Tensor[]):void {

    }
    transform(tensor_array:Tensor[]):Tensor[] {
        return tensor_array;
    }
    fit_transform(tensor_array:Tensor[]):Tensor[] {
        return tensor_array;
    }
};