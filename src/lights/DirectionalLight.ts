import { Color } from "../math/Color";
import { Vec3 } from "../math/Vec3";
import { UniformBuffer } from "../uniform_buffers/UniformBuffer";

export class DirectionalLight {
    // 只使用RGB三个颜色值，
    public color = Color.white();
    public intensity = 1;
    public direction = new Vec3(0,-1,0)
    public specularColor = Color.white();
    public specularIntensity = 1;

    public buffer: UniformBuffer
    constructor(device:GPUDevice){
        const byteSize =  12 * Float32Array.BYTES_PER_ELEMENT;
        // 4 位的长度为 rgb + intensity
        this.buffer = new UniformBuffer(device, byteSize, 'DirectionalLight Color Buffer');
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
                0,
                this.specularColor.r, 
                this.specularColor.g, 
                this.specularColor.b, 
                this.specularIntensity,
            ]));
     }
}