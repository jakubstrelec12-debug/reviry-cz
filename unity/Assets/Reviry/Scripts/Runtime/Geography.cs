using System;
using UnityEngine;
namespace Reviry
{
    [Serializable] public struct GeoPoint { public float x, z; public Vector2 XZ => new Vector2(x,z); }
    [Serializable] public class Building { public GeoPoint[] outline; public float height; public string name, type; }
    [Serializable] public class Station { public GeoPoint position, target; public float eyeHeight; }
    [Serializable] public class Geography { public GeoPoint[] shoreline, island; public Building[] buildings; public Station station; }
    public static class GeoMath
    {
        public static bool Contains(GeoPoint[] ring, Vector2 p)
        {
            bool inside = false;
            for (int i=0,j=ring.Length-1; i<ring.Length; j=i++)
            { var a=ring[i];var b=ring[j];if((a.z>p.y)!=(b.z>p.y)&&p.x<(b.x-a.x)*(p.y-a.z)/(b.z-a.z)+a.x)inside=!inside; }
            return inside;
        }
        public static float EdgeDistance(GeoPoint[] ring,Vector2 p)
        {
            float distance=float.PositiveInfinity;
            for(int i=1;i<ring.Length;i++) {var a=ring[i-1].XZ;var d=ring[i].XZ-a;var t=Mathf.Clamp01(Vector2.Dot(p-a,d)/Mathf.Max(.0001f,d.sqrMagnitude));distance=Mathf.Min(distance,Vector2.Distance(p,a+d*t));}
            return distance;
        }
        public static float Height(Geography geo,float x,float z)
        {
            var p=new Vector2(x,z);bool water=Contains(geo.shoreline,p)&&!Contains(geo.island,p);
            float edge=Mathf.Min(EdgeDistance(geo.shoreline,p),EdgeDistance(geo.island,p));
            if(water)return -Mathf.Lerp(.12f,3.5f,Mathf.Clamp01(edge/12));
            return .07f+Mathf.SmoothStep(0,2.2f,edge/18)+Mathf.PerlinNoise(x*.045f+300,z*.045f+300)*Mathf.Clamp01(edge/4)*.35f;
        }
    }
}
