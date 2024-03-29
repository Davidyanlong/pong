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
}

@group(0) @binding(0)
var<uniform> transforms:array<mat4x4f,1>;

@group(0) @binding(1)
var<uniform> normalMatrix: array<mat3x3f, 1>;

@group(0) @binding(2)
var<uniform> textureTiling:vec2f;

@group(1) @binding(0)
var<uniform> viewProjection:mat4x4f;


@vertex
fn materialVS(
in : VSInput,

    //builtins
@builtin(vertex_index) vid : u32,
@builtin(instance_index) iid : u32
) -> VSOutput
{
    var out : VSOutput;
    out.position = viewProjection * transforms[iid] * vec4f(in.position, 1.0);
    out.color = in.color;
    out.texCoord = in.texCoord * textureTiling;
    out.normal = normalMatrix[iid] * in.normal;
    out.fragPos =  (transforms[iid] * vec4f(in.position, 1.0)).xyz;

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

};

@group(2) @binding(0)
var diffuseTexture : texture_2d<f32>;
@group(2) @binding(1)
var diffuseSampler : sampler;
@group(2) @binding(2)
var<uniform> diffuseColor:vec4f;

@group(3) @binding(0)
 var<uniform> ambientLight:AmbientLight;
@group(3) @binding(1)
 var<uniform> directionalLight:DirectionalLight;
 @group(3) @binding(2)
 var<uniform> positionalLights: array<PointLight, 3>;

@fragment
fn materialFS(in : VSOutput) -> @location(0) vec4f
{
    // ambient light
    var lightAmount  = ambientLight.color * ambientLight.intensity;

    // DIRECTIONAL LIGHT
    var lightDir = normalize(-directionalLight.direction);
    var normal = normalize(in.normal);
    var diff = max(dot(normal, lightDir),0.0);
    lightAmount  += directionalLight.color * directionalLight.intensity * diff;

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

         lightAmount  += positionalLights[i].color * positionalLights[i].intensity * dotLight * attenuation;
    }

   // return vec4f(lightDir,1);
    var color =  textureSample(diffuseTexture, diffuseSampler, in.texCoord) * in.color * diffuseColor;

    return  color * vec4f(lightAmount , 1.0);
}
