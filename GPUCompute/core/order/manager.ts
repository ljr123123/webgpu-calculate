import { PipelineOrder } from "./singleOrder";

export class OrderManager {
    device:GPUDevice;
    encoder:GPUCommandEncoder;
    linearOrders:PipelineOrder[] = [];
    graphOrders:PipelineOrder[][] = [];
    constructor(device:GPUDevice) {
        this.device = device;
        this.encoder = device.createCommandEncoder();
    }
    submitEncoder() {
        this.device.queue.submit([this.encoder.finish()]);
        this.encoder = this.device.createCommandEncoder();
    }
    async linearOrdersRun(submitOnce?:boolean) {
        const passCompile = async (order:PipelineOrder) => {

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
        for(let order of this.linearOrders) {
            order.solveConflictData();
            await passCompile(order);
        }
        if(submitOnce) this.submitEncoder();
    }
    graphOrdersCompile(submitOnce?:boolean) {

    }

    solve() {

    }

}