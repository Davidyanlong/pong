import { Color } from "../math/Color";
import { Vec3 } from "../math/Vec3";
import { UniformBuffer } from "../uniform_buffers/UniformBuffer";

export class DirectionalLight {
    // 只使用RGB三个颜色值，
    public color = new Color(1,1,1,1);
    public intensity = 1;
    public direction = new Vec3(0,-1,0)

    public buffer: UniformBuffer
    constructor(device:GPUDevice){
        // 4 位的长度为 rgb + intensity
        this.buffer = new UniformBuffer(device, 8*Float32Array.BYTES_PER_ELEMENT, 'DirectionalLight Color Buffer');
    }
    public update(){
            this.buffer.update(new Float32Array([
                this.color.r, 
                this.color.g, 
                this.color.b, 
                this.intensity,
                this.direction.x, 
                this.direction.y, 
                this.direction.z,
                0
            ]));
     }
}