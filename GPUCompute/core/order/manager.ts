import { BufferWithLayoutEntry } from "../type/WebgpuType";
import { ComputeGroupNode, ComputeNode, FunctionNode } from "./singleOrder";

export class SubmitManager {
    device:GPUDevice;
    encoder:GPUCommandEncoder;

    functionNodeMap:Map<string, FunctionNode> = new Map();
    computeGroupNodeMap:Map<string, ComputeGroupNode> = new Map();
    computeNodeMap:Map<string, ComputeNode> = new Map();

    constructor(device:GPUDevice, commandEncoderDescriptor:GPUCommandEncoderDescriptor){
        this.device = device;
        this.encoder = device.createCommandEncoder(commandEncoderDescriptor);
    }
    functionNodeRegister(pipelineKey:string, WGSLMain:string) {
        const functionNode = new FunctionNode(this.device, WGSLMain, pipelineKey);
        this.functionNodeMap.set(pipelineKey, functionNode);
    }
    computeGroupRegister(
        pipelineKey:string,
        composes:BufferWithLayoutEntry[],
        globalId?:{label:string, range:number[]},
        localId?:{label:string, range:number[]}
    ) {
        const key = FunctionNode.getComputeGroupNodeMapKey(pipelineKey, composes);
        const functionNode = this.functionNodeMap.get(pipelineKey);
        if(!functionNode) throw new Error(`Please register functionNode-${pipelineKey}.`)
        
        const computeGroupNode = new ComputeGroupNode(this.device, composes, {

        })
        this.
    }
    singleCompile(
        pipelineKey:string, 
        composes:BufferWithLayoutEntry[], 
        dispatchWorkGroupsCaller?:(...args:any[])=>number[], 
        ...args:any[]
    ) {
        // 判断是不是有一模一样的数据之前已经计算过一次了;
        const firstLevelKey = ComputeGroupNode.getComputeNodeMapKey(pipelineKey, composes.map(c=>{return c.virtual}));
        const computeNode = this.computeNodeMap.get(firstLevelKey);
        if(computeNode) return computeNode.pipelineBindGroupDispatchWorkgroupsInit(dispatchWorkGroupsCaller, args);
        
        // 判断是不是有数据类型一样的数据之前计算过一次了:计算管道可以复用
        const secondLevelKey = FunctionNode.getComputeGroupNodeMapKey(pipelineKey, composes);
        const computeGroup = this.computeGroupNodeMap.get(secondLevelKey);
        
    }
    submitEncoder(commandBufferDescriptor?:GPUCommandBufferDescriptor, commandEncoderDescriptor?:GPUCommandEncoderDescriptor) {
        this.device.queue.submit([this.encoder.finish(commandBufferDescriptor)]);
        this.encoder = this.device.createCommandEncoder(commandEncoderDescriptor);
    }
}