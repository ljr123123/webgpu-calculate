import { toWGSLVariableType, Type } from "../type";
import { BufferWithLayoutEntry } from "../type/WebgpuType";

export interface WGSLCompileOption {
    main:string;
    otherFunctions:string[];
    globalId?:{
        label:string;
        range:number[];
    };
    localId?:{
        label:string;
        range:number[];
    }
}

export function WGSLCompile(registerVariables:{label:string, binding:number}[], options: WGSLCompileOption, variables:BufferWithLayoutEntry[]) {
    let WGSL = "";
    variables.forEach(source => {
        WGSL += `@group(0) @binding(${source.layoutEntry.binding}) `;
        WGSL += `var<${source.layoutEntry.buffer!.type === "storage" ? "storage, read_write" :
            source.layoutEntry.buffer!.type === "uniform" ? "uniform" :
            source.layoutEntry.buffer!.type === "read-only-storage" ? "storage, read" :
                        "read_write, storage"
            }> `;
        WGSL += ` ${source.virtual.label}:${toWGSLVariableType(source.virtual.WGSLType)};\n`;
    });
    WGSL += `@compute @workgroup_size(${options.globalId ? options.globalId.range[0] : 1
        },${options.globalId ? options.globalId.range[1] : 1
        },${options.globalId ? options.globalId.range[2] : 1
        })\n`
    WGSL += `fn main`;
    WGSL += `(${options.globalId ? `@builtin(global_invocation_id) ${options.globalId.label} : vec3<u32>,` : ""
        }${options.localId ? `@builtin(local_invocation_id) ${options.localId.label} : vec3<u32>,` : ""
        }){\n`;
    WGSL += options.main.concat("\n}\n");
    // console.log(WGSL)
    return WGSL;
}