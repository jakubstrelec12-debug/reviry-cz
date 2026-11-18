using System.Collections;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
namespace Reviry
{
    public sealed class PlanarWaterReflection : MonoBehaviour
    {
        public Camera source;
        public Material water;
        public int resolution = 768;
        Camera mirror;
        RenderTexture target;
        IEnumerator Start()
        {
            var go=new GameObject("Reflection camera") {hideFlags=HideFlags.HideAndDontSave};
            mirror=go.AddComponent<Camera>();mirror.enabled=false;mirror.gameObject.AddComponent<UniversalAdditionalCameraData>();
            target=new RenderTexture(resolution,resolution,24,RenderTextureFormat.ARGBHalf){name="Vajgar planar reflection",useMipMap=false};target.Create();
            water.SetTexture("_ReflectionTex",target);
            var wait=new WaitForEndOfFrame();int frame=0;
            while(true)
            {
                yield return wait;
                if(source==null||water==null||++frame%2!=0)continue;
                mirror.CopyFrom(source);mirror.enabled=false;mirror.cullingMask=source.cullingMask&~(1<<4)&~(1<<8);mirror.targetTexture=target;
                Vector4 plane=new Vector4(0,1,0,-transform.position.y);Matrix4x4 reflection=ReflectionMatrix(plane);
                var pos=source.transform.position;var reflected=reflection.MultiplyPoint(pos);mirror.transform.position=reflected;
                var direction=reflection.MultiplyVector(source.transform.forward);var up=reflection.MultiplyVector(source.transform.up);mirror.transform.rotation=Quaternion.LookRotation(direction,up);
                mirror.worldToCameraMatrix=source.worldToCameraMatrix*reflection;
                Vector3 clipPoint=mirror.worldToCameraMatrix.MultiplyPoint(transform.position+Vector3.up*.05f);
                Vector3 clipNormal=mirror.worldToCameraMatrix.MultiplyVector(Vector3.up).normalized;
                mirror.projectionMatrix=source.CalculateObliqueMatrix(new Vector4(clipNormal.x,clipNormal.y,clipNormal.z,-Vector3.Dot(clipPoint,clipNormal)));
                var request=new UniversalRenderPipeline.SingleCameraRequest {destination=target};
                if(!RenderPipeline.SupportsRenderRequest(mirror,request))continue;
                bool oldCulling=GL.invertCulling;
                try
                {
                    GL.invertCulling=true;RenderPipeline.SubmitRenderRequest(mirror,request);
                    Shader.SetGlobalMatrix("_ReviryReflectionVP",GL.GetGPUProjectionMatrix(mirror.projectionMatrix,true)*mirror.worldToCameraMatrix);
                    water.SetFloat("_ReflectionReady",1);
                }
                finally {GL.invertCulling=oldCulling;}
            }
        }
        static Matrix4x4 ReflectionMatrix(Vector4 p)
        {
            var m=Matrix4x4.identity;
            m.m00=1-2*p.x*p.x;m.m01=-2*p.x*p.y;m.m02=-2*p.x*p.z;m.m03=-2*p.w*p.x;
            m.m10=-2*p.y*p.x;m.m11=1-2*p.y*p.y;m.m12=-2*p.y*p.z;m.m13=-2*p.w*p.y;
            m.m20=-2*p.z*p.x;m.m21=-2*p.z*p.y;m.m22=1-2*p.z*p.z;m.m23=-2*p.w*p.z;return m;
        }
        void OnDestroy(){if(water!=null)water.SetFloat("_ReflectionReady",0);if(target!=null){target.Release();Destroy(target);}if(mirror!=null)Destroy(mirror.gameObject);}
    }
}
