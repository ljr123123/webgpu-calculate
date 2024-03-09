let device = undefined;
let buffer = [];
async function init() {
  const adapter = await navigator.gpu?.requestAdapter();
  device = await adapter?.requestDevice();
  return;
}

async function add(vector_one, vector_two) {
  vector_one = new Float32Array(vector_one);
  vector_two = new Float32Array(vector_two);
  const workBuffer = device.createBuffer({
    size: vector_one.byteLength + vector_two.byteLength,
    usage:
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(workBuffer, 0, vector_one);
  device.queue.writeBuffer(workBuffer, vector_one.byteLength, vector_two);

  const module = device.createShaderModule({
    label: "doubling compute module",
    code: `
      @group(0) @binding(0) var<storage, read_write> data: array<f32>;
  
      @compute @workgroup_size(1) fn computeSomething(
        @builtin(global_invocation_id) id: vec3u
      ) {
        let i = id.x;
        if (i >= ${ vector_one.length } ) { return; }
        data[i] = data[ i + ${ vector_one.length } ] + data[i];
      }
    `,
  });
  const pipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
      module,
      entryPoint: "computeSomething",
    },
  });
  const resultBuffer = device.createBuffer({
    size: vector_one.byteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: workBuffer } }],
  });
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(vector_one.length + vector_two.length);
  pass.end();
  encoder.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, resultBuffer.size);
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);
  await resultBuffer.mapAsync(GPUMapMode.READ);
  const result = new Float32Array(resultBuffer.getMappedRange());

  console.log("result", result);

  resultBuffer.unmap();
}

export { init, add };
