import { GPUBufferWrapper, GPUBufferGroup } from "./basic/buffer";
import { WGSLCompose } from "./basic/computeGroup";
export async function test() {
    const group = new GPUBufferGroup({
        shape:[3,4,5],
        type:"float32",
        data:[
            [
                [0, 1, 2, 3, 4],
                [1, 2, 3, 4, 5],
                [2, 3, 4, 5, 6],
                [3, 4, 5, 6, 7]
            ],
            [
                [0, 1, 2, 3, 4],
                [1, 2, 3, 4, 5],
                [2, 3, 4, 5, 6],
                [3, 4, 5, 6, 7]
            ],
            [
                [0, 1, 2, 3, 4],
                [1, 2, 3, 4, 5],
                [2, 3, 4, 5, 6],
                [3, 4, 5, 6, 7]
            ]
        ]
    });
    const result = await group.read();
    console.log(result);

WGSLCompose({
        main:"let index = global_id.x;",
        workgroup_size_X:1,
        workgroup_size_Y:1,
        workgroup_size_Z:1,
        global_id:true,
        local_id:true,
        bufferGroups:[{
            name:"group",
            bufferGroup:group
        }],
        STATIC:[
            {
                buffer:new GPUBufferWrapper({length:1,type:"float32"}),
                name:"STATIC"
            }
        ]
    })
}