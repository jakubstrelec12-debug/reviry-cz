using System;
using Reviry.Core;
static class Program
{
    static int passed;
    static void Check(bool ok,string name){if(!ok)throw new Exception("FAILED: "+name);passed++;Console.WriteLine("PASS "+name);}
    static void Step(FishingSimulation s,float seconds){for(int i=0;i<(int)(seconds*20);i++)s.Tick(.05f);}
    static FishingSimulation Hooked(Func<double> random=null)
    {var s=new FishingSimulation(random??(()=>.1));s.BeginCast();Step(s,.5f);s.ReleaseCast();for(int i=0;i<600&&s.Phase!=FishingPhase.Bite;i++)s.Tick(.05f);if(s.Phase!=FishingPhase.Bite)throw new Exception("No bite");s.Grab();s.Strike();return s;}
    static void Main()
    {
        var g=Hooked();g.Reeling=true;Step(g,80);Check(g.CanLand,"complete cast / grab / strike / controlled fight");Check(g.Land()&&g.Phase==FishingPhase.Landed,"net and catch record");Check(!g.Land(),"cannot duplicate a catch");Check(!string.IsNullOrEmpty(g.Fish.CaughtAtUtc),"UTC catch timestamp");Check(g.ReleaseFish()&&g.Phase==FishingPhase.Ready,"release and return to water");
        g=Hooked();g.Pause(true);float before=g.Time;Step(g,100);Check(g.Time==before&&!g.BeginCast(),"pause freezes simulation and rejects input");
        g=new FishingSimulation(()=>0);g.BeginCast();g.Pause(true);Check(g.Phase==FishingPhase.Ready,"interrupted charge cancels safely");
        g=new FishingSimulation(()=>0);g.BeginCast();g.ReleaseCast();Step(g,22);Check(g.Phase==FishingPhase.Escaped,"unattended bite times out");
        g=new FishingSimulation(()=>0);g.BeginCast();g.ReleaseCast();Step(g,9);g.Grab();Step(g,7);Check(g.Phase==FishingPhase.Escaped,"late strike loses fish");
        g=Hooked();Check(!g.Land()&&!g.BeginCast()&&!g.Grab(),"invalid state transitions rejected");
        int n=0;double[] seq={.1,0,.99};g=Hooked(()=>seq[n++%seq.Length]);g.Drag=.95f;g.Reeling=g.Lifting=true;Step(g,100);Check(g.Phase==FishingPhase.Escaped&&g.Failure.Contains("praskl"),"maximum drag and lifting can break line");
        g=Hooked();before=g.Time;g.Tick(float.NaN);g.Tick(float.PositiveInfinity);g.Tick(-1);Check(g.Time==before,"invalid time steps ignored");
        g=Hooked();before=g.Stamina;g.Tick(10000);Check(g.Stamina>before-.01f,"long frame cannot skip fight");
        int landed=0;for(int seed=0;seed<100;seed++)
        {var random=new Random(seed);g=Hooked(random.NextDouble);for(int i=0;i<6000&&g.Phase==FishingPhase.Fighting;i++){g.Drag=g.Tension>.8f?.25f:.55f;g.Reeling=g.Tension<.78f;g.Tick(.05f);if(g.CanLand)g.Land();}if(g.Phase==FishingPhase.Landed)landed++;}
        Check(landed==100,"100 seeded catches are landable with controlled drag");Console.WriteLine($"{passed} checks passed; 100 simulated catches landed.");
    }
}
