import { GlobalDeviceGroup } from "./global";
import { ComputeOrder } from "./order";
import { createVirtualData, VirtualData } from "./virtualBuffer.test";

export function addTest(a:VirtualData, b:VirtualData, keep_a:boolean = false, keep_b:boolean = false, label_c:string = "c"):VirtualData {
    if(!a.getSourceBinding()) a.malloc();
    if(!b.getSourceBinding()) b.malloc();
    const c = createVirtualData(label_c, a.type, GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE);
    c.malloc();

    const order = new ComputeOrder();
    order.setVirtualData(a, {
        binding:0,
        buffer:{
            type:"read-only-storage",
            hasDynamicOffset:false,
            minBindingSize:0
        },
        visibility:GPUShaderStage.COMPUTE
    });
    order.setVirtualData(b, {
        binding:1,
        buffer:{
            type:"read-only-storage",
            hasDynamicOffset:false,
            minBindingSize:0
        },
        visibility:GPUShaderStage.COMPUTE
    });
    order.setVirtualData(c, {
        binding:2,
        buffer:{
            type:"storage",
            hasDynamicOffset:false,
            minBindingSize:0
        },
        visibility:GPUShaderStage.COMPUTE
    });
    order.setOption({
        variables:[],
        entryPoint:"main",
        main:`
        let x = globalId.x;
        if(x >= 1) { return; }
        ${c.label}[0] = ${a.label}[0] + ${b.label}[0];
        `,
        otherFunctions:[],
        dispatchWorkGroups:[1, 1, 1],
        globalId:{
            label:"globalId",
            range:[1, 1, 1]
        }
    })
    GlobalDeviceGroup.orderManager.orderCommands.push({
        order:order,
        virtualDataOnOrders:[
            {
                virtual:a,
                malloc:true,
                keeping:true,
                write:[1.5, 1.5, 1.5]
            },
            {
                virtual:b,
                malloc:true,
                keeping:true,
                write:[2.0, 2.0, 2.0]
            },
            {
                virtual:c,
                malloc:true,
                keeping:true,
                write:[]
            }
        ]
    })


    if(!keep_a) a.free();
    if(!keep_b) b.free();

    return c;
}