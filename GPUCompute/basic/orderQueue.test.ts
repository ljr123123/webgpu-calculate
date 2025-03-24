import { VirtualData } from "./GE2";
import { WGSLOptions } from "./WGSLCompile";

class ResourcesCollector {}

class Order {
    collector:ResourcesCollector;
    nextOrder?:Order;
    prevOrder?:Order;
    constructor(collector:ResourcesCollector) {
        this.collector = collector;
    }
    encode(...args:any[]):any {}
    async compile(...args:any[]):Promise<any> {}
    async run(...args:any):Promise<any> {}
}

class ComputeOrder extends Order {
    options:WGSLOptions;
    pipeline?:GPUComputePipeline;
    constructor(options:WGSLOptions, collector:ResourcesCollector) {
        super(collector);
        this.options = options;
    }
}

interface GPUBufferPositionOption {
    label:"buffer";
    offset?:number;
    buffer:GPUBuffer;
}

interface VirtualDataPositionOption {
    label:"data";
    offset?:number;
    data:VirtualData;
}

type PositionOption = GPUBufferPositionOption | VirtualDataPositionOption;

class MoveOrder extends Order {
    source:PositionOption;
    destination:PositionOption;
    constructor(source:PositionOption, destination:PositionOption, collector:ResourcesCollector) {
        super(collector);
        this.source = source;
        this.destination = destination;
    }
}

class WriteOrder extends Order {
    destination:PositionOption;
    data:ArrayBuffer | ArrayBufferView;
    constructor(destination:PositionOption, data:ArrayBuffer | ArrayBufferView, collector:ResourcesCollector) {
        super(collector);
        this.destination = destination;
        this.data = data;
    }
}

class ReadOrder extends Order {
    source:PositionOption;
    constructor(source:PositionOption, collector:ResourcesCollector) {
        super(collector);
        this.source = source;
    }
}

class BranchOrder extends Order {
    subCollector:ResourcesCollector;
    constructor(collector:ResourcesCollector) {
        super(collector);
        this.subCollector = new ResourcesCollector();
    }
    async check(...args:any[]):Promise<boolean> {
        return true;
    }
}

class 