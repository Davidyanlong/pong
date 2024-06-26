import { GeometryBuffers } from "../attribute_buffers/GeometryBuffers";
import { Camera } from "../camera/Camera";
import { ShadowCamera } from "../camera/ShadowCamera";
import { AmbientLight } from "../lights/AmbientLight";
import { DirectionalLight } from "../lights/DirectionalLight";
import { PointLightsCollection } from "../lights/PointLight";
import { Color } from "../math/Color";
import { Vec2 } from "../math/Vec2";
import shaderSource from "../shaders/MaterialShader.wgsl?raw"
import { Texture2D } from "../texture/Texture2D";
import { UniformBuffer } from "../uniform_buffers/UniformBuffer";
export class RenderPipeline {
    private renderPipeline: GPURenderPipeline;
    private materialBindGroupLayout: GPUBindGroupLayout;
    private _camerasViewGroupLayout:GPUBindGroupLayout 

    private materialBindGroup!: GPUBindGroup;
    private _camerasViewBindGroup!: GPUBindGroup;
    private vertexBindGroup!: GPUBindGroup;
    private lightBindGroup!: GPUBindGroup;

    private textureTillingBuffer: UniformBuffer
    private _textureTilling: Vec2 = new Vec2(1, 1);

    private diffuseColorBuffer: UniformBuffer
    private _diffuseColor: Color = Color.white();
    
    private shininessBuffer:UniformBuffer;
    private _shininess = 32;

    private _diffuseTexture!:Texture2D;
    private _shadowTexture!:Texture2D;

    public set camera(camera:Camera){
        if(this._camera != camera){
            this._camera = camera;
            this.createCamerasViewBindGroup()
        }
    }


    constructor(
        private device: 
        GPUDevice, 
        private _camera: Camera, 
        private _shadowCamera: ShadowCamera,
        transformsBuffer: UniformBuffer,
        normalMatrixBuffer: UniformBuffer,
        ambientLight:AmbientLight,
        directionLight:DirectionalLight,
        pointLights:PointLightsCollection
        ) {

        this.textureTillingBuffer = new UniformBuffer(device,
            this._textureTilling,
            "Texture Tilling Buffer");

        this.diffuseColorBuffer = new UniformBuffer(device,
            this._diffuseColor,
            "diffuseColor");

        this.shininessBuffer = new UniformBuffer(device, 
            new Float32Array([this._shininess]),
            "Shininess Buffer");
        


        const shaderModule = device.createShaderModule({
            code: shaderSource
        });


        const bufferLayout: Array<GPUVertexBufferLayout> = []
        bufferLayout.push({
            arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
            stepMode: "vertex",
            attributes: [{
                shaderLocation: 0,
                offset: 0,
                format: "float32x3"
            }]
        })

        bufferLayout.push({
            arrayStride: 4 * Float32Array.BYTES_PER_ELEMENT,
            stepMode: "vertex",
            attributes: [{
                shaderLocation: 1,
                offset: 0,
                format: "float32x4"
            }]
        })

        bufferLayout.push({
            arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
            stepMode: "vertex",
            attributes: [{
                shaderLocation: 2,
                offset: 0,
                format: "float32x2"
            }]
        })

        bufferLayout.push({
            arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
            stepMode: "vertex",
            attributes: [{
                shaderLocation: 3,
                offset: 0,
                format: "float32x3"
            }]
        })

        const vertexGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "uniform"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "uniform"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "uniform"
                    }
                }
            ]
        })

        // The project view group -for camera
         this._camerasViewGroupLayout = device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: "uniform"
                }
            },{
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: "uniform"
                }
            },{
                binding: 2,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: "uniform"
                }
            }
        ]
        })


        this.materialBindGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}

                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform"
                    }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform"
                    }
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: "depth"
                    }
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: "comparison"
                    }

                },
            ]
        })

        const lightsGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform"
                    }
                },
                
            ]
        })


        const layout = device.createPipelineLayout({
            bindGroupLayouts: [
                vertexGroupLayout,          // group 0
                this._camerasViewGroupLayout,    // group 1
                this.materialBindGroupLayout,         // group 2
                lightsGroupLayout              // group 3
            ]
        });

        this.renderPipeline = device.createRenderPipeline({
            layout: layout,
            label: "Render Pipeline",
            vertex: {
                module: shaderModule,
                entryPoint: "materialVS",
                buffers: bufferLayout
            },
            fragment: {
                module: shaderModule,
                entryPoint: "materialFS",
                targets: [{
                    format: "bgra8unorm"
                }]
            },
            // CONFIGURE DEPTH
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less",
                format: "depth32float"
            }
        });
        this.diffuseTexture = Texture2D.createEmpty(device);

        this.vertexBindGroup = device.createBindGroup({
            layout: vertexGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: transformsBuffer.buffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: normalMatrixBuffer.buffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.textureTillingBuffer.buffer
                    }
                }
            ]
        });

        this.createCamerasViewBindGroup()

       

        this.lightBindGroup = device.createBindGroup({
            label: "Lights Bind Group",
            layout: lightsGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: ambientLight.buffer.buffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: directionLight.buffer.buffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: pointLights.buffer.buffer
                    }
                }
            ]
        });
    }

    private createCamerasViewBindGroup(){
        this._camerasViewBindGroup = this.device.createBindGroup({
            layout: this._camerasViewGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this._camera.buffer.buffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this._camera.eyeBuffer.buffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this._shadowCamera.buffer.buffer
                    }
                }
            ]
        })
    }

    public set shininess(value:number){
        this._shininess = value;
        this.shininessBuffer.update(new Float32Array([value]));
    }

    public set diffuseTexture(texture: Texture2D) {
        this._diffuseTexture = texture;
        if(this._diffuseTexture !=null && this._shadowTexture !=null){
            this.materialBindGroup = this.createMaterialBindGroup(this._diffuseTexture, this._shadowTexture);
        }
    }
    public set diffuseColor(value: Color) {
        this._diffuseColor = value;
        this.diffuseColorBuffer.update(value)
    }

    public set textureTilling(value: Vec2) {
        this._textureTilling = value;
        this.textureTillingBuffer.update(value);
    }

    public set shadowTexture(texture:Texture2D){
        this._shadowTexture = texture;
        if(this._diffuseTexture!=null && this._shadowTexture!=null){
            this.materialBindGroup = this.createMaterialBindGroup(this._diffuseTexture,  this._shadowTexture);
        }
    }

    private createMaterialBindGroup(texture: Texture2D, shadowTexture:Texture2D) {
        return this.device.createBindGroup({
            layout: this.materialBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: texture.texture.createView()
                },
                {
                    binding: 1,
                    resource: texture.sampler
                },
                {
                    binding: 2,
                    resource: {
                        buffer:this.diffuseColorBuffer.buffer
                    }

                },
                {
                    binding: 3,
                    resource: {
                        buffer:this.shininessBuffer.buffer
                    }

                },
                {
                    binding: 4,
                    resource: shadowTexture.texture.createView()
                },
                {
                    binding: 5,
                    resource: shadowTexture.sampler
                },
            ]
        })
    }

    public draw(
        renderPassEncoder: GPURenderPassEncoder, 
        buffers: GeometryBuffers,
        instanceCount: number = 1) {
        renderPassEncoder.setPipeline(this.renderPipeline);
        renderPassEncoder.setVertexBuffer(0, buffers.positonBuffer)
        renderPassEncoder.setVertexBuffer(1, buffers.colorsBuffer!)
        renderPassEncoder.setVertexBuffer(2, buffers.texCoordsBuffer!)
        renderPassEncoder.setVertexBuffer(3, buffers.normalsBuffer!)
        

        renderPassEncoder.setBindGroup(0, this.vertexBindGroup)
        renderPassEncoder.setBindGroup(1, this._camerasViewBindGroup)
        renderPassEncoder.setBindGroup(2, this.materialBindGroup)
        renderPassEncoder.setBindGroup(3, this.lightBindGroup)

        // draw with index buffer
        if (buffers.indicesBuffer) {
            renderPassEncoder.setIndexBuffer(buffers.indicesBuffer, 'uint16');
            renderPassEncoder.drawIndexed(buffers.indexCount!, instanceCount, 0, 0, 0);
        } else {
            renderPassEncoder.draw(buffers.vertexCount, instanceCount, 0, 0);
        }



    }
}