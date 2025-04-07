// @ts-nocheck

export class BufferManager {
    public numUsedBuffers = 0;
    public numFreeBuffers = 0;
    private freeBuffers: Map<string, GPUBuffer[]> = new Map();
    private usedBuffers: Map<string, GPUBuffer[]> = new Map();
  
    public numBytesUsed = 0;
    public numBytesAllocated = 0;
  
    constructor(private device: GPUDevice) {}
  
    acquireBuffer(
        size: number, usage: GPUBufferUsageFlags, mappedAtCreation = false,
        reuse = true) {
      let buffer;
      const key = getBufferKey(size, usage);
  
      if (reuse) {
        if (!this.freeBuffers.has(key)) {
          this.freeBuffers.set(key, []);
        }

        if (this.freeBuffers.get(key).length > 0) {
          buffer = this.freeBuffers.get(key).pop();
          this.numFreeBuffers--;
        } else {
          buffer = this.device.createBuffer({size, usage, mappedAtCreation});
          this.numBytesAllocated += size;
        }
      } else {
        buffer = this.device.createBuffer({size, usage, mappedAtCreation});
        this.numBytesAllocated += size;
      }
  
      if (!this.usedBuffers.has(key)) {
        this.usedBuffers.set(key, []);
      }
      this.usedBuffers.get(key).push(buffer);
      this.numUsedBuffers++;
      this.numBytesUsed += size;
  
      return buffer;
    }
  
    releaseBuffer(buffer: GPUBuffer, reuse = true) {
      if (this.freeBuffers.size === 0) {
        return;
      }
  
      const size = buffer.size;
      const usage = buffer.usage;
  
      const key = getBufferKey(size, usage);
      const bufferArray = this.usedBuffers.get(key);
      const index = bufferArray.indexOf(buffer);
      if (index < 0) {
        throw new Error('Cannot find the buffer in buffer manager');
      }
      bufferArray[index] = bufferArray[bufferArray.length - 1];
      bufferArray.pop();
      this.numUsedBuffers--;
      this.numBytesUsed -= size;
  
      if (reuse) {
        this.freeBuffers.get(key).push(buffer);
        this.numFreeBuffers++;
      } else {
        buffer.destroy();
        this.numBytesAllocated -= size;
      }
    }
  
    getNumUsedBuffers(): number {
      return this.numUsedBuffers;
    }
  
    getNumFreeBuffers(): number {
      return this.numFreeBuffers;
    }
  
    dispose() {
      this.freeBuffers.forEach((buffers, key) => {
        buffers.forEach(buffer => {
          buffer.destroy();
        });
      });
  
      this.usedBuffers.forEach((buffers, key) => {
        buffers.forEach(buffer => {
          buffer.destroy();
        });
      });
  
      this.freeBuffers = new Map();
      this.usedBuffers = new Map();
      this.numUsedBuffers = 0;
      this.numFreeBuffers = 0;
      this.numBytesUsed = 0;
      this.numBytesAllocated = 0;
    }
  }
  
  function getBufferKey(size: number, usage: GPUBufferUsageFlags) {
    return `${size}_${usage}`;
  }