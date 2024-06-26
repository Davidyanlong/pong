import { GeometryBuffersCollection } from "./attribute_buffers/GeometryBuffersCollection";
import { Camera } from "./camera/Camera";
import { ShadowCamera } from "./camera/ShadowCamera";
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
  const depthTexture = Texture2D.createDepthTexture(device, canvas.width, canvas.height);
  const shadowTexture = Texture2D.createShadowTexture(device, 1024, 1024);

  // TRANSFORMS BUFFER
  const transformsBubffer = new UniformBuffer(device, 100 * Mat4x4.BYTE_SIZE, "Transforms Buffer");

  const trans = Mat4x4.translation(0, 0, 0)
  transformsBubffer.update(trans)

  // Light 
  const ambientLight = new AmbientLight(device);
  ambientLight.color = new Color(1, 1, 1, 1);
  ambientLight.intensity = 0.5;

  const directionalLight = new DirectionalLight(device);
  directionalLight.color = new Color(1, 1, 1, 1);
  directionalLight.intensity = 1;
  directionalLight.direction = new Vec3(0, 0, 1);


  const pointLights = new PointLightsCollection(device);
  // 点光源 红灯
  pointLights.lights[0].color = new Color(1, 0, 0, 1);
  pointLights.lights[0].intensity = 2;
  pointLights.lights[0].specularIntensity = 16;
  pointLights.lights[0].specularColor = Color.red();
  pointLights.lights[0].position = new Vec3(4, 2, -1);

  // 点光源 绿地
  pointLights.lights[1].color = new Color(0, 1, 0, 1);
  pointLights.lights[1].intensity = 2;
  pointLights.lights[1].position = new Vec3(-4, 2, -1);

  // 点光源 蓝灯
  pointLights.lights[2].color = new Color(0, 0, 1, 1);
  pointLights.lights[2].intensity = 2;
  pointLights.lights[2].position = new Vec3(2, -4, -1);
  // pointLights.lights[2].attenConst = 0.4;
  // pointLights.lights[2].attenLinear = 0.08;
  // pointLights.lights[2].attenQuad = 0.001;

  // GAME OBJECT

  // - CAMERA
  const camera = new Camera(device, canvas.width / canvas.height);
  camera.eye = new Vec3(0, 0, -20);
  const shadowCamera = new ShadowCamera(device)
  shadowCamera.eye = new Vec3(0, 0, -20);

  const halfHeight = canvas.height / 2;

  const playerCamera = new Camera(device, canvas.width/halfHeight);
  playerCamera.eye = new Vec3(-16, 0, -7);
  playerCamera.up = new Vec3(0,0, -1);

  const player2Camera = new Camera(device, canvas.width/halfHeight);
  player2Camera.eye = new Vec3(16, 0, -7);
  player2Camera.up = new Vec3(0,0, -1);

  // -PADDLES, BALL, FLOOR ect...
  const paddle1 = new Paddle(device, inputManager, camera, shadowCamera, ambientLight, directionalLight, pointLights)
  paddle1.pipeline.shadowTexture = shadowTexture
  paddle1.pipeline2.shadowTexture = shadowTexture
  paddle1.playerOne = true;
  paddle1.position.x = -5;
  paddle1.color = new Color(1, 0.3, 0.3, 1);
  paddle1.pipeline.camera = playerCamera;
  paddle1.pipeline2.camera = player2Camera

  const paddle2 = new Paddle(device, inputManager, camera, shadowCamera, ambientLight, directionalLight, pointLights)
  paddle2.pipeline.shadowTexture = shadowTexture
  paddle2.pipeline2.shadowTexture = shadowTexture

  paddle2.playerOne = false;
  paddle2.position.x = 5;
  paddle2.color = new Color(0.3, 0.3, 1, 1);
  paddle2.playerOne = false;
  paddle2.pipeline.camera = playerCamera;
  paddle2.pipeline2.camera = player2Camera


  const ball = new Ball(device, camera, shadowCamera, ambientLight, directionalLight, pointLights);
  ball.pipeline.shadowTexture = shadowTexture
  ball.pipeline2.shadowTexture = shadowTexture
  ball.pipeline.camera = playerCamera;
  ball.pipeline2.camera = player2Camera

  const floor = new Floor(device, camera,shadowCamera,  ambientLight, directionalLight, pointLights);
  floor.pipeline.shadowTexture = shadowTexture
  floor.pipeline2.shadowTexture = shadowTexture
  floor.pipeline.camera = playerCamera;
  floor.pipeline2.camera = player2Camera;


  const shadowPass = (commandEncoder: GPUCommandEncoder) =>{
    const renderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [],
      // CONFIGURE DEPTH
      depthStencilAttachment: {
        view: shadowTexture.texture.createView(),
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1.0,
      }
    });


    // DRAW HERE
    paddle1.drawShadows(renderPassEncoder);
    paddle2.drawShadows(renderPassEncoder);
    ball.drawShadows(renderPassEncoder);

    renderPassEncoder.end();
  }




  const splitScreenPass = (commandEncoder: GPUCommandEncoder) =>{
    const renderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: gpuContext.getCurrentTexture().createView(),
        storeOp: "store",
        clearValue: { r: 0.4, g: 0.9, b: 0.9, a: 1.0 },
        loadOp: "clear"
      }],
      // CONFIGURE DEPTH
      depthStencilAttachment: {
        view: depthTexture.texture.createView(),
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1.0,
      }
    });
    renderPassEncoder.setViewport(0, 0, canvas.width, canvas.height / 2, 0, 1);

    // DRAW HERE
    paddle1.draw(renderPassEncoder);
    paddle2.draw(renderPassEncoder);
    ball.draw(renderPassEncoder);
    floor.draw(renderPassEncoder);

    renderPassEncoder.setViewport(0, canvas.height / 2, canvas.width, canvas.height / 2, 0, 1);
    // DRAW HERE
    paddle1.drawSecond(renderPassEncoder);
    paddle2.drawSecond(renderPassEncoder);
    ball.drawSecond(renderPassEncoder);
    floor.drawSecond(renderPassEncoder);


    renderPassEncoder.end();
  }

  const update = () => {
    ambientLight.update()
    directionalLight.update();
    camera.update();
    paddle1.update();
    paddle2.update();
    ball.update();
    floor.update();
    pointLights.update();
    shadowCamera.update();
    ball.collidesPaddle(paddle1);
    ball.collidesPaddle(paddle2);
    playerCamera.update();
    player2Camera.update();
  }

  const draw = () => {

    update();

    const commandEncoder = device.createCommandEncoder();
    
    shadowPass(commandEncoder);
    splitScreenPass(commandEncoder);
    
    device.queue.submit([
      commandEncoder.finish()
    ]);

    requestAnimationFrame(draw);
  }

  draw();

}

init()