using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
namespace Reviry
{
    public sealed class WorldBootstrap : MonoBehaviour
    {
        public Geography Geography {get;private set;}
        public Camera PlayerCamera {get;private set;}
        Material soil,wall,roof,leaf;
        Transform environment;
        void Start()
        {
            Application.targetFrameRate=60;Screen.sleepTimeout=SleepTimeout.NeverSleep;
            var source=Resources.Load<TextAsset>("Geography/vajgar");
            if(source==null)throw new InvalidOperationException("Vajgar geography is missing.");
            Geography=JsonUtility.FromJson<Geography>(source.text);
            soil=Resources.Load<Material>("Materials/Soil");wall=Resources.Load<Material>("Materials/Wall");roof=Resources.Load<Material>("Materials/Roof");leaf=Resources.Load<Material>("Materials/Leaf");
            if(soil==null||wall==null||roof==null)throw new InvalidOperationException("Project setup has not generated the URP materials. Run Reviry/Prepare Project.");
            environment=new GameObject("Vajgar — mapped environment").transform;environment.SetParent(transform);
            var s=Geography.station;var origin=new Vector3(s.position.x,0,s.position.z);
            MakeTerrain(origin);MakeTown();MakeTrees();MakeLighting();
            var cameraGo=new GameObject("Angler camera");cameraGo.tag="MainCamera";PlayerCamera=cameraGo.AddComponent<Camera>();cameraGo.AddComponent<AudioListener>();
            PlayerCamera.transform.position=new Vector3(origin.x,GeoMath.Height(Geography,origin.x,origin.z)+s.eyeHeight,origin.z);
            PlayerCamera.transform.rotation=Quaternion.LookRotation(new Vector3(s.target.x,2.5f,s.target.z)-PlayerCamera.transform.position)*Quaternion.Euler(8,0,0);
            PlayerCamera.nearClipPlane=.05f;PlayerCamera.farClipPlane=2400;PlayerCamera.fieldOfView=54;PlayerCamera.allowHDR=true;
            var cameraData=cameraGo.AddComponent<UniversalAdditionalCameraData>();cameraData.renderPostProcessing=true;cameraData.requiresColorTexture=true;cameraData.requiresDepthTexture=true;cameraData.antialiasing=AntialiasingMode.SubpixelMorphologicalAntiAliasing;
            MakeWater();var game=gameObject.AddComponent<FishingController>();game.Initialise(PlayerCamera,Geography);
        }
        void MakeTerrain(Vector3 origin)
        {
            CreateGrid("Distant terrain",new Vector2(-1300,-1000),new Vector2(2200,1200),140,100,0);
            CreateGrid("Detailed fishing bank",new Vector2(origin.x-45,origin.z-45),new Vector2(origin.x+45,origin.z+45),180,180,.025f);
        }
        void CreateGrid(string name,Vector2 min,Vector2 max,int nx,int nz,float offset)
        {
            var vertices=new Vector3[(nx+1)*(nz+1)];var uv=new Vector2[vertices.Length];var triangles=new int[nx*nz*6];int t=0;
            for(int z=0;z<=nz;z++)for(int x=0;x<=nx;x++)
            {int i=z*(nx+1)+x;float xx=Mathf.Lerp(min.x,max.x,x/(float)nx),zz=Mathf.Lerp(min.y,max.y,z/(float)nz);vertices[i]=new Vector3(xx,GeoMath.Height(Geography,xx,zz)+offset,zz);uv[i]=new Vector2(xx/2.1f,zz/2.1f);}
            for(int z=0;z<nz;z++)for(int x=0;x<nx;x++)
            {int a=z*(nx+1)+x,b=a+1,c=a+nx+1,d=c+1;triangles[t++]=a;triangles[t++]=c;triangles[t++]=b;triangles[t++]=b;triangles[t++]=c;triangles[t++]=d;}
            var mesh=new Mesh{name=name,indexFormat=IndexFormat.UInt32};mesh.vertices=vertices;mesh.uv=uv;mesh.triangles=triangles;mesh.RecalculateNormals();mesh.RecalculateBounds();mesh.RecalculateTangents();CreateMesh(name,mesh,soil,environment);
        }
        void MakeTown()
        {
            var walls=new List<Vector3>();var wallTriangles=new List<int>();var roofs=new List<Vector3>();var roofTriangles=new List<int>();
            foreach(var building in Geography.buildings)
            {
                var p=building.outline;if(p==null||p.Length<4)continue;Vector2 center=Vector2.zero;int n=p.Length-1;
                for(int i=0;i<n;i++)center+=p[i].XZ/n;
                float baseline=GeoMath.Height(Geography,center.x,center.y);float height=building.type=="church"?16:building.height;
                for(int i=0;i<n;i++)
                {
                    var a=p[i];var b=p[(i+1)%n];int k=walls.Count;
                    walls.Add(new Vector3(a.x,baseline,a.z));walls.Add(new Vector3(b.x,baseline,b.z));walls.Add(new Vector3(a.x,baseline+height,a.z));walls.Add(new Vector3(b.x,baseline+height,b.z));
                    wallTriangles.AddRange(new[]{k,k+2,k+1,k+1,k+2,k+3});k=roofs.Count;
                    roofs.Add(new Vector3(a.x,baseline+height,a.z));roofs.Add(new Vector3(b.x,baseline+height,b.z));roofs.Add(new Vector3(center.x,baseline+height+2.4f,center.y));roofTriangles.AddRange(new[]{k,k+2,k+1});
                }
            }
            CreateMesh("Mapped building shells",BuildMesh(walls,wallTriangles),wall,environment);CreateMesh("Approximate roof forms",BuildMesh(roofs,roofTriangles),roof,environment);
        }
        void MakeTrees()
        {
            var prefab=Resources.Load<GameObject>("Environment/Tree");if(prefab==null){Debug.LogError("3D tree FBX is missing.");return;}
            var random=new System.Random(131);var points=new List<Vector2>();
            var island=Geography.island;Vector2 center=Vector2.zero;for(int i=0;i<island.Length-1;i++)center+=island[i].XZ/(island.Length-1);
            for(int i=0;i<16;i++){float angle=(float)random.NextDouble()*Mathf.PI*2,r=(float)random.NextDouble()*12;points.Add(center+new Vector2(Mathf.Cos(angle),Mathf.Sin(angle))*r);}
            for(int i=0;i<Geography.shoreline.Length-1;i+=3){var p=Geography.shoreline[i].XZ;if(p.x<-300)continue;points.Add(p+(p-center).normalized*8);}
            var station=Geography.station.position.XZ;points.Add(station+new Vector2(-8,5));points.Add(station+new Vector2(8,5));
            foreach(var point in points)
            {
                var tree=Instantiate(prefab,environment);tree.name="3D tree — estimated vegetation";tree.transform.position=new Vector3(point.x,GeoMath.Height(Geography,point.x,point.y),point.y);tree.transform.localScale=Vector3.one*(2.2f+(float)random.NextDouble()*1.2f);tree.transform.rotation=Quaternion.Euler(0,(float)random.NextDouble()*360,0);
                var renderers=tree.GetComponentsInChildren<MeshRenderer>();foreach(var renderer in renderers){var materials=renderer.sharedMaterials;for(int i=0;i<materials.Length;i++)materials[i]=materials[i].name.ToLowerInvariant().Contains("leav")?leaf:Resources.Load<Material>(materials[i].name.ToLowerInvariant().Contains("branch")?"Materials/Branch":"Materials/Bark");renderer.sharedMaterials=materials;}
                var lod=tree.AddComponent<LODGroup>();lod.SetLODs(new[]{new LOD(.012f,renderers),new LOD(0f,new Renderer[0])});lod.RecalculateBounds();
            }
        }
        void MakeWater()
        {
            var waterMat=Instantiate(Resources.Load<Material>("Materials/Water"));var water=GameObject.CreatePrimitive(PrimitiveType.Plane);water.name="Vajgar water";water.layer=4;water.transform.SetParent(environment);water.transform.position=Vector3.zero;water.transform.localScale=new Vector3(320,1,240);Destroy(water.GetComponent<Collider>());water.GetComponent<Renderer>().sharedMaterial=waterMat;
            var reflection=water.AddComponent<PlanarWaterReflection>();reflection.source=PlayerCamera;reflection.water=waterMat;reflection.resolution=768;
        }
        void MakeLighting()
        {
            RenderSettings.skybox=Resources.Load<Material>("Materials/Sky");RenderSettings.ambientMode=AmbientMode.Skybox;RenderSettings.ambientIntensity=.8f;
            RenderSettings.fog=true;RenderSettings.fogMode=FogMode.Exponential;RenderSettings.fogColor=new Color(.72f,.78f,.79f);RenderSettings.fogDensity=.0006f;
            var sunGo=new GameObject("Late afternoon sun");sunGo.transform.SetParent(environment);sunGo.transform.rotation=Quaternion.Euler(22,-40,0);var sun=sunGo.AddComponent<Light>();sun.type=LightType.Directional;sun.color=new Color(1,.91f,.75f);sun.intensity=2.2f;sun.shadows=LightShadows.Soft;sun.shadowBias=.03f;RenderSettings.sun=sun;
            var volumeGo=new GameObject("Outdoor grading");volumeGo.transform.SetParent(environment);var volume=volumeGo.AddComponent<Volume>();volume.isGlobal=true;volume.profile=Resources.Load<VolumeProfile>("Materials/OutdoorVolume");DynamicGI.UpdateEnvironment();
        }
        public static Mesh BuildMesh(List<Vector3> vertices,List<int> triangles)
        {var m=new Mesh{indexFormat=IndexFormat.UInt32};m.SetVertices(vertices);m.SetTriangles(triangles,0);var uv=new Vector2[vertices.Count];for(int i=0;i<uv.Length;i++)uv[i]=new Vector2(vertices[i].x*.2f,vertices[i].y*.2f);m.uv=uv;m.RecalculateNormals();m.RecalculateTangents();m.RecalculateBounds();return m;}
        public static GameObject CreateMesh(string name,Mesh mesh,Material material,Transform parent)
        {var g=new GameObject(name);g.transform.SetParent(parent,false);g.AddComponent<MeshFilter>().sharedMesh=mesh;g.AddComponent<MeshRenderer>().sharedMaterial=material;return g;}
    }
}
