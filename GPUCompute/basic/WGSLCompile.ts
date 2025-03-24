import { ResourceOnBindGroup } from "./GE2";
import { Struct } from "./type";

export interface WGSLOptions {
    entryFunction: string;
    entryPoint?: string;
    sources: ResourceOnBindGroup[];
    workgroup_size: number[];
    local_id?: {
        label: string;
        range: number;
    };
    dispatchWorkGroups: number[];
    global_id?: {
        label: string;
        range: number;
    };
}

export function WGSLCompile(options: WGSLOptions) {
    let WGSL = "";
    // options.sources.forEach(source => {
    //     if(source)
    //     WGSL += ``;
    // })
    options.sources.forEach(source => {
        WGSL += `@group(0) @binding(${source.binding}) `;
        WGSL += `var<${source.bufferLayout.type === "storage" ? "storage, read_write" :
                source.bufferLayout.type === "uniform" ? "uniform" :
                    source.bufferLayout.type === "read-only-storage" ? "storage, read" :
                        "read_write, storage"
            }> `;
        if(typeof source.data.type === "string") WGSL += `${source.data.label}:${source.data.type};\n`;
        else if(source.data.type instanceof Struct) WGSL += `${source.data.label}:${source.data.type.typename};\n`;
        else WGSL += `${source.data.label}:${source.data.type.toWGSL()};\n`;
    });
    WGSL += `@compute @workgroup_size(${options.workgroup_size[0] ? options.workgroup_size[0] : 1
        },${options.workgroup_size[1] ? options.workgroup_size[1] : 1
        },${options.workgroup_size[2] ? options.workgroup_size[2] : 1
        })\n`
    WGSL += `fn ${options.entryPoint ? options.entryPoint : "main"}`;
    WGSL += `(${options.global_id ? `@builtin(global_invocation_id) ${options.global_id.label} : vec3<u32>,` : ""
        }${options.local_id ? `@builtin(local_invocation_id) ${options.local_id.label} : vec3<u32>,` : ""
        }){\n`;
    WGSL += options.entryFunction.concat("\n}\n");
    console.log(WGSL)
    return WGSL;
}