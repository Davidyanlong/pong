import { GeometryBuffers } from "./attribute_buffers/GeometryBuffers";
import { Camera } from "./camera/Camera";
import { GeometryBuilder } from "./geometry/GeometryBuilder";
import { Color } from "./math/Color";
import { Mat4x4 } from "./math/Mat4x4";
import { Vec2 } from "./math/Vec2";
import { Vec3 } from "./math/Vec3";
import { UnlitRenderPipeline } from "./render_pipelines/UnlitRenderPipeline";
import { Texture2D } from "./texture/Texture2D";
import { UniformBuffer } from "./uniform_buffers/UniformBuffer";


async function loadImage(path: string): Promise<HTMLImageElement> {

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = path;
    image.onload = () => resolve(image);
    image.onerror = () => reject;
  })

}


let position = 0;

async function init() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const gpuContext = canvas.getContext('webgpu') as GPUCanvasContext;
  if (!gpuContext) {
    alert('webgpu is not supported');
    return;
  }

  const adapter = await navigator.gpu.requestAdapter();

  const device = await adapter!.requestDevice();

  gpuContext.configure({
    device: device,
    format: "bgra8unorm"
  });

  // DEPTH TEXTURE
  const depthTextue = device.createTexture({
    label: "depth Textue",
    size: {
      width: canvas.width,
      height: canvas.height
    },
    format: "depth32float",
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  })

  // TRANSFORMS BUFFER
  const transformsBubffer = new UniformBuffer(device, 100 * Mat4x4.BYTE_SIZE, "Transforms Buffer");

  const trans = Mat4x4.translation(0, 0, 3)
  transformsBubffer.update(trans)


  const camera = new Camera(device);
  const view = Mat4x4.lookAt(new Vec3(0,3,0), new Vec3(0,0,3),new Vec3(0,1,0))
  const prespective = Mat4x4.perspective(60, canvas.width / canvas.height, 0.01, 30);
  camera.projectionView = Mat4x4.multiply(prespective, view);
  const unlitPipeline = new UnlitRenderPipeline(device, camera, transformsBubffer)

  const geometry = new GeometryBuilder().createCubeGeometry()
  const geometryBuffer = new GeometryBuffers(device, geometry)
  const image = await loadImage('./assets/test_texture.jpeg')
  unlitPipeline.diffuseTexture = await Texture2D.create(device, image);
  unlitPipeline.textureTilling = new Vec2(1, 1)
  // unlitPipeline.diffuseColor = new Color(1, 0, 0, 1)


  const draw = () => {

    const commandEncoder = device.createCommandEncoder();

    const renderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: gpuContext.getCurrentTexture().createView(),
        storeOp: "store",
        clearValue: { r: 0.8, g: 0.8, b: 0.8, a: 1.0 },
        loadOp: "clear"
      }],
      // CONFIGURE DEPTH
      depthStencilAttachment: {
        view: depthTextue.createView(),
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1.0,
      }
    });

    // draw here
    position += 0.01;

    const view = Mat4x4.lookAt(new Vec3(position, 3, position), new Vec3(0,0,3),new Vec3(0,1,0))
  const prespective = Mat4x4.perspective(60, canvas.width / canvas.height, 0.01, 30);
  camera.projectionView = Mat4x4.multiply(prespective, view);

    unlitPipeline.draw(renderPassEncoder, geometryBuffer, 1);

    renderPassEncoder.end();
    device.queue.submit([
      commandEncoder.finish()
    ]);

    requestAnimationFrame(draw);
  }

  draw();

}

init()