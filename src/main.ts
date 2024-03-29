import { GeometryBuffersCollection } from "./attribute_buffers/GeometryBuffersCollection";
import { Camera } from "./camera/Camera";
import { Ball } from "./game_objects/Ball";
import { Floor } from "./game_objects/Floor";
import { Paddle } from "./game_objects/Paddle";
import { InputManager } from "./input/InputManager";
import { AmbientLight } from "./lights/AmbientLight";
import { DirectionalLight } from "./lights/DirectionalLight";
import { PointLightsCollection } from "./lights/PointLight";
import { Color } from "./math/Color";
import { Mat4x4 } from "./math/Mat4x4";
import { Vec3 } from "./math/Vec3";
import { Texture2D } from "./texture/Texture2D";
import { UniformBuffer } from "./uniform_buffers/UniformBuffer";




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

  GeometryBuffersCollection.initialize(device);

  const inputManager = new InputManager()

  // DEPTH TEXTURE
  const depthTextue = Texture2D.createDepthTexture(device, canvas.width, canvas.height);

  // TRANSFORMS BUFFER
  const transformsBubffer = new UniformBuffer(device, 100 * Mat4x4.BYTE_SIZE, "Transforms Buffer");

  const trans = Mat4x4.translation(0, 0, 0)
  transformsBubffer.update(trans)

  // Light 
  const ambientLight = new AmbientLight(device);
  ambientLight.color = new Color(1,1,1,1);
  ambientLight.intensity = 0.5;

  const directionalLight = new DirectionalLight(device);
  directionalLight.color = new Color(1,1,1,1);
  directionalLight.intensity = 1;
  directionalLight.direction = new Vec3(0,0,1);

  const pointLights = new PointLightsCollection(device);
  // 点光源 红灯
  pointLights.lights[0].color = new Color(1, 0, 0, 1);
  pointLights.lights[0].intensity = 2;
  pointLights.lights[0].position = new Vec3(4, 2, -1);
  // 点光源 绿地
  pointLights.lights[1].color = new Color(0, 1, 0, 1);
  pointLights.lights[1].intensity = 2;
  pointLights.lights[1].position = new Vec3(-4, 2, -1);
  pointLights.lights[1].attenConst = 0.2;
  pointLights.lights[1].attenLinear = 0.01;
  pointLights.lights[1].attenQuad = 0.1;
  // 点光源 蓝灯
  pointLights.lights[2].color = new Color(0, 0, 1, 1);
  pointLights.lights[2].intensity = 2;
  pointLights.lights[2].position = new Vec3(2, -4, -1);

  // GAME OBJECT
  const camera = new Camera(device, canvas.width/canvas.height);
  camera.eye = new Vec3(0, 0, -20);
  const paddle1 = new Paddle(device, inputManager, camera, ambientLight, directionalLight, pointLights)
  paddle1.position.x = -5;
  paddle1.color = new Color(1, 0.3, 0.3, 1);

  const paddle2 = new Paddle(device, inputManager, camera, ambientLight, directionalLight, pointLights)
  paddle2.position.x = 5;
  paddle2.color = new Color(0.3, 0.3, 1, 1);

  const ball = new Ball(device, camera,ambientLight, directionalLight, pointLights);
  const floor = new Floor(device, camera, ambientLight, directionalLight, pointLights);


  const update = ()=>{
    ambientLight.update()
    directionalLight.update();
    camera.update();
    paddle1.update();
    paddle2.update();
    ball.update();
    floor.update();
    pointLights.update();
  }

  const draw = () => {

    update();

    const commandEncoder = device.createCommandEncoder();

    const renderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: gpuContext.getCurrentTexture().createView(),
        storeOp: "store",
        clearValue: { r: 0.4, g: 0.9, b: 0.9, a: 1.0 },
        loadOp: "clear"
      }],
      // CONFIGURE DEPTH
      depthStencilAttachment: {
        view: depthTextue.texture.createView(),
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1.0,
      }
    });


    // DRAW HERE
    paddle1.draw(renderPassEncoder);
    paddle2.draw(renderPassEncoder);
    ball.draw(renderPassEncoder);
    floor.draw(renderPassEncoder);

    renderPassEncoder.end();
    device.queue.submit([
      commandEncoder.finish()
    ]);

    requestAnimationFrame(draw);
  }

  draw();

}

init()