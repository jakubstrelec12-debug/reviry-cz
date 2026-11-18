using System;

namespace Reviry.Core
{
    public enum FishingPhase { Ready, Charging, Flying, Waiting, Bite, Held, Fighting, Landed, Escaped }
    [Serializable] public sealed class CatchRecord
    {
        public string Species = "";
        public float WeightKg;
        public int LengthCm;
        public string CaughtAtUtc = "";
    }
    public sealed class FishingSimulation
    {
        readonly Func<double> random;
        static readonly string[] Species = { "Kapr obecný", "Lín obecný", "Cejn velký" };
        static readonly float[] Min = { 1.4f, .45f, .5f }, Max = { 7.8f, 2.3f, 2.8f }, Power = { .85f, .6f, .5f };
        public FishingPhase Phase { get; private set; } = FishingPhase.Ready;
        public float Time { get; private set; }
        public float Elapsed { get; private set; }
        public float Charge { get; private set; }
        public float Distance { get; private set; }
        public float Stamina { get; private set; } = 1;
        public float Tension { get; private set; } = .25f;
        public float Drag { get; set; } = .48f;
        public bool Reeling { get; set; }
        public bool Lifting { get; set; }
        public bool Paused { get; set; }
        public string Failure { get; private set; } = "";
        public CatchRecord Fish { get; private set; }
        public event Action<string> Event;
        float biteDelay, strength, overload, slack;
        public FishingSimulation(Func<double> random = null) { this.random = random ?? new Random().NextDouble; }
        static float Clamp(float value, float min, float max) => Math.Max(min, Math.Min(max, value));
        void Change(FishingPhase phase, string name) { Phase = phase; Elapsed = 0; Event?.Invoke(name); }
        public bool BeginCast()
        {
            if (Paused || (Phase != FishingPhase.Ready && Phase != FishingPhase.Escaped)) return false;
            Charge = 0; Failure = ""; Fish = null; Change(FishingPhase.Charging, "charge"); return true;
        }
        public bool ReleaseCast()
        {
            if (Paused || Phase != FishingPhase.Charging) return false;
            Distance = 14 + Charge * 40; Reeling = Lifting = false; Change(FishingPhase.Flying, "cast"); return true;
        }
        public bool Grab()
        {
            if (Paused || Phase != FishingPhase.Bite) return false;
            Change(FishingPhase.Held, "grab"); return true;
        }
        public bool Strike()
        {
            if (Paused || Phase != FishingPhase.Held) return false;
            Tension = .38f; Stamina = 1; overload = slack = 0; Change(FishingPhase.Fighting, "hooked"); return true;
        }
        public bool CanLand => Phase == FishingPhase.Fighting && Distance <= 4 && Stamina <= .22f;
        public bool Land()
        {
            if (Paused || !CanLand) return false;
            Fish.CaughtAtUtc = DateTime.UtcNow.ToString("O"); StopInput(); Change(FishingPhase.Landed, "landed"); return true;
        }
        public bool ReleaseFish()
        {
            if (Phase != FishingPhase.Landed) return false;
            Fish = null; Change(FishingPhase.Ready, "released"); return true;
        }
        public bool Retrieve()
        {
            if (Paused || (Phase != FishingPhase.Waiting && Phase != FishingPhase.Bite && Phase != FishingPhase.Held)) return false;
            StopInput(); Change(FishingPhase.Ready, "retrieved"); return true;
        }
        public void StopInput() { Reeling = false; Lifting = false; }
        public void Pause(bool value)
        {
            Paused = value; StopInput();
            if (value && Phase == FishingPhase.Charging) Change(FishingPhase.Ready, "cancel");
        }
        void Lose(string why) { Failure = why; StopInput(); Change(FishingPhase.Escaped, "escaped"); }
        public void Tick(float deltaTime)
        {
            if (Paused || float.IsNaN(deltaTime) || float.IsInfinity(deltaTime)) return;
            var dt = Clamp(deltaTime, 0, .05f); Time += dt; Elapsed += dt; Drag = Clamp(Drag, .08f, .95f);
            switch (Phase)
            {
                case FishingPhase.Charging: Charge = Clamp(Charge + dt / 1.7f, 0, 1); break;
                case FishingPhase.Flying:
                    if (Elapsed > 1.1f) { biteDelay = 7 + (float)random() * 12; Change(FishingPhase.Waiting, "splash"); }
                    break;
                case FishingPhase.Waiting:
                    if (Elapsed >= biteDelay)
                    {
                        var i = Math.Min(2, (int)(random() * 3));
                        float kg = (float)Math.Round(Min[i] + random() * (Max[i] - Min[i]), 2);
                        Fish = new CatchRecord { Species = Species[i], WeightKg = kg, LengthCm = (int)Math.Round(22 + Math.Pow(kg, .44) * 23) };
                        strength = Power[i] * (.7f + kg / 12); Change(FishingPhase.Bite, "bite");
                    }
                    break;
                case FishingPhase.Bite: if (Elapsed > 12) Lose("Ryba pustila nástrahu."); break;
                case FishingPhase.Held: if (Elapsed > 6) Lose("Zásek přišel pozdě."); break;
                case FishingPhase.Fighting:
                    float surge = (.45f + Math.Max(0, (float)(Math.Sin(Elapsed * 1.35) + Math.Sin(Elapsed * 3.1) * .25))) * (.28f + Stamina * .72f) * strength;
                    float target = .08f + Drag * surge * .95f + (Reeling ? .16f : 0) + (Lifting ? .2f : 0);
                    Tension += (target - Tension) * Math.Min(1, dt * 2.4f);
                    Distance = Math.Max(2.2f, Distance + (surge * (1 - Drag) * 2.3f - (Reeling ? 1.9f * (.35f + Drag) : 0) - (Lifting ? .25f : 0)) * dt);
                    Stamina = Math.Max(0, Stamina - dt * (.014f + Drag * .018f + (Reeling ? .012f : 0) + (Lifting ? .012f : 0)));
                    overload = Tension > .94f ? overload + dt : Math.Max(0, overload - dt * 2);
                    slack = Tension < .13f ? slack + dt : 0;
                    if (overload > 1.15f) Lose("Vlasec praskl. Povol brzdu a přestaň navíjet při výpadu.");
                    else if (slack > 5) Lose("Povolený vlasec. Ryba se vyháčkovala.");
                    else if (Distance > 85) Lose("Ryba odjela příliš daleko.");
                    break;
            }
        }
    }
}
