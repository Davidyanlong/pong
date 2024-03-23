import { Color } from "../math/Color";
import { Vec3 } from "../math/Vec3";
import { UniformBuffer } from "../uniform_buffers/UniformBuffer";

export class PointLight {
    public color = Color.white()
    public intensity = 1;
    public position = new Vec3(0, 0, 0);
    public attenConst = 1;
    public attenLinear = 0.1;
    public attenQuad = 0.032;
}

export class PointLightsCollection {
    public buffer: UniformBuffer;

    public lights: PointLight[] = [
        new PointLight(),
        new PointLight(),
        new PointLight()
    ]

    constructor(device: GPUDevice) {
        const byteSize = 3 * 12 * Float32Array.BYTES_PER_ELEMENT;
        this.buffer = new UniformBuffer(device, byteSize, "Point Lights");
    }

    public update() {

        for (let i = 0; i < this.lights.length; i++) {

            const data = new Float32Array([
                // 颜色
                this.lights[i].color.r,
                this.lights[i].color.g,
                this.lights[i].color.b,
                // 强度
                this.lights[i].intensity,
                // 位置
                this.lights[i].position.x,
                this.lights[i].position.y,
                this.lights[i].position.z,
                // 常数项
                this.lights[i].attenConst,
                // 一次线性参数
                this.lights[i].attenLinear,
                // 二次参数
                this.lights[i].attenQuad,
                0,
                0

            ])

            this.buffer.update(data, i * 12 * Float32Array.BYTES_PER_ELEMENT);
        }


    }
}