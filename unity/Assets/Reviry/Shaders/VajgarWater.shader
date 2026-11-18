Shader "Reviry/Vajgar Water"
{
 Properties
 {
  _ShallowColor("Shallow",Color)=(0.18,0.23,0.16,1)
  _DeepColor("Deep",Color)=(0.055,0.13,0.12,1)
  _ReflectionTex("Planar reflection",2D)="gray"{}
  _WaveStrength("Ripple strength",Range(0,1))=0.35
  _ReflectionReady("Reflection ready",Float)=0
 }
 SubShader
 {
  Tags { "RenderPipeline"="UniversalPipeline" "Queue"="Transparent-10" "RenderType"="Transparent" }
  Pass
  {
   Name "Water"
   Tags {"LightMode"="UniversalForward"}
   ZWrite On Cull Off
   HLSLPROGRAM
   #pragma vertex Vert
   #pragma fragment Frag
   #pragma multi_compile_fog
   #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN
   #pragma multi_compile_fragment _ _SHADOWS_SOFT
   #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
   #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"
   #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareDepthTexture.hlsl"
   #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareOpaqueTexture.hlsl"
   TEXTURE2D(_ReflectionTex); SAMPLER(sampler_ReflectionTex);
   CBUFFER_START(UnityPerMaterial)
    half4 _ShallowColor, _DeepColor;
    float _WaveStrength, _ReflectionReady;
   CBUFFER_END
   float4x4 _ReviryReflectionVP;
   float4 _RevirySplash;
   struct Attributes {float4 positionOS:POSITION;};
   struct Varyings {float4 positionCS:SV_POSITION;float3 world:TEXCOORD0;float4 screen:TEXCOORD1;float4 reflected:TEXCOORD2;half fog:TEXCOORD3;};
   float Wave(float2 p,float t)
   {
    return sin(dot(p,float2(.86,.49))*6.3+t*.8)*.012+sin(dot(p,float2(-.31,.95))*10.7-t*.65)*.006+sin(dot(p,float2(.66,-.75))*21.5+t*1.3)*.0025;
   }
   Varyings Vert(Attributes input)
   {
    Varyings o;float3 world=TransformObjectToWorld(input.positionOS.xyz);world.y+=Wave(world.xz,_Time.y)*.35;
    o.world=world;o.positionCS=TransformWorldToHClip(world);o.screen=ComputeScreenPos(o.positionCS);o.reflected=mul(_ReviryReflectionVP,float4(world,1));o.fog=ComputeFogFactor(o.positionCS.z);return o;
   }
   half4 Frag(Varyings input):SV_Target
   {
    float2 p=input.world.xz;float h=Wave(p,_Time.y);float2 slope=float2(Wave(p+float2(.04,0),_Time.y)-h,Wave(p+float2(0,.04),_Time.y)-h)/.04;
    float age=_Time.y-_RevirySplash.z;float dist=distance(p,_RevirySplash.xy);
    if(age>0&&age<7)slope+=normalize(p-_RevirySplash.xy+float2(.001,.001))*sin(dist*8-age*9)*exp(-pow(dist-age*1.7,2)*1.5)*exp(-age*.4)*.25;
    float3 normal=normalize(float3(-slope.x*_WaveStrength,1,-slope.y*_WaveStrength));float3 view=GetWorldSpaceNormalizeViewDir(input.world);
    float2 uv=input.screen.xy/input.screen.w;float sceneZ=LinearEyeDepth(SampleSceneDepth(uv),_ZBufferParams);float waterZ=-TransformWorldToView(input.world).z;float depth=max(0,sceneZ-waterZ);
    half3 refracted=SampleSceneColor(saturate(uv+normal.xz*.007*saturate(depth)));
    half3 body=lerp(_ShallowColor.rgb,_DeepColor.rgb,saturate(depth*.12));body=lerp(refracted,body,saturate(depth*.23+.15));
    float2 mirror=input.reflected.xy/input.reflected.w*.5+.5;mirror+=normal.xz*.014;
    half3 planar=SAMPLE_TEXTURE2D(_ReflectionTex,sampler_ReflectionTex,saturate(mirror)).rgb;
    half3 probe=GlossyEnvironmentReflection(reflect(-view,normal),.08,1);
    half3 reflection=lerp(probe,planar,saturate(_ReflectionReady));
    float fresnel=.04+.96*pow(1-saturate(dot(normal,view)),4.5);half3 color=lerp(body,reflection,fresnel);
    Light sun=GetMainLight(TransformWorldToShadowCoord(input.world));float spec=pow(saturate(dot(normal,normalize(view+sun.direction))),280);
    color+=sun.color*spec*sun.shadowAttenuation*.7;color=MixFog(color,input.fog);return half4(color,1);
   }
   ENDHLSL
  }
 }
}
