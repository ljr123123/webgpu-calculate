import { VirtualDataWithLayout, WGSLOptions } from "./shader";
import { VirtualData } from "./virtualData";



export class Order{
    constructor(){}
    encode(...args:any[]):any{}
    async compile(...args:any[]):Promise<any>{}
    async run(...args:any[]):Promise<any>{}
}

class ComputeOrder extends Order {
    virtualDatas:Set<VirtualData>;
    options:WGSLOptions;
    shader?:GPUShaderModule | undefined;
    constructor(options:WGSLOptions) {
        super();
        this.virtualDatas = new Set();
        this.options = options;
        this.addVirtualDataByGroup(options.datas);
    }
    private addVirtualData(data:VirtualData, layout:GPUBufferBindingLayout) {
        this.virtualDatas.add(data);
        data.addBindingLayouts(this, layout);
    }
    public addVirtualDataByGroup(group:VirtualDataWithLayout[]) {
        group.forEach(element => {
            this.addVirtualData(element.data, element.bindingLayout);
        })
    }
    
    encode(){
        return [...this.virtualDatas];
    }
}

interface ResourceBinding {
    data:VirtualData;
    offset:number;
    size:number;
}

class TransOrder extends Order {
    source:ResourceBinding;
    aim:ResourceBinding;
    constructor(source:ResourceBinding, aim:ResourceBinding) {
        super();
        this.source = source;
        this.aim = aim;
    }

    override encode() {
        return [this.source.data, this.aim.data];
    }
}

class ReadOrder extends Order {

}

class WriteOrder extends Order {

}

class BlockOrder extends Order {

}

class ParallelGroup {
    subOrders:Order[];
    constructor() {
        this.subOrders = [];
    }
}