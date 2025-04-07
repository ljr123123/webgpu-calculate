import { device } from "./device";
import { BindGroupLayoutEntry, BufferBinding } from "./type";
import { VirtualData } from "./virtualBuffer.test";
import { WGSLCompile, WGSLCompileOption } from "./WGSLCompile";

export interface VirtualResource {
    data: VirtualData;
    layoutEntry: BindGroupLayoutEntry;
}
export class ComputeOrder {

    virtualResources: Map<VirtualData, BindGroupLayoutEntry> = new Map();

    bindGroup?:GPUBindGroup;

    WGSLCompileOption?: WGSLCompileOption;
    computePipeline?: GPUComputePipeline;

    renderPipeline?: GPURenderPipeline;
    constructor() { }
    setVirtualData(data: VirtualData, entry: BindGroupLayoutEntry) {
        this.virtualResources.set(data, entry);
    }
    solveConflictData() {
        const map = this.virtualResources;
        for (let [selfVirtual, selfLayout] of map.entries()) {
            for (let [virtual, layout] of map.entries()) {
                if (selfVirtual === virtual) continue;
                if (selfLayout.buffer && layout.buffer) {
                    if (selfLayout.buffer.type === layout.buffer.type) continue;
                }
                selfVirtual.conflictData.add(virtual);
            }
        }
    }
    orderInit() {
        const entryGroup: BindGroupLayoutEntry[] = [];
        const bindingGroup: GPUBindGroupEntry[] = [];
        for (let [virtual, entry] of this.virtualResources.entries()) {
            entryGroup.push(entry);
            const binding = virtual.getSourceBinding();
            if(binding === undefined) throw new Error("data not malloc.");
            bindingGroup.push({
                binding: entry.binding,
                resource: binding
            });
        }
        const bindGroupLayout = device.createBindGroupLayout({
            entries: entryGroup
        });
        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });
        const bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: bindingGroup
        });
        return {
            pipelineLayout,
            bindGroup
        }
    }
    setOption(option:WGSLCompileOption) {
        this.WGSLCompileOption = option;
    }
    async computeInit(pipelineLayout: GPUPipelineLayout) {
        if(!this.WGSLCompileOption) throw new Error("WGSL option not set.");
        for (let [virtual, entry] of this.virtualResources.entries()) {
            this.WGSLCompileOption.variables.push({
                data:virtual,
                layoutEntry:entry
            });
        }
        this.WGSLCompileOption.variables.push()
        const WGSLString = WGSLCompile(this.WGSLCompileOption);
        const shader = device.createShaderModule({
            code: WGSLString
        });
        const pipeline = await device.createComputePipelineAsync({
            layout: pipelineLayout,
            compute: {
                module: shader,
                entryPoint: this.WGSLCompileOption.entryPoint ? this.WGSLCompileOption.entryPoint : "main"
            }
        });
        return pipeline;
    }
    async renderInit() { }
}

interface VirtualDataOnOrder {
    virtual:VirtualData;
    malloc:boolean;
    keeping:boolean;
    write:number[];
}

interface OrderDescriptor {
    order:ComputeOrder;
    virtualDataOnOrders:VirtualDataOnOrder[];
}

export class ComputeOrderManager {
    encoder:GPUCommandEncoder;
    orderCommands:OrderDescriptor[] = [];
    linearOrders:ComputeOrder[] = [];
    graphOrders:ComputeOrder[][] = [];
    constructor() {
        this.encoder = device.createCommandEncoder();
    }
    submitEncoder() {
        device.queue.submit([this.encoder.finish()]);
        this.encoder = device.createCommandEncoder();
    }
    async linearOrdersRun(submitOnce?:boolean) {
        const passCompile = async (order:ComputeOrder) => {
            if(!order.computePipeline || !order.bindGroup) {
                const { pipelineLayout, bindGroup } = order.orderInit();
                order.bindGroup = bindGroup;
                order.computePipeline = await order.computeInit(pipelineLayout);
            }
            const pass = this.encoder.beginComputePass();
            pass.setBindGroup(0, order.bindGroup);
            pass.setPipeline(order.computePipeline);
            if(!order.WGSLCompileOption) throw new Error("WGSL compile not setting.");
            pass.dispatchWorkgroups(
                order.WGSLCompileOption.dispatchWorkGroups[0], 
                order.WGSLCompileOption.dispatchWorkGroups[1], 
                order.WGSLCompileOption.dispatchWorkGroups[2], 
            );
            pass.end();
            if(!submitOnce) this.submitEncoder();
        }
        for(let order of this.orderCommands) {
            order.virtualDataOnOrders.forEach(virtual => {
                if(virtual.malloc) virtual.virtual.malloc();
                if(virtual.write.length != 0) {
                    virtual.virtual.write(virtual.write);
                }
            })
            console.log(order)
            await passCompile(order.order);
        }
        if(submitOnce) this.submitEncoder();
    }
    graphOrdersCompile(submitOnce?:boolean) {

    }

    solve() {

    }

}
