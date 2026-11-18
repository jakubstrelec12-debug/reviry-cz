using NUnit.Framework;
using Reviry.Core;
namespace Reviry.Tests
{
    public sealed class FishingTests
    {
        static void Step(FishingSimulation game,float seconds){for(int i=0;i<seconds*20;i++)game.Tick(.05f);}
        static FishingSimulation Hook(){var game=new FishingSimulation(()=>.1);game.BeginCast();Step(game,.5f);game.ReleaseCast();for(int i=0;i<600&&game.Phase!=FishingPhase.Bite;i++)game.Tick(.05f);Assert.That(game.Grab());Assert.That(game.Strike());return game;}
        [Test]public void CompleteCatch(){var game=Hook();game.Reeling=true;Step(game,80);Assert.That(game.CanLand);Assert.That(game.Land());Assert.That(game.Fish.CaughtAtUtc,Is.Not.Empty);Assert.That(game.Land(),Is.False);}
        [Test]public void PauseFreezesTime(){var game=Hook();game.Pause(true);float before=game.Time;Step(game,100);Assert.That(game.Time,Is.EqualTo(before));Assert.That(game.Reeling,Is.False);}
        [Test]public void CannotNetFreshFish(){var game=Hook();Assert.That(game.Land(),Is.False);}
        [Test]public void PausingChargeCancelsIt(){var game=new FishingSimulation(()=>0);game.BeginCast();game.Pause(true);Assert.That(game.Phase,Is.EqualTo(FishingPhase.Ready));}
        [Test]public void MissedBiteTimesOut(){var game=new FishingSimulation(()=>0);game.BeginCast();game.ReleaseCast();Step(game,22);Assert.That(game.Phase,Is.EqualTo(FishingPhase.Escaped));}
    }
}
