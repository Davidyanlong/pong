struct VSInput {
    @location(0) position : vec3f,
    @location(1) color : vec4f,
    @location(2) texCoord : vec2f,
}

struct VSOutput {
    @builtin(position) position : vec4f,
    @location(1) color : vec4f,
    @location(2) texCoord : vec2f,
}

@group(0) @binding(0)
var<uniform> transforms:array<mat4x4f,1>;

@group(0) @binding(1)
var<uniform> textureTiling:vec2f;

@group(1) @binding(0)
var<uniform> viewProjection:mat4x4f;


@vertex
fn unlitMaterialVS(
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

    return out;
}

@group(2) @binding(0)
var diffuseTexture : texture_2d<f32>;

@group(2) @binding(1)
var diffuseSampler : sampler;

@group(3) @binding(0)
var<uniform> diffuseColor:vec4f;

@fragment
fn unlitMaterialFS(in : VSOutput) -> @location(0) vec4f
{
    return textureSample(diffuseTexture, diffuseSampler, in.texCoord) * in.color * diffuseColor;
}
