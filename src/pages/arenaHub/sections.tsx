import { BarChart3, Activity, Swords, Shield, Star, Skull } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { MatchCard } from '@/components/run-round/MatchCard';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { isActive } from '@/engine/warrior/warriorStatus';

/** Right-rail Stable Stats block — renown, lifetime kills, win velocity. */
export function ArenaAnalyticsSurface({
  renown,
  lifetimeKills,
  winRate,
}: {
  renown: number;
  lifetimeKills: number;
  winRate: number;
}) {
  const rowClass =
    'text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 group-hover:text-foreground/80 transition-colors motion-reduce:transition-none';
  const valueClass = 'font-display font-black text-xl tracking-tighter';
  return (
    <Surface
      variant="glass"
      className="p-6 space-y-6 bg-gradient-to-br from-white/[0.01] to-white/[0.03]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImperialRing size="sm" variant="blood">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
          </ImperialRing>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
            Stable Stats
          </span>
        </div>
        <Activity className="h-3.5 w-3.5 text-primary animate-pulse motion-reduce:animate-none" />
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center group">
          <span className={rowClass}>Stable Renown</span>
          <span className={`${valueClass} text-arena-fame`}>{renown}</span>
        </div>
        <div className="flex justify-between items-center group">
          <span className={rowClass}>Lifetime Kills</span>
          <span className={`${valueClass} text-destructive`}>{lifetimeKills}</span>
        </div>
        <div className="flex justify-between items-center group">
          <span className={rowClass}>Win Velocity</span>
          <span className={`${valueClass} text-primary`}>{Math.round(winRate * 100)}%</span>
        </div>
      </div>

      <div className="pt-6 border-t border-white/5">
        <p className="text-[9px] text-muted-foreground/30 leading-relaxed uppercase tracking-[0.2em] font-black italic">
          Season record updated after each bout.
        </p>
      </div>
    </Surface>
  );
}

/** Bottom status strip — season/week, active warriors, rivals, career kills. */
export function ArenaStatusStrip({
  gameState,
  roster,
  lifetimeKills,
}: {
  gameState: GameState;
  roster: Warrior[];
  lifetimeKills: number;
}) {
  const itemClass =
    'flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap text-muted-foreground/60';
  return (
    <div className="py-12 flex flex-wrap items-center justify-center gap-x-16 gap-y-6 px-6 border-t border-white/5 mt-12 transition-all duration-700 motion-reduce:transition-none">
      <div className={itemClass}>
        <Swords className="h-3.5 w-3.5 text-primary" /> {gameState.season} · Wk {gameState.week}
      </div>
      <div className={itemClass}>
        <Shield className="h-3.5 w-3.5 text-accent" /> {roster.filter((w) => isActive(w)).length}{' '}
        Active Warriors
      </div>
      <div className={itemClass}>
        <Star className="h-3.5 w-3.5 text-arena-gold" /> {gameState.rivals.length} Rival Stables
      </div>
      <div className={itemClass}>
        <Skull className="h-3.5 w-3.5 text-destructive" /> {lifetimeKills} Career Kills
      </div>
    </div>
  );
}

/** "This Week's Fight Card" preview block — anchors the VIEW CARD CTA. */
export function FightCardPreview({
  matchCard,
  crowdMood,
}: {
  matchCard: ReturnType<typeof import('@/components/run-round/buildMatchCard').buildMatchCard>;
  crowdMood: GameState['crowdMood'];
}) {
  if (matchCard.length === 0) return null;
  return (
    <>
      <span id="fight-card" className="block scroll-mt-24" />
      <SectionDivider label="This Week's Fight Card" variant="primary" />
      <Surface variant="glass" className="p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {matchCard.map((p, i) => (
            <MatchCard
              key={i}
              pairing={{
                a: p.playerWarrior,
                d: p.rivalWarrior,
                rivalStable: p.rivalStable?.owner?.stableName || 'Rival Stable',
                isRivalry: p.isRivalryBout,
              }}
              crowdMood={crowdMood}
            />
          ))}
        </div>
      </Surface>
    </>
  );
}
