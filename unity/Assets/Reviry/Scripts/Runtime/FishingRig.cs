using UnityEngine;
using Reviry.Core;
namespace Reviry
{
    public sealed class FishingRig : MonoBehaviour
    {
        Camera view;FishingSimulation game;Transform rest,rod,indicator,reelHandle,fish;
        Transform[] segments=new Transform[24];LineRenderer line;Vector3 castDirection;bool wasHeld;
        Material carbon,metal,cork;
        public void Initialise(Camera camera,FishingSimulation simulation)
        {
            view=camera;game=simulation;carbon=Resources.Load<Material>("Materials/Carbon");metal=Resources.Load<Material>("Materials/Metal");cork=Resources.Load<Material>("Materials/Cork");
            rest=new GameObject("World anchored fishing stand").transform;rest.position=view.transform.position;rest.rotation=view.transform.rotation;
            rod=new GameObject("Fishing rod").transform;rod.SetParent(rest,false);rod.localPosition=new Vector3(.35f,-.45f,.65f);rod.localRotation=Quaternion.FromToRotation(Vector3.up,new Vector3(-.4f,.3f,1).normalized);
            for(int i=0;i<segments.Length;i++){var s=Primitive(PrimitiveType.Cylinder,"Carbon section",rod,new Vector3(0,i*.095f,0),new Vector3(.010f-i*.0003f,.05f,.010f-i*.0003f),carbon);segments[i]=s.transform;}
            Primitive(PrimitiveType.Cylinder,"Cork grip",rod,new Vector3(0,.12f,0),new Vector3(.045f,.22f,.045f),cork);
            for(int i=0;i<8;i++)Ring(rod,new Vector3(0,.5f+i*.24f,-.025f),.023f-i*.002f,.002f,metal);
            var reel=new GameObject("Reel").transform;reel.SetParent(rod,false);reel.localPosition=new Vector3(0,.06f,-.10f);
            Primitive(PrimitiveType.Sphere,"Reel housing",reel,Vector3.zero,new Vector3(.11f,.13f,.10f),carbon);
            var spool=Primitive(PrimitiveType.Cylinder,"Spool",reel,new Vector3(0,.08f,0),new Vector3(.09f,.035f,.09f),metal);spool.transform.localRotation=Quaternion.identity;
            for(int i=0;i<10;i++)Ring(reel,new Vector3(0,.05f+i*.005f,0),.044f,.001f,cork,Quaternion.Euler(90,0,0));
            reelHandle=new GameObject("Reel handle").transform;reelHandle.SetParent(reel,false);reelHandle.localPosition=new Vector3(-.05f,0,0);
            Cylinder(reelHandle,new Vector3(0,0,0),new Vector3(-.08f,.04f,0),.008f,metal);Primitive(PrimitiveType.Capsule,"Handle grip",reelHandle,new Vector3(-.08f,.04f,0),new Vector3(.025f,.035f,.025f),carbon);
            var stand=new GameObject("Rod pod").transform;stand.SetParent(rest,false);stand.localPosition=new Vector3(.28f,-.9f,1.05f);
            for(int i=0;i<2;i++){float z=i*.7f;Cylinder(stand,new Vector3(-.25f,-.5f,z),new Vector3(0,.25f,z),.012f,carbon);Cylinder(stand,new Vector3(.25f,-.5f,z),new Vector3(0,.25f,z),.012f,carbon);Cylinder(stand,new Vector3(-.2f,.25f,z),new Vector3(.25f,.25f,z),.012f,carbon);}
            Cylinder(stand,new Vector3(0,.25f,0),new Vector3(0,.25f,.7f),.012f,carbon);
            indicator=Primitive(PrimitiveType.Sphere,"Mechanical bite indicator",stand,new Vector3(-.12f,.1f,.4f),new Vector3(.05f,.09f,.05f),Resources.Load<Material>("Materials/Indicator")).transform;
            Cylinder(stand,new Vector3(-.12f,.25f,.4f),new Vector3(-.12f,.10f,.4f),.0015f,metal);
            var lineGo=new GameObject("Fishing line");lineGo.layer=8;line=lineGo.AddComponent<LineRenderer>();line.sharedMaterial=Resources.Load<Material>("Materials/Line");line.startWidth=.0014f;line.endWidth=.001f;line.positionCount=24;line.useWorldSpace=true;
            fish=Primitive(PrimitiveType.Sphere,"Working fish model",null,Vector3.zero,new Vector3(.9f,.3f,.22f),cork).transform;fish.gameObject.SetActive(false);
            castDirection=Vector3.ProjectOnPlane(view.transform.forward,Vector3.up).normalized;
            game.Event+=OnGameEvent;
        }
        void OnGameEvent(string name)
        {
            if(name=="cast")castDirection=Vector3.ProjectOnPlane(view.transform.forward,Vector3.up).normalized;
            if(name=="splash"){var p=CatchPoint();Shader.SetGlobalVector("_RevirySplash",new Vector4(p.x,p.z,Time.time,1));}
        }
        Vector3 CatchPoint(){var p=rest.position+castDirection*game.Distance;p.y=.02f;return p;}
        void Update()
        {
            if(game==null)return;bool held=game.Phase==FishingPhase.Held||game.Phase==FishingPhase.Fighting;
            if(held!=wasHeld){rod.SetParent(held?view.transform:rest,false);rod.localPosition=new Vector3(.35f,-.45f,.65f);wasHeld=held;}
            var direction=new Vector3(-.4f,held?(game.Lifting?.9f:.5f):.3f,1).normalized;
            if(game.Phase==FishingPhase.Charging)direction=new Vector3(-.2f,1,Mathf.Lerp(.5f,-.45f,game.Charge)).normalized;
            rod.localRotation=Quaternion.Slerp(rod.localRotation,Quaternion.FromToRotation(Vector3.up,direction),Time.deltaTime*9);
            float bend=game.Phase==FishingPhase.Fighting?game.Tension*.3f:0;
            for(int i=0;i<segments.Length;i++){float f=i/(float)(segments.Length-1);segments[i].localPosition=new Vector3(0,i*.095f,bend*f*f);segments[i].localRotation=Quaternion.Euler(bend*f*45,0,0);}
            indicator.localPosition=new Vector3(-.12f,.10f+(game.Phase==FishingPhase.Bite?Mathf.Sin(Time.time*13)*.07f:0),.4f);
            if(game.Reeling&&game.Phase==FishingPhase.Fighting)reelHandle.Rotate(Vector3.up,900*Time.deltaTime,Space.Self);
            bool cast=game.Phase!=FishingPhase.Ready&&game.Phase!=FishingPhase.Charging&&game.Phase!=FishingPhase.Landed&&game.Phase!=FishingPhase.Escaped;line.enabled=cast;
            if(cast){var a=rod.TransformPoint(0,2.25f,bend);var b=CatchPoint();var mid=Vector3.Lerp(a,b,.5f)+Vector3.down*(held?0:.25f);for(int i=0;i<24;i++){float t=i/23f;line.SetPosition(i,(1-t)*(1-t)*a+2*(1-t)*t*mid+t*t*b);}}
            fish.gameObject.SetActive(game.Phase==FishingPhase.Fighting&&game.Distance<10);if(fish.gameObject.activeSelf){fish.position=CatchPoint()+Vector3.down*.15f;fish.rotation=Quaternion.Euler(0,Mathf.Sin(Time.time*2)*20,0);}
        }
        void OnDestroy(){if(game!=null)game.Event-=OnGameEvent;}
        static GameObject Primitive(PrimitiveType type,string name,Transform parent,Vector3 position,Vector3 scale,Material material)
        {var g=GameObject.CreatePrimitive(type);g.name=name;g.layer=8;if(parent!=null)g.transform.SetParent(parent,false);g.transform.localPosition=position;g.transform.localScale=scale;g.GetComponent<Renderer>().sharedMaterial=material;Destroy(g.GetComponent<Collider>());return g;}
        static void Cylinder(Transform parent,Vector3 a,Vector3 b,float radius,Material material)
        {var g=Primitive(PrimitiveType.Cylinder,"Support",parent,(a+b)*.5f,new Vector3(radius*2,(b-a).magnitude*.5f,radius*2),material);g.transform.localRotation=Quaternion.FromToRotation(Vector3.up,(b-a).normalized);}
        static void Ring(Transform parent,Vector3 center,float radius,float tube,Material material,Quaternion rotation=default)
        {
            var vertices=new System.Collections.Generic.List<Vector3>();var triangles=new System.Collections.Generic.List<int>();const int n=24,m=6;
            if(rotation==default)rotation=Quaternion.identity;
            for(int i=0;i<=n;i++)for(int j=0;j<=m;j++){float a=i*Mathf.PI*2/n,b=j*Mathf.PI*2/m;vertices.Add(rotation*(new Vector3((radius+tube*Mathf.Cos(b))*Mathf.Cos(a),(radius+tube*Mathf.Cos(b))*Mathf.Sin(a),tube*Mathf.Sin(b)))+center);}
            for(int i=0;i<n;i++)for(int j=0;j<m;j++){int a=i*(m+1)+j,b=a+m+1;triangles.AddRange(new[]{a,b,a+1,a+1,b,b+1});}
            var g=WorldBootstrap.CreateMesh("Guide / machined ring",WorldBootstrap.BuildMesh(vertices,triangles),material,parent);g.layer=8;
        }
    }
}
