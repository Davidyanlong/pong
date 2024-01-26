export class UniformBuffer {
    public readonly buffer: GPUBuffer;
    constructor(private device: GPUDevice, data: Float32Array, label: string = "Uniform buffer") {
        this.buffer = device.createBuffer({
            label,
            size: data.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.update(data);
    }
    public update(data: Float32Array) {
        this.device.queue.writeBuffer(this.buffer, 0, data.buffer);
    }
}