struct VSInput {
    @location(0) position : vec3f,
    @location(1) color : vec4f,
    @location(2) texCoord : vec2f,
    @location(3) normal:vec3f,
}

struct VSOutput {
    @builtin(position) position : vec4f,
    @location(1) color : vec4f,
    @location(2) texCoord : vec2f,
    @location(3) normal : vec3f,
    @location(4) fragPos: vec3f, 
    @location(5) eye : vec3f,
    @location(6) lightSpaceFragmentPos : vec4f,
}

@group(0) @binding(0)
var<uniform> transforms:array<mat4x4f,1>;

@group(0) @binding(1)
var<uniform> normalMatrix: array<mat3x3f, 1>;

@group(0) @binding(2)
var<uniform> textureTiling:vec2f;

@group(1) @binding(0)
var<uniform> projectionView:mat4x4f;
@group(1) @binding(1)
var<uniform> eye:vec3f;
@group(1) @binding(2)
var<uniform> lightSpaceProjectionView:mat4x4f;


@vertex
fn materialVS(
in : VSInput,

    //builtins
@builtin(vertex_index) vid : u32,
@builtin(instance_index) iid : u32
) -> VSOutput
{
    var out : VSOutput;
    out.position = projectionView * transforms[iid] * vec4f(in.position, 1.0);
    out.color = in.color;
    out.texCoord = in.texCoord * textureTiling;
    out.normal = normalMatrix[iid] * in.normal;
    out.fragPos =  (transforms[iid] * vec4f(in.position, 1.0)).xyz;
    out.eye = eye;
    out.lightSpaceFragmentPos = lightSpaceProjectionView * vec4f(out.fragPos, 1.0);
    return out;
}

struct AmbientLight
{
    @location(0) color:vec3f,
    @location(1) intensity:f32,
};

struct DirectionalLight
{
    @location(0) color:vec3f,
    @location(1) intensity:f32,
    @location(2) direction:vec3f,
    @location(3) _discard : f32,
    @location(4) specularColor: vec3f,
    @location(5) specularIntensity: f32,
};

struct PointLight 
{
    @location(0) color: vec3f,
    @location(1) intensity: f32,
    @location(2) position: vec3f,
    // constant
    @location(3) attenConst: f32,
    // linear
    @location(4) attenLin: f32,
    // quadratic
    @location(5) attenQuad: f32,
    @location(6) _discard : vec2f,
    @location(7) specularColor: vec3f,
    @location(8) specularIntensity: f32,

};

@group(2) @binding(0)
var diffuseTexture : texture_2d<f32>;
@group(2) @binding(1)
var diffuseSampler : sampler;
@group(2) @binding(2)
var<uniform> diffuseColor:vec4f;
@group(2) @binding(3)
var<uniform> shininess:f32;
@group(2) @binding(4)
var shadowTexture : texture_depth_2d;
@group(2) @binding(5)
var shadowSampler : sampler_comparison;

@group(3) @binding(0)
 var<uniform> ambientLight:AmbientLight;
@group(3) @binding(1)
 var<uniform> directionalLight:DirectionalLight;
 @group(3) @binding(2)
 var<uniform> positionalLights: array<PointLight, 3>;

@fragment
fn materialFS(in : VSOutput) -> @location(0) vec4f
{

    // -SHADOWS
    // DO a perspective divide
    var shadowCoords = in.lightSpaceFragmentPos.xyz/ in.lightSpaceFragmentPos.w;
    // Transform to [0,1] range
    var shadowTextureCoords = shadowCoords.xy * 0.5 + 0.5;
    shadowTextureCoords.y = 1- shadowTextureCoords.y;

    var shadow = textureSampleCompare(shadowTexture, shadowSampler, shadowTextureCoords, shadowCoords.z-0.01);



    // Vector towards the eye.
    var toEye = normalize(in.eye - in.fragPos);

    // ambient light
    var lightAmount  = ambientLight.color * ambientLight.intensity;

    // DIRECTIONAL LIGHT
    var lightDir = normalize(-directionalLight.direction);
    var normal = normalize(in.normal);
    var diff = max(dot(normal, lightDir),0.0);
    lightAmount  += directionalLight.color * directionalLight.intensity * diff * shadow;


    // Specular Light
    var halfVector = normalize(lightDir + toEye);
    var dotSpecular = max(dot(normal, halfVector), 0.0);
    dotSpecular = pow(dotSpecular, shininess);
    lightAmount += directionalLight.specularColor * dotSpecular * directionalLight.specularIntensity * shadow;

     // Point Lights
    for(var i = 0; i < 3; i++)
    {
        var lightDir = normalize(positionalLights[i].position - in.fragPos);
        var dotLight = max(dot(normal, lightDir), 0.0);


        var distance = length(positionalLights[i].position - in.fragPos);
        var attenuation = positionalLights[i].attenConst 
        + positionalLights[i].attenLin * distance 
        + positionalLights[i].attenQuad * distance * distance;

        attenuation = 1.0/ attenuation;
        lightAmount  += positionalLights[i].color * positionalLights[i].intensity * dotLight * attenuation * shadow;
        
        // Specular Light
        halfVector = normalize(lightDir + toEye);
        dotSpecular = max(dot(normal, halfVector), 0.0);
        dotSpecular = pow(dotSpecular, shininess);
        lightAmount += positionalLights[i].specularColor * dotSpecular * positionalLights[i].specularIntensity * shadow;  
    }

   // return vec4f(lightDir,1);
    var color =  textureSample(diffuseTexture, diffuseSampler, in.texCoord) * in.color * diffuseColor;

    return  color * vec4f(lightAmount , 1.0);
}
