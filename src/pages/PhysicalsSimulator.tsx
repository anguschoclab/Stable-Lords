import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FightingStyle, STYLE_ABBREV, type Warrior } from '@/types/game';
import { computeWarriorStats } from '@/engine/skillCalc';
import { useGameStore } from '@/state/useGameStore';
import { filterActive } from '@/utils/roster';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { FighterConfigCard, type FighterStats } from '@/components/stable/FighterConfigCard';
import { SimulatorResults } from '@/components/stable/SimulatorResults';

/**
 * Physicals simulator.
 */
export default function PhysicalsSimulator() {
  const { roster } = useGameStore();
  const activeWarriors = filterActive(roster);

  const [styleA, setStyleA] = useState<FightingStyle>(FightingStyle.BashingAttack);
  const [styleB, setStyleB] = useState<FightingStyle>(FightingStyle.ParryRiposte);

  const [statsA, setStatsA] = useState<FighterStats>({ strength: 10, quickness: 10, vitality: 10 });
  const [statsB, setStatsB] = useState<FighterStats>({ strength: 10, quickness: 10, vitality: 10 });

  const [fighterAId, setFighterAId] = useState<string | null>(null);
  const [fighterBId, setFighterBId] = useState<string | null>(null);

  const handleSelectWarrior = (warrior: Warrior) => {
    // Toggle logic: first select fills A, second fills B if A is full
    if (fighterAId === warrior.id) {
      setFighterAId(null);
    } else if (fighterBId === warrior.id) {
      setFighterBId(null);
    } else if (!fighterAId) {
      setFighterAId(warrior.id);
      setStatsA({
        strength: warrior.attributes.ST,
        quickness: warrior.attributes.SP,
        vitality: warrior.attributes.CN,
      });
      setStyleA(warrior.style);
    } else {
      setFighterBId(warrior.id);
      setStatsB({
        strength: warrior.attributes.ST,
        quickness: warrior.attributes.SP,
        vitality: warrior.attributes.CN,
      });
      setStyleB(warrior.style);
    }
  };

  const simulation = useMemo(() => {
    const attrA = {
      ST: statsA.strength,
      SP: statsA.quickness,
      CN: statsA.vitality,
      SZ: 10,
      WL: 10,
      WT: 10,
      DF: 10,
    };
    const attrB = {
      ST: statsB.strength,
      SP: statsB.quickness,
      CN: statsB.vitality,
      SZ: 10,
      WL: 10,
      WT: 10,
      DF: 10,
    };

    const resultA = computeWarriorStats(attrA, styleA);
    const resultB = computeWarriorStats(attrB, styleB);

    const calcA = resultA.derivedStats;
    const calcB = resultB.derivedStats;

    let endA = calcA.endurance;
    let endB = calcB.endurance;
    let hpA = calcA.hp;
    let hpB = calcB.hp;

    let minutesPassed = 0;
    while (minutesPassed < 10 && endA > 0 && endB > 0 && hpA > 0 && hpB > 0) {
      minutesPassed++;
      const dmgA = Math.max(1, calcA.damage);
      hpB -= dmgA;
      endA -= 10;
      endB -= 5;

      if (hpB > 0) {
        const dmgB = Math.max(1, calcB.damage);
        hpA -= dmgB;
        endB -= 10;
        endA -= 5;
      }
    }

    return {
      calcA,
      calcB,
      endA,
      endB,
      hpA,
      hpB,
      minutesPassed,
    };
  }, [styleA, styleB, statsA, statsB]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <PageHeader
        icon={Activity}
        title="Physicals Simulator"
        subtitle="TOOLS · SIMULATION · NO RECORDS KEPT"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Archetype D: Left Rail Roster Pickers (span-3) */}
        <aside className="lg:col-span-3 space-y-6 sticky top-6">
          <div className="px-1 flex items-center justify-between">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">
              DEPLOY PILOTS
            </span>
          </div>

          <Surface
            variant="glass"
            className="p-0 border-white/5 max-h-[600px] overflow-y-auto thin-scrollbar"
          >
            {activeWarriors.map((warrior: Warrior) => {
              const inA = fighterAId === warrior.id;
              const inB = fighterBId === warrior.id;

              return (
                <button
                  key={warrior.id}
                  onClick={() => handleSelectWarrior(warrior)}
                  className={cn(
                    'w-full text-left p-4 border-b border-white/5 last:border-0 flex items-center gap-3 transition-all',
                    inA
                      ? 'bg-primary/10 border-l-4 border-l-primary'
                      : inB
                        ? 'bg-destructive/10 border-l-4 border-l-destructive'
                        : 'hover:bg-white/[0.02]'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-xs font-black uppercase truncate',
                        inA ? 'text-primary' : inB ? 'text-destructive' : ''
                      )}
                    >
                      {warrior.name}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase mt-1">
                      {STYLE_ABBREV[warrior.style as FightingStyle] ?? warrior.style}
                    </p>
                  </div>
                  {inA && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] font-black h-4 px-1">
                      PILOT_A
                    </Badge>
                  )}
                  {inB && (
                    <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[8px] font-black h-4 px-1">
                      PILOT_B
                    </Badge>
                  )}
                </button>
              );
            })}
          </Surface>

          <div className="p-4 bg-secondary/10 border border-white/5">
            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
              "Calculated risk is the bridge between a legend and a corpse. Run the numbers before
              you run the sand."
            </p>
          </div>
        </aside>

        <main className="lg:col-span-9 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FighterConfigCard
              label="Fighter A"
              style={styleA}
              setStyle={setStyleA}
              stats={statsA}
              setStats={setStatsA}
            />
            <FighterConfigCard
              label="Fighter B"
              style={styleB}
              setStyle={setStyleB}
              stats={statsB}
              setStats={setStatsB}
            />
          </div>

          <SimulatorResults simulation={simulation} />
        </main>
      </div>
    </div>
  );
}
