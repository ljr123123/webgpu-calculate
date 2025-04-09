import { BufferWithLayoutEntry } from "../../type/WebgpuType";
import { WGSLCompileOption } from "../compile";

export function optionInit(device: GPUDevice, variables: BufferWithLayoutEntry[]): WGSLCompileOption {
    const range = (variables[0].virtual.byteLength / 4);
    const globalId_X = Math.ceil(range / 8);
    const main = `
    let index = globalId.x + globalId.y * ${globalId_X};
    if(index >= ${range}) { return; }
    ${variables[2].virtual.label}[index] = ${variables[0].virtual.label} + ${variables[1].virtual.label};
    `;
    return {
        variables: variables,
        entryPoint: "main",
        otherFunctions: [],
        main: main,
        dispatchWorkGroups: [],
        globalId: {
            label: "globalId",
            range: [8, 8, 1]
        }
    }
}