using System;
using UnityEngine;
using UnityEngine.EventSystems;
namespace Reviry
{
    public sealed class HoldButton : MonoBehaviour,IPointerDownHandler,IPointerUpHandler
    {
        public Action Pressed,Released;
        public void OnPointerDown(PointerEventData eventData){Pressed?.Invoke();}
        public void OnPointerUp(PointerEventData eventData){Released?.Invoke();}
        void OnDisable(){Released?.Invoke();}
    }
}
