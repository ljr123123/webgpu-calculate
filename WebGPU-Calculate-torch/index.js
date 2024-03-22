let device = undefined;
let adapter = undefined;
async function init(){
    adapter = await navigator.gpu?.requestAdapter();
    device = await adapter?.requestDevice();
    if(!adapter) throw new Error("This browser doesn't support WebGPU.")
    return;
}

export {
    init
}