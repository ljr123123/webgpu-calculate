import { GPUBufferWrapper, GPUBufferGroup } from "./basic/buffer";
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
}