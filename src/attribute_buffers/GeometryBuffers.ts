import { Geometry } from "../geometry/Geometry";

export class GeometryBuffers {
    public readonly positonBuffer: GPUBuffer;
    public readonly indicesBuffer?: GPUBuffer;
    public readonly colorsBuffer?: GPUBuffer;
    public readonly texCoordsBuffer?:GPUBuffer;

    public readonly vertexCount: number;
    public readonly indexCount?: number;
    constructor(device: GPUDevice, geometry: Geometry) {
        this.positonBuffer = device.createBuffer({
            label: "Position Buffer",
            size: geometry.positions.length * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        })
        device.queue.writeBuffer(this.positonBuffer,
            0,
            geometry.positions.buffer,
            0,
            geometry.positions.byteLength);
        this.vertexCount = geometry.positions.length / 3


        // INDICES
        if (geometry.indices.length > 0) {
            this.indicesBuffer = device.createBuffer({
                label: "Indices Buffer",
                size: geometry.indices.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
            });

            device.queue.writeBuffer(this.indicesBuffer,
                0,
                geometry.indices.buffer,
                0,
                geometry.indices.byteLength);

            this.indexCount = geometry.indices.length
        }

        // COLORS
        if (geometry.colors.length > 0) {
            this.colorsBuffer = device.createBuffer({
                label: 'Color Buffer',
                size: geometry.colors.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
            });

            device.queue.writeBuffer(this.colorsBuffer,
                0,
                geometry.colors.buffer,
                0,
                geometry.colors.byteLength);
        }

        // TEXCORRDS
        if (geometry.texCoords.length > 0) {
            this.texCoordsBuffer = device.createBuffer({
                label: 'texCoords Buffer',
                size: geometry.colors.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
            });

            device.queue.writeBuffer(this.texCoordsBuffer,
                0,
                geometry.texCoords.buffer,
                0,
                geometry.texCoords.byteLength);
        }
    }
}