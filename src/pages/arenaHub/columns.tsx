import { Link } from '@tanstack/react-router';
import { useArenaCircuitData } from '@/hooks/useArenaCircuitData';
import { championsHeldByStable } from '@/engine/championship/arenaChampionship';
import { ArenaAnalyticsSurface, type ArenaAnalyticsProps } from './sections';
import { Trophy } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { MedicalAuditWidget } from '@/components/dashboard/MedicalAuditWidget';
import { IntelligenceHubWidget } from '@/components/dashboard/IntelligenceHubWidget';
import { NextBoutWidget } from '@/components/widgets/NextBoutWidget';
import { MetaDriftWidget } from '@/components/widgets/MetaDriftWidget';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';

function CircuitCrownsWidget() {
  const { arenaChampions, roster, rivals, player } = useArenaCircuitData();
  const state = { arenaChampions, roster, rivals, player } as never;

  const held = championsHeldByStable(state, player.id);
  const total = Object.keys(arenaChampions ?? {}).length;

  return (
    <Link to="/world/arenas" className="group block">
      <Surface
        variant="glass"
        className="p-5 transition-colors group-hover:border-arena-gold/30 motion-reduce:transition-none"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-3.5 w-3.5 text-arena-gold" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
              Circuit Crowns
            </span>
          </div>
          <span className="font-display font-black text-xl text-arena-gold tracking-tighter">
            {held.length}
            <span className="text-[10px] text-muted-foreground/40 font-mono"> / {total}</span>
          </span>
        </div>
        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-black mt-3">
          {held.length === 0
            ? 'No crowns held — visit the circuit to scout venues'
            : `Crowned at ${held.length} arena${held.length === 1 ? '' : 's'} — open the circuit`}
        </p>
      </Surface>
    </Link>
  );
}

/** Left column: chronicle, next bout, medical audit. */
export function CommandColumn() {
  return (
    <div className="lg:col-span-8 flex flex-col gap-8">
      <SectionDivider label="Arena Chronicle" variant="gold" />
      <IntelligenceHubWidget />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <SectionDivider label="Next Bout" />
          <NextBoutWidget />
        </div>
        <div className="flex flex-col gap-4">
          <SectionDivider label="Medical Audit" />
          <MedicalAuditWidget />
        </div>
      </div>
    </div>
  );
}

/** Right column: conditions, style meta, crowns, analytics. */
export function ConditionsColumn({ renown, lifetimeKills, winRate }: ArenaAnalyticsProps) {
  return (
    <div className="lg:col-span-4 flex flex-col gap-8">
      <SectionDivider label="Arena Conditions" />
      <WeatherWidget />

      <SectionDivider label="Style Meta" />
      <MetaDriftWidget />

      <SectionDivider label="Arena Crowns" />
      <CircuitCrownsWidget />

      <SectionDivider label="Arena Analytics" />
      <ArenaAnalyticsSurface renown={renown} lifetimeKills={lifetimeKills} winRate={winRate} />
    </div>
  );
}
