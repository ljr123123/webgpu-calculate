import { globalController } from "../basic/GlobalController";
import { GPUBufferWrapper } from "../basic/GPUBufferWrapper";
import { Tensor } from "../tensor/tensor";

export function accuracyScore(y_true:Tensor[], y_pred:Tensor[]):number {

    return 1.0;
}

export function crossEntropyLoss(y_true:Tensor[], y_pred:Tensor[]):GPUBufferWrapper {
    if(y_true[0].size == undefined) throw new Error("");

    const result_buffer = new GPUBufferWrapper(y_true[0].size, "float32");
    const origin_result = new Float32Array(y_true[0].size).fill(0.0);
    result_buffer.writeBinary(origin_result, 0);

    const result_sum_buffer = new GPUBufferWrapper(1, "float32");
    const origin_sum = new Float32Array(1).fill(0.0);
    result_sum_buffer.writeBinary(origin_sum, 0);

    for(let i = 0; i < y_true.length; i++) {
        globalController.submit({
            module:`
            @group(0) @binding(0) var<storage, read_write> result:array<f32>;
            @group(0) @binding(1) var<storage, read_write> y_true:array<f32>;
            @group(0) @binding(2) var<storage, read_write> y_pred:array<f32>;

            @compute @workgroup_size(1)
            fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
                let index = globalId.x;
                if(index >= ${y_true[i].size}u) { return; }
                result[index] = -(y_true[index] * log(y_pred[index])) + result[index];
            }
            `,
            entries:[
                {binding:0, buffer:result_buffer},
                {binding:1, buffer:y_true[i].GPUBuffer},
                {binding:2, buffer:y_pred[i].GPUBuffer}
            ],
            workGroupSize:y_true[i].size
        })
    }

    globalController.submit({
        module:`
        @group(0) @binding(0) var<storage, read_write> result:array<f32>;
        @group(0) @binding(1) var<storage, read_write> sum:array<f32>;

        @compute @workgroup_size(1)
        fn main() {
            for(var i:u32 = 0u; i < ${y_true[0].size}u; i++) {
                sum[0u] = result[i] + sum[0u];
            }
        }
        `,
        entries:[
            {binding:0, buffer:result_buffer},
            {binding:1, buffer:result_sum_buffer}
        ],
        workGroupSize:1
    });

    return result_sum_buffer;
}



