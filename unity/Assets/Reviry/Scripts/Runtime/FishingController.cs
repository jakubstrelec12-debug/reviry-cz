using System;
using System.IO;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using Reviry.Core;
namespace Reviry
{
    public sealed class FishingController : MonoBehaviour
    {
        public FishingSimulation Game {get;private set;}
        Camera view;float yaw,pitch;bool menuOpen,appPaused;Font font;
        Text title,hint,stats,actionLabel,journalText;Button action,net,retrieve,lift;Slider drag;GameObject modal;Image charge;
        readonly List<CatchRecord> records=new List<CatchRecord>();
        [Serializable] class Journal {public CatchRecord[] catches;}
        string SavePath=>Path.Combine(Application.persistentDataPath,"vajgar-journal.json");
        public void Initialise(Camera camera,Geography geography)
        {
            view=camera;Game=new FishingSimulation();var e=view.transform.eulerAngles;yaw=e.y;pitch=e.x>180?e.x-360:e.x;Load();BuildUI();Game.Event+=OnEvent;
            var rig=gameObject.AddComponent<FishingRig>();rig.Initialise(camera,Game);
        }
        void Update()
        {
            if(Game==null)return;Game.Tick(Time.deltaTime);UpdateUI();
            if(Input.GetKeyDown(KeyCode.Space))ActDown();if(Input.GetKeyUp(KeyCode.Space))ActUp();
            if(Input.GetKeyDown(KeyCode.Escape))ToggleMenu();
        }
        void ActDown()
        {
            if(Game.Paused)return;
            switch(Game.Phase){case FishingPhase.Ready:case FishingPhase.Escaped:Game.BeginCast();break;case FishingPhase.Bite:Game.Grab();break;case FishingPhase.Held:Game.Strike();break;case FishingPhase.Fighting:Game.Reeling=true;break;}
        }
        void ActUp(){if(Game.Phase==FishingPhase.Charging)Game.ReleaseCast();Game.Reeling=false;}
        void Look(Vector2 delta){if(menuOpen||appPaused)return;yaw+=delta.x*.12f;pitch=Mathf.Clamp(pitch-delta.y*.1f,-45,55);view.transform.rotation=Quaternion.Euler(pitch,yaw,0);}
        void Pause(){Game.Pause(menuOpen||appPaused||Game.Phase==FishingPhase.Landed);}
        void OnApplicationPause(bool value){appPaused=value;if(Game!=null)Pause();}
        void OnApplicationFocus(bool focus){appPaused=!focus;if(Game!=null)Pause();}
        void OnEvent(string name)
        {
            if(name=="landed")
            {
                records.Insert(0,Game.Fish);if(records.Count>100)records.RemoveAt(100);Save();menuOpen=true;modal.SetActive(true);UpdateJournal();Pause();
            }
#if UNITY_IOS
            if(name=="bite"||name=="hooked")Handheld.Vibrate();
#endif
        }
        void Load(){try{if(File.Exists(SavePath)){var data=JsonUtility.FromJson<Journal>(File.ReadAllText(SavePath));if(data?.catches!=null)foreach(var c in data.catches)if(c!=null&&!string.IsNullOrEmpty(c.Species)&&c.WeightKg>0&&c.LengthCm>0&&records.Count<100)records.Add(c);}}catch(Exception e){Debug.LogWarning("Journal could not be read: "+e.Message);}}
        void Save(){try{var tmp=SavePath+".tmp";File.WriteAllText(tmp,JsonUtility.ToJson(new Journal{catches=records.ToArray()}));File.Copy(tmp,SavePath,true);File.Delete(tmp);}catch(Exception e){hint.text="Úlovek se nepodařilo uložit.";Debug.LogWarning(e.Message);}}
        void ToggleMenu(){if(Game.Phase==FishingPhase.Landed){Game.ReleaseFish();}menuOpen=!menuOpen;modal.SetActive(menuOpen);if(menuOpen)UpdateJournal();Pause();}
        void UpdateJournal()
        {
            var text=new System.Text.StringBuilder("RYBÁŘSKÝ DENÍK\n\n");foreach(var c in records)text.AppendLine($"{c.Species}   {c.WeightKg:0.00} kg / {c.LengthCm} cm");
            if(records.Count==0)text.AppendLine("První stránka čeká na tvůj úlovek.");
            text.AppendLine("\nPodrž NAHODIT a pusť. Po pohybu čihátka vezmi prut, potom zasekni. Při výpadu povol brzdu a přestaň navíjet. Unavenou rybu do 4 metrů podeber.");
            text.AppendLine("\nPracovní nativní verze. Geografické půdorysy: © OpenStreetMap contributors, ODbL. Materiály a strom: Poly Haven, CC0. Výšky, vegetace a modely vybavení jsou aproximace.");journalText.text=text.ToString();
        }
        void UpdateUI()
        {
            string label="NAHODIT",message="Podrž tlačítko a uvolněním nahoď.",heading="Klid před záběrem.";
            switch(Game.Phase)
            {
                case FishingPhase.Charging:label="PUSTIT";heading="Nához";message="Uvolni tlačítko a nahoď.";break;
                case FishingPhase.Flying:label="LETÍ…";heading="Nástraha míří na místo.";break;
                case FishingPhase.Waiting:label="ČEKÁM";heading="Teď jen ty a voda.";message="Sleduj mechanické čihátko pod prutem.";break;
                case FishingPhase.Bite:label="VZÍT PRUT";heading="Záběr!";message="Vezmi prut do ruky a pak zasekni.";break;
                case FishingPhase.Held:label="ZASEKNOUT";heading="Teď zasekni.";message="Zvedni špičku a napni vlasec.";break;
                case FishingPhase.Fighting:label="NAVÍJET";heading="Drž kontakt s rybou.";message=Game.Tension>.85f?"Povol brzdu a pusť navíjení!":"Drž NAVÍJET a hlídej napětí vlasce.";break;
                case FishingPhase.Landed:label="ÚLOVEK";heading="Ryba je v podběráku.";message="Zapsáno do deníku.";break;
                case FishingPhase.Escaped:label="ZKUSIT ZNOVU";heading="Tak příště.";message=Game.Failure;break;
            }
            title.text=heading;hint.text=message;actionLabel.text=label;action.interactable=Game.Phase!=FishingPhase.Waiting&&Game.Phase!=FishingPhase.Flying&&Game.Phase!=FishingPhase.Landed;
            bool fight=Game.Phase==FishingPhase.Fighting;stats.gameObject.SetActive(fight);lift.gameObject.SetActive(fight);drag.gameObject.SetActive(fight);net.gameObject.SetActive(fight);net.interactable=Game.CanLand;retrieve.gameObject.SetActive(Game.Phase==FishingPhase.Waiting||Game.Phase==FishingPhase.Bite||Game.Phase==FishingPhase.Held);
            stats.text=$"{Game.Distance:0.0} m   •   Únava {(1-Game.Stamina)*100:0} %   •   Napětí {Game.Tension*100:0} %";
            charge.transform.parent.gameObject.SetActive(Game.Phase==FishingPhase.Charging);charge.fillAmount=Game.Charge;
        }
        void BuildUI()
        {
            if(FindFirstObjectByType<EventSystem>()==null){var e=new GameObject("Event system");e.AddComponent<EventSystem>();e.AddComponent<StandaloneInputModule>();}
            font=Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");var canvasGo=new GameObject("Fishing interface");var canvas=canvasGo.AddComponent<Canvas>();canvas.renderMode=RenderMode.ScreenSpaceOverlay;
            var scaler=canvasGo.AddComponent<CanvasScaler>();scaler.uiScaleMode=CanvasScaler.ScaleMode.ScaleWithScreenSize;scaler.referenceResolution=new Vector2(1280,720);scaler.matchWidthOrHeight=.5f;canvasGo.AddComponent<GraphicRaycaster>();
            var safe=Panel("Safe area",canvasGo.transform,new Color(0,0,0,0),Vector2.zero,Vector2.one);safe.AddComponent<SafeAreaPanel>();
            var look=Panel("Look surface",safe.transform,new Color(0,0,0,0),Vector2.zero,Vector2.one);look.AddComponent<LookSurface>().Dragged=Look;
            var brand=Label("REVÍRY   /   VAJGAR",safe.transform,26,TextAnchor.UpperLeft);Place(brand.rectTransform,new Vector2(0,1),new Vector2(0,1),new Vector2(28,-24),new Vector2(500,60));
            var menu=MakeButton("DENÍK",safe.transform,new Vector2(1,1),new Vector2(-80,-42),new Vector2(110,48));menu.onClick.AddListener(ToggleMenu);
            title=Label("",safe.transform,32,TextAnchor.LowerLeft);Place(title.rectTransform,Vector2.zero,Vector2.zero,new Vector2(28,105),new Vector2(700,50));
            hint=Label("",safe.transform,18,TextAnchor.LowerLeft);Place(hint.rectTransform,Vector2.zero,Vector2.zero,new Vector2(28,66),new Vector2(700,40));
            stats=Label("",safe.transform,19,TextAnchor.LowerLeft);Place(stats.rectTransform,Vector2.zero,Vector2.zero,new Vector2(28,160),new Vector2(800,36));
            action=MakeButton("NAHODIT",safe.transform,new Vector2(1,0),new Vector2(-125,60),new Vector2(210,76));actionLabel=action.GetComponentInChildren<Text>();var hold=action.gameObject.AddComponent<HoldButton>();hold.Pressed=ActDown;hold.Released=ActUp;
            lift=MakeButton("ZVEDNOUT PRUT",safe.transform,new Vector2(1,0),new Vector2(-125,145),new Vector2(210,52));var liftHold=lift.gameObject.AddComponent<HoldButton>();liftHold.Pressed=()=>{if(!Game.Paused&&Game.Phase==FishingPhase.Fighting)Game.Lifting=true;};liftHold.Released=()=>Game.Lifting=false;
            net=MakeButton("PODEBRAT",safe.transform,new Vector2(1,0),new Vector2(-350,60),new Vector2(180,76));net.onClick.AddListener(()=>Game.Land());
            retrieve=MakeButton("STÁHNOUT",safe.transform,new Vector2(1,0),new Vector2(-350,60),new Vector2(180,76));retrieve.onClick.AddListener(()=>Game.Retrieve());
            var chargeTrack=Panel("Charge",safe.transform,new Color(.1f,.2f,.2f,.8f),Vector2.zero,Vector2.zero);Place((RectTransform)chargeTrack.transform,Vector2.zero,Vector2.zero,new Vector2(28,45),new Vector2(340,6));charge=Panel("Fill",chargeTrack.transform,new Color(.85f,.74f,.47f),Vector2.zero,Vector2.one).GetComponent<Image>();charge.type=Image.Type.Filled;charge.fillMethod=Image.FillMethod.Horizontal;
            var dragGo=Panel("Drag",safe.transform,new Color(.12f,.2f,.18f,.8f),Vector2.zero,Vector2.zero);Place((RectTransform)dragGo.transform,Vector2.zero,Vector2.zero,new Vector2(28,27),new Vector2(340,25));drag=dragGo.AddComponent<Slider>();drag.minValue=.08f;drag.maxValue=.95f;drag.value=.48f;var handle=Panel("Handle",dragGo.transform,new Color(.85f,.74f,.47f),Vector2.zero,Vector2.zero).GetComponent<RectTransform>();handle.sizeDelta=new Vector2(18,30);drag.handleRect=handle;drag.targetGraphic=handle.GetComponent<Image>();drag.onValueChanged.AddListener(v=>Game.Drag=v);
            modal=Panel("Journal",safe.transform,new Color(.04f,.1f,.12f,.97f),new Vector2(.14f,.12f),new Vector2(.86f,.9f));journalText=Label("",modal.transform,18,TextAnchor.UpperLeft);journalText.rectTransform.anchorMin=Vector2.zero;journalText.rectTransform.anchorMax=Vector2.one;journalText.rectTransform.offsetMin=new Vector2(30,75);journalText.rectTransform.offsetMax=new Vector2(-30,-25);journalText.resizeTextForBestFit=true;journalText.resizeTextMinSize=12;journalText.resizeTextMaxSize=18;
            var close=MakeButton("ZAVŘÍT / PUSTIT RYBU",modal.transform,new Vector2(.5f,0),new Vector2(0,40),new Vector2(300,50));close.onClick.AddListener(ToggleMenu);modal.SetActive(false);
        }
        GameObject Panel(string name,Transform parent,Color color,Vector2 min,Vector2 max){var g=new GameObject(name,typeof(RectTransform),typeof(Image));g.transform.SetParent(parent,false);var r=(RectTransform)g.transform;r.anchorMin=min;r.anchorMax=max;r.offsetMin=r.offsetMax=Vector2.zero;g.GetComponent<Image>().color=color;return g;}
        Text Label(string value,Transform parent,int size,TextAnchor alignment){var g=new GameObject("Text",typeof(RectTransform),typeof(Text));g.transform.SetParent(parent,false);var t=g.GetComponent<Text>();t.font=font;t.fontSize=size;t.color=new Color(.96f,.95f,.89f);t.text=value;t.alignment=alignment;t.raycastTarget=false;return t;}
        Button MakeButton(string label,Transform parent,Vector2 anchor,Vector2 pos,Vector2 size){var g=Panel(label,parent,new Color(.15f,.24f,.24f,.94f),anchor,anchor);Place((RectTransform)g.transform,anchor,anchor,pos,size);var b=g.AddComponent<Button>();var text=Label(label,g.transform,18,TextAnchor.MiddleCenter);text.rectTransform.anchorMin=Vector2.zero;text.rectTransform.anchorMax=Vector2.one;text.rectTransform.offsetMin=text.rectTransform.offsetMax=Vector2.zero;return b;}
        static void Place(RectTransform r,Vector2 min,Vector2 max,Vector2 pos,Vector2 size){r.anchorMin=min;r.anchorMax=max;r.pivot=new Vector2(.5f,.5f);if(min==Vector2.zero&&max==Vector2.zero)r.pivot=Vector2.zero;else if(min==new Vector2(0,1))r.pivot=new Vector2(0,1);r.anchoredPosition=pos;r.sizeDelta=size;}
    }
}
