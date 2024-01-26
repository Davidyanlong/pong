import { GeometryBuffers } from "./attribute_buffers/GeometryBuffers";
import { GeometryBuilder } from "./geometry/GeometryBuilder";
import { Color } from "./math/Color";
import { Vec2 } from "./math/Vec2";
import { UnlitRenderPipeline } from "./render_pipelines/UnlitRenderPipeline";
import { Texture2D } from "./texture/Texture2D";


async function loadImage(path: string): Promise<HTMLImageElement> {

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = path;
    image.onload = () => resolve(image);
    image.onerror = () => reject;
  })

}


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


  const unlitPipeline = new UnlitRenderPipeline(device)
  const geometry = new GeometryBuilder().createQuadGeometry()
  const geometryBuffer = new GeometryBuffers(device, geometry)
  const image = await loadImage('./assets/test_texture.jpeg')
  unlitPipeline.diffuseTexture = await Texture2D.create(device, image);

  unlitPipeline.textureTilling = new Vec2(3, 3)
  // unlitPipeline.diffuseColor = new Color(1, 0, 0, 1)

  const draw = () => {

    const commandEncoder = device.createCommandEncoder();

    const renderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: gpuContext.getCurrentTexture().createView(),
        storeOp: "store",
        clearValue: { r: 0.8, g: 0.8, b: 0.8, a: 1.0 },
        loadOp: "clear"
      }]
    });

    // draw here

    unlitPipeline.draw(renderPassEncoder, geometryBuffer);
    renderPassEncoder.end();
    device.queue.submit([
      commandEncoder.finish()
    ]);

    requestAnimationFrame(draw);
  }

  draw();

}

init()