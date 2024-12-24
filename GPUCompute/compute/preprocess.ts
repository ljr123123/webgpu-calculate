import { GPUBufferGroup } from "../basic/buffer";
import { ComputeGroup } from "../basic/computeGroup";
class Scaler {
    fit(group:GPUBufferGroup){}
    transform(){}
    fit_transform(){}
};

class StandScaler extends Scaler{
    variance:GPUBufferGroup;
    mean:GPUBufferGroup;
    constructor(){
        super();
    }
    fit(group:GPUBufferGroup) {
        const computeGroup = new ComputeGroup({
            parallel:1,
            setting:{
                main:`
                let index = globalId.x * 32 + localId.x;

                `,
                workgroup_size_X:1,
                workgroup_size_Y:1,
                workgroup_size_Z:1,
                bufferGroups:[
                    {
                        name:"mean",
                        bufferGroup:
                    }
                ]
            }
        })
    }
}