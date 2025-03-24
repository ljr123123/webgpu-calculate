import { VirtualBuffer } from "./buffer";
import { device } from "./device";
import { GE } from "./GE";

type ProcessNode = ComputeNode | BlockNode;

enum NodeState {
    UnCompiled = "UnCompiled",
    Compiling = "Compiling",
    CompileFinished = "CompileFinished",
    Running = "Running",
    RunFinished = "RunFinished"
}
class ComputeNode {
    state: NodeState;
    virtualBuffers: Set<VirtualBuffer>;
    compileContent?: {
        bindGroup: GPUBindGroup;
        pipeline: GPUComputePipeline;
    };
    workGroupSize: number[];
    WGSL: string;
    entry: string;
    commandBuffer?: GPUCommandBuffer;
    constructor(WGSL: string, entry: string) {
        this.state = NodeState.UnCompiled;
        this.virtualBuffers = new Set();
        this.WGSL = WGSL;
        this.entry = entry;
        this.workGroupSize = [];
    }
    async compilePipeline(bindGroupCompose: BindGroupCompose) {
        const bindGroup = bindGroupCompose.bindGroup;
        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [bindGroupCompose.layout]
        });
        const shader = device.createShaderModule({
            code: this.WGSL
        });
        const pipeline = await device.createComputePipelineAsync({
            layout: pipelineLayout,
            compute: {
                module: shader,
                entryPoint: this.entry
            }
        });
        this.compileContent = {
            bindGroup: bindGroup,
            pipeline: pipeline
        };
    }
    async compileGPUCommandBuffer(): Promise<GPUCommandBuffer> {
        if (!this.compileContent) throw new Error("");
        const commandEncoder = device.createCommandEncoder();
        const pass = commandEncoder.beginComputePass();
        pass.setBindGroup(0, this.compileContent.bindGroup);
        pass.setPipeline(this.compileContent.pipeline);
        pass.dispatchWorkgroups(this.workGroupSize[0], this.workGroupSize[1], this.workGroupSize[2]);
        pass.end();
        return commandEncoder.finish();
    }
}

enum BlockNodeType {
    private = "private",
    protected = "protected",
    public = "public"
}

interface BindGroupCompose {
    bindGroup: GPUBindGroup;
    layout: GPUBindGroupLayout;
}

interface BufferCompose {
    storageBuffer: GPUBuffer;
    uniformBuffer: GPUBuffer;
    readBuffer: GPUBuffer;
}

class BlockNode {
    type: BlockNodeType;
    subNodes: ProcessNode[];
    state: NodeState;
    buffer?: BufferCompose;
    bindGroupCompose?: BindGroupCompose;
    constructor(type: BlockNodeType) {
        this.subNodes = [];
        this.type = type;
        this.state = NodeState.UnCompiled;
    }
    addSubNodes(nodes: ProcessNode[]): void {
        this.subNodes.push(...nodes);
    }
    async compileGE() {
        const subBuffersInfo = this.gatherSubNodesInfo();
        const virtualBuffers = GE(subBuffersInfo);
        const bindGroupLayout = device.createBindGroupLayout({
            entries: virtualBuffers.map(buffer => {
                if (!buffer.sourceBinding) throw new Error("");
                return {
                    binding: buffer.sourceBinding.binding,
                    buffer: buffer.bindingLayout,
                    visibility: GPUShaderStage.COMPUTE
                }
            })
        });
        const bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: virtualBuffers.map(buffer => {
                if (!buffer.sourceBinding) throw new Error("");
                return {
                    binding: buffer.sourceBinding.binding,
                    resource: {
                        buffer: buffer.sourceBinding.buffer,
                        offset: buffer.sourceBinding.offset,

                    }
                }
            })
        });
        this.bindGroupCompose = {
            layout: bindGroupLayout,
            bindGroup: bindGroup
        };
    }
    gatherSubNodesInfo(): Set<VirtualBuffer> {
        return this.subNodes.reduce((set, node) => {
            if (node instanceof ComputeNode) {
                return set.union(node.virtualBuffers);
            }
            else if (node.type === BlockNodeType.public) {
                return node.gatherSubNodesInfo();
            }
            else return new Set();
        }, new Set<VirtualBuffer>());
    }
}