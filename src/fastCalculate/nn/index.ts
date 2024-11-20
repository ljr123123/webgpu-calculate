import { device } from "../basic";
import { getDataFromBuffer } from "../test";
import { Tensor } from "../BasicDataType";

class Layer{

}

class Linear extends Layer{
  input_length:number;
  input_x:Tensor | undefined;
  output_length:number;
  output_x:Tensor | undefined;
  weight_matrix:Tensor;
  bias_vector:GPUBuffer;
  constructor(input:number, output:number){
    super();
    this.input_x = undefined;
    this.output_x = undefined;
    this.input_length = input;
    this.output_length = output;

    // 创建系数矩阵(weight matrix)
    const weight_init = new Float32Array(input * output).fill(1.0);
    this.weight_matrix = device.createBuffer({
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      size:weight_init.byteLength
    });
    device.queue.writeBuffer(this.weight_matrix, 0, weight_init);

    // 创建偏置项矩阵(bias matrix)
    const bias_init = new Float32Array(output).fill(0.0);
    this.bias_vector = device.createBuffer({
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      size:bias_init.byteLength
    });
    device.queue.writeBuffer(this.bias_vector, 0, bias_init)

  }
  forward(x:Tensor): Tensor{
    const result_tensor = TensorPlusTensor(x, this.weight_matrix);

    return result_tensor;
  }
}


// 矩阵乘法 -- 仅适用于1维和2维
async function TensorPlusTensor(tensor_left:Tensor, tensor_right:Tensor): Promise<Tensor>{
  const result_tensor = new Tensor();
  const left_tensor_width = tensor_left.shape[0];
  const left_tensor_height = tensor_left.shape[1]? tensor_left.shape[1] : 1;
  const right_tensor_width = tensor_right.shape[0];
  const right_tensor_height = tensor_right.shape[1]? tensor_right.shape[1] : 1;

  if(left_tensor_width != right_tensor_height) {
    throw new Error("left tensor's width not equal to right tensor's height!!!");
  }
  const result_init = new Float32Array(left_tensor_height * right_tensor_width);
  const resultBuffer = device.createBuffer({
    size:result_init.byteLength,
    usage:GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  })
  result_tensor.buffer = resultBuffer;
  if(right_tensor_width == 1) {
    result_tensor.shape = [left_tensor_height];
  }
  else {
    result_tensor.shape = [left_tensor_height, right_tensor_width];
  }
  result_tensor.dtype = tensor_left.dtype;
  result_tensor.size = left_tensor_height * right_tensor_width;

  const compute_module = `
  @group(0) @binding(0) var<storage, read> left_tensor:array<f32>
  @group(0) @binding(1) var<storage, read> right_tensor:array<f32>
  @group(0) @binding(2) var<storage, write> result_tensor:array<f32>

  @compute @workgroup_size(64)
  fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
      let row = globalId.x;
      let col = globalId.y;

      // Check if the row and column are within the bounds of the result tensor
      if (row >= ${left_tensor_width}u || col >= ${right_tensor_height}u) {
          return;
      }

      var sum: f32 = 0.0;
      
      // Perform the dot product (matrix multiplication)
      for (var k: u32 = 0u; k < ${left_tensor_height}u; k = k + 1u) {
          let left_value = left_tensor[row * ${left_tensor_height} + k];
          let right_value = right_tensor[k * ${right_tensor_height} + col];
          sum = sum + left_value * right_value;
      }

      // Store the result in the result tensor
      result_tensor[row * ${right_tensor_height} + col] = sum;
  }
  `

  const pipeline = device.createComputePipeline({
      layout: "auto",
      compute: {
          module: device.createShaderModule({ code: compute_module }),
          entryPoint: 'main',
      },
  });

  const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
          { binding: 0, resource: { buffer: tensor_left.buffer } },
          { binding: 1, resource: { buffer: tensor_right.buffer } },
          { binding: 2, resource: { buffer: resultBuffer } },
      ],
  });
  const commandEncoder = device.createCommandEncoder();
  const pass = commandEncoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(Math.ceil(resultBuffer.size / 64)); // Adjust based on the number of threads
  pass.end();
  const commandBuffer = commandEncoder.finish(); // 创建命令缓冲区
  device.queue.submit([commandBuffer]); // 提交一次
  await device.queue.onSubmittedWorkDone()
  result_tensor.buffer = resultBuffer;
  return result_tensor;
}

