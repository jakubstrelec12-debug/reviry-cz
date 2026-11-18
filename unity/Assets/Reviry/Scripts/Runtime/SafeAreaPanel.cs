using System;
using UnityEngine;
using UnityEngine.EventSystems;
namespace Reviry
{
    public sealed class SafeAreaPanel : MonoBehaviour
    {
        Rect last;
        void Update(){if(last==Screen.safeArea)return;last=Screen.safeArea;var r=(RectTransform)transform;r.anchorMin=new Vector2(last.x/Screen.width,last.y/Screen.height);r.anchorMax=new Vector2(last.xMax/Screen.width,last.yMax/Screen.height);r.offsetMin=r.offsetMax=Vector2.zero;}
    }
}
