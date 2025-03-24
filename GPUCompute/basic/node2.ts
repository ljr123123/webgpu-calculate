import { device } from "./device";
import { BindGroupCompose, ResourceOnBindGroup, VirtualBindGroup, VirtualBindGroupMalloc, VirtualData } from "./GE2";

interface PipelineCommand {
    readonly label: "pipeline";
    entryFunction: string;
    entryPoint?: string;
    sourceData: ResourceOnBindGroup[];
    entryOptions?: WGSLEntryOptions;
}

interface WGSLEntryOptions {
    workgroup_size?: SingleGroup[];
    local_id_label?: {
        label: string;
        calculate: string;
    };
    dispatchWorkGroups?: SingleGroup[];
    global_id_label?: {
        label: string;
        calculate: string;
    };
}

interface SingleGroup {
    dispatch: number;
    range: number;
}

interface BufferCommand {
    readonly label: "buffer";
    sourceBuffer: ResourceOnBindGroup;
    aimBuffer: ResourceOnBindGroup;
    sourceOffset?: number;
    aimOffset?: number;
    copySize: number;
}

class BufferNode {
    command: BufferCommand;
    constructor(command: BufferCommand) {
        this.command = command;

    }
    encode(lifePoint: number): BufferNode {
        const aim = this.command.aimBuffer;
        const source = this.command.sourceBuffer;
        if (aim.data.lifeStart === -1) {
            aim.data.lifeEnd = aim.data.lifeStart = lifePoint;
        }
        else {
            aim.data.lifeEnd = lifePoint;
        }

        if (source.data.lifeStart === -1) {
            source.data.lifeEnd = source.data.lifeStart = lifePoint;
        }
        else {
            source.data.lifeEnd = lifePoint;
        }
        return this;
    }
    async GPUCommandBufferCompile() {
        const encoder = device.createCommandEncoder();
        if (!this.command.aimBuffer.data.source || !this.command.sourceBuffer.data.source) throw new Error("");
        encoder.copyBufferToBuffer(
            this.command.sourceBuffer.data.source.buffer,
            this.command.sourceOffset ? this.command.sourceOffset : (this.command.sourceBuffer.data.source.offset ? this.command.sourceBuffer.data.source.offset : 0),
            this.command.aimBuffer.data.source.buffer,
            this.command.aimOffset ? this.command.aimOffset : (this.command.aimBuffer.data.source.offset ? this.command.aimBuffer.data.source.offset : 0),
            this.command.copySize
        )
    }
}

class CommandNode {
    command: PipelineCommand;
    bindGroupCompose?: BindGroupCompose;
    pipeline?: GPUComputePipeline;
    commandBuffer?: GPUCommandBuffer;
    lifePoint: number;
    constructor(command: PipelineCommand) {
        this.command = command;
        this.lifePoint = 0;
    }
    encode(lifePoint: number): CommandNode {
        this.command.sourceData.forEach(data => {
            if (data.data.lifeStart === -1) {
                data.data.lifeEnd = data.data.lifeStart = lifePoint;
            }
            else {
                data.data.lifeEnd = lifePoint;
            }
        })
        return this;

    }
    async pipelineCompile(): Promise<GPUComputePipeline> {
        if (!this.bindGroupCompose) throw new Error("compute BindGroupLayout not initialize.");
        else {
            const shader = device.createShaderModule({
                code: this.command.entryFunction
            });
            const pipelineLayout = device.createPipelineLayout({
                bindGroupLayouts: [this.bindGroupCompose.layout]
            });
            return device.createComputePipelineAsync({
                layout: pipelineLayout,
                compute: {
                    module: shader,
                    entryPoint: this.command.entryPoint ? this.command.entryPoint : "main"
                }
            });
        }
    }
    async GPUCommandBufferCompile(): Promise<GPUCommandBuffer> {
        if (!this.pipeline) this.pipeline = await this.pipelineCompile();
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass();
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroupCompose?.bindGroup);
        pass.end();
        return encoder.finish();
    }
    async submit(commandBuffer: GPUCommandBuffer): Promise<void> {
        device.queue.submit([commandBuffer]);
    }
}

type BlockNodeType = "private" | "public";

class BlockNode {
    static startPoint = 0;
    static runPoint = 0;
    lifeStart: number;
    lifeEnd: number;
    subNodes: Array<BufferNode | CommandNode | BlockNode>;
    subCommandNodes: Array<BufferNode | CommandNode>;
    subData: Array<ResourceOnBindGroup>;
    type: BlockNodeType;
    bindGroupCompose?: BindGroupCompose;
    constructor(type: BlockNodeType) {
        this.type = type;
        this.subNodes = [];
        this.subCommandNodes = [];
        this.subData = [];
        this.lifeEnd = 0;
        this.lifeStart = 0;
    }
    encode() {
        const subCommandNodes: CommandNode[] = [];
        const subData: ResourceOnBindGroup[] = [];
        this.lifeStart = BlockNode.startPoint;
        this.subNodes.forEach((node) => {
            if (node instanceof CommandNode) {
                node.encode(BlockNode.startPoint);
                subCommandNodes.push(node);
                subData.push(...node.command.sourceData);
                BlockNode.startPoint += 1;
            }
            else if (node instanceof BlockNode && node.type === "public") {
                const { nodes, data } = node.encode();
                subCommandNodes.push(...nodes);
                subData.push(...data);
            }
            else if (node instanceof BufferNode) {
                node.encode(BlockNode.startPoint);
                subData.push(...[node.command.aimBuffer, node.command.sourceBuffer]);
                BlockNode.startPoint += 1;
            }
        });
        this.lifeEnd = BlockNode.startPoint;
        return {
            nodes: subCommandNodes,
            data: subData
        }
    }
    initializeCompile() {
        const { nodes, data } = this.encode();
        const map = new Map<VirtualData, ResourceOnBindGroup>;
        // 这里应该还有个缓存区类型转换
        const VBGroup:VirtualBindGroup = {
            vectors:data
        }
        this.bindGroupCompose = VirtualBindGroupMalloc(VBGroup, this.lifeEnd);
        nodes.forEach(node => {
            node.bindGroupCompose = this.bindGroupCompose;
        })
    }
    async GPUCommandBufferCompile() {
        if(!22)
        
    }
}