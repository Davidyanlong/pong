export class UniformBuffer {
    public readonly buffer: GPUBuffer;
    constructor(private device: GPUDevice, dataOrLength: Float32Array|number, label: string = "Uniform buffer") {
        
        // if number, we assume byteSize
        if(typeof dataOrLength === "number"){
            this.buffer = device.createBuffer({
                label,
                size: dataOrLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
        }else{
            this.buffer = device.createBuffer({
                label,
                size: dataOrLength.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            this.update(dataOrLength);
        }
        
      
    }
    public update(data: Float32Array,bufferoffset: number = 0) {
        this.device.queue.writeBuffer(this.buffer, bufferoffset, data.buffer);
    }
}