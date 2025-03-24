import { ResourceOnBindGroup, VirtualData } from "../basic/GE2";
import { BindGroupCollector, ComputeNode } from "../basic/node2.test";
import { type } from "../basic/type";

export async function add() {
    const collector = new BindGroupCollector(() => {});
    const sources:ResourceOnBindGroup[] = [
        {
            data:{
                label:"source",
                byteLength:400,
                type:type.array(type.float32, 100),
                lifeStart:0,
                lifeEnd:0
            },
            bufferLayout:{
                type:"storage"
            }  
        },
        {
            data:{
                label:"aim",
                byteLength:400,
                type:type.array(type.float32, 100),
                lifeStart:0,
                lifeEnd:0
            },
            bufferLayout:{
                type:"storage"
            }  
        }
    ]
    console.log("...");
    const computeNode = new ComputeNode({
        options:{
            entryFunction:`let index = global_id.x;\naim[index] = aim[index] + source[index];`,
            sources:sources,
            workgroup_size:[400/4, 1, 1],
            dispatchWorkGroups:[1, 1, 1],
            global_id:{
                label:"global_id",
                range:100
            }
        }
    }, collector);
    collector.addComputeNode(computeNode);
    await collector.run();
}