import { GPUBufferWrapper } from "./buffer";
import { device } from "./device";

// globalController

interface ComputeStep {
    nextStep?:ComputeStep;
    bufferGroup
}