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
    @location(3) normal:vec3f,
}

@group(0) @binding(0)
var<uniform> transforms:array<mat4x4f,1>;

@group(0) @binding(1)
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
    out.normal = in.normal;

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

@fragment
fn materialFS(in : VSOutput) -> @location(0) vec4f
{
    // ambient light
    var lightAmout = ambientLight.color * ambientLight.intensity;

    // DIRECTIONAL LIGHT
    var lightDir = normalize(-directionalLight.direction);
    var normal = normalize(in.normal);
    var diff = max(dot(normal, lightDir),0.0);
    lightAmout += directionalLight.color * directionalLight.intensity * diff;

   // return vec4f(lightDir,1);
    var color =  textureSample(diffuseTexture, diffuseSampler, in.texCoord) * in.color * diffuseColor;

    return  color * vec4f(lightAmout, 1.0);
}
