import { VirtualData } from "./virtualData.test";

export class BufferManager {
    device_GPU:GPUDevice;
    conflictMap:Map<string, boolean>;
    constructor(device:GPUDevice) {
        this.device_GPU = device;
        this.conflictMap = new Map();
    }

    getConflictKey(v1:VirtualData, v2:VirtualData) {
        if(v1.dataIndex > v2.dataIndex) return `${v2.dataIndex}-${v1.dataIndex}`;
        else return `${v1.dataIndex}-${v2.dataIndex}`;
    }
} 