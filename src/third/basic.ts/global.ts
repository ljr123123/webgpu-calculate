import { deviceLimits } from "./device";

const maxStorageBufferBindingSize = deviceLimits.maxStorageBufferBindingSize;

type Performance = "big-buffer" | "small-buffer";

class GlobalBufferController {
    performance:Performance;
    totalDataSize:number[][];
    constructor(performance?:Performance) {
        if(performance) this.performance = performance;
        else this.performance = "big-buffer";
        this.totalDataSize = [];
    }
};

const globalBufferController = new GlobalBufferController();

function calculateSize(controller:GlobalBufferController):void {
    // 假设每个抽象Buffer的元素个数已知 -- 同时dimension也已知
    // 一维数据应该是是 pieceWidth:1, pieceHeight:, pieceX, pieceY, totalWidth:1, totalHeight:Size, join:
}

/*
pieceWidth: number;
pieceHeight: number;
piecesX: number;
piecesY: number;
join: number;
totalWidth: number;
totalHeight: number;
*/