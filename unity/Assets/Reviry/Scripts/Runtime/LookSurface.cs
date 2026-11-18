using System;
using UnityEngine;
using UnityEngine.EventSystems;
namespace Reviry
{
    public sealed class LookSurface : MonoBehaviour,IDragHandler
    {
        public Action<Vector2> Dragged;
        public void OnDrag(PointerEventData eventData){Dragged?.Invoke(eventData.delta);}
    }
}
