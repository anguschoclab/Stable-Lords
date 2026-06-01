import { type PoolWarrior, type RecruitTier, TIER_STARS } from '@/engine/recruitment';
import { type PotentialScoutReport } from '@/engine/recruitScouting';
import { potentialRating, potentialGrade } from '@/engine/potential';
import { ATTRIBUTE_KEYS } from '@/types/game';
import { Badge } from '@/components/ui/badge';
import { StatBadge } from '@/components/ui/WarriorBadges';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import {
  Eye,
  Heart,
  Zap,
  Quote,
  Star,
  Coins,
  Sword,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const TIER_CONFIG: Record<
  RecruitTier,
  { border: string; text: string; bg: string; ring: 'bronze' | 'silver' | 'gold' | 'blood' }
> = {
  Common: {
    border: 'border-white/10',
    text: 'text-muted-foreground',
    bg: 'bg-white/5',
    ring: 'bronze',
  },
  Promising: {
    border: 'border-white/20',
    text: 'text-foreground',
    bg: 'bg-white/10',
    ring: 'silver',
  },
  Exceptional: {
    border: 'border-primary/30',
    text: 'text-primary',
    bg: 'bg-primary/5',
    ring: 'blood',
  },
  Prodigy: {
    border: 'border-arena-gold/30',
    text: 'text-arena-gold',
    bg: 'bg-arena-gold/5',
    ring: 'gold',
  },
};

function TierBadge({ tier }: { tier: RecruitTier }) {
  const stars = TIER_STARS[tier];
  const config = TIER_CONFIG[tier];
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[9px] gap-1.5 font-black uppercase tracking-[0.2em] px-3 py-1 rounded-none border-white/10',
        config.text
      )}
    >
      {stars > 0 && (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={`star-${i}`} className="h-2 w-2 fill-current" />
          ))}
        </div>
      )}
      {tier}
    </Badge>
  );
}

function StatBar({ label, value, max = 21 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const colorClass = value >= 16 ? 'bg-primary' : value >= 12 ? 'bg-arena-gold' : 'bg-white/20';

  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-black uppercase text-muted-foreground/40 w-8 tracking-tighter">
        {label.slice(0, 3)}
      </span>
      <div className="flex-1 h-1 bg-white/5 rounded-none overflow-hidden relative">
        <div
          className={cn('h-full transition-all duration-1000 ease-out', colorClass)}
          style={{ width: `${pct}%` }}
        />
        {/* Threshold Markers */}
        <div className="absolute top-0 left-[60%] w-px h-full bg-white/10" />
        <div className="absolute top-0 left-[80%] w-px h-full bg-white/10" />
      </div>
      <span className="text-[11px] font-display font-black w-6 text-right text-foreground">
        {value}
      </span>
    </div>
  );
}

interface RecruitCardProps {
  warrior: PoolWarrior;
  canAfford: boolean;
  rosterFull: boolean;
  onRecruit: (w: PoolWarrior, bonus?: boolean) => void;
  isScouted: boolean;
  onScout: (w: PoolWarrior) => void;
  canAffordScout: boolean;
  canAffordBonus: boolean;
  scoutReport?: PotentialScoutReport;
}

export function RecruitCard({
  warrior,
  canAfford,
  rosterFull,
  onRecruit,
  isScouted,
  onScout,
  canAffordScout,
  canAffordBonus,
  scoutReport,
}: RecruitCardProps) {
  const grade = potentialGrade(potentialRating(warrior.potential));
  const config = TIER_CONFIG[warrior.tier];

  return (
    <Surface
      variant="glass"
      className="group p-0 border-white/5 hover:border-primary/20 transition-all duration-500 overflow-hidden"
    >
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <ImperialRing size="md" variant={config.ring}>
              <Sword className={cn('h-5 w-5', config.text)} />
            </ImperialRing>
            <div>
              <h3 className="text-xl font-display font-black uppercase tracking-tight text-foreground leading-none mb-2">
                {warrior.name}
              </h3>
              <div className="flex items-center gap-4">
                <StatBadge styleName={warrior.style} showFullName />
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
                  Age {warrior.age}
                </span>
              </div>
            </div>
          </div>
          <TierBadge tier={warrior.tier} />
        </div>

        {/* Intelligence Overlay */}
        {isScouted ? (
          <div className="bg-primary/5 border border-primary/20 p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  Intelligence Synchronized
                </span>
              </div>
              <Badge className="bg-primary text-primary-foreground font-black text-[10px] rounded-none px-3">
                POTENTIAL: {grade}
              </Badge>
            </div>
            {scoutReport && (
              <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                "{scoutReport.summary}"
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/5 p-6 flex items-center justify-between group/scout">
            <div className="flex items-center gap-3 opacity-40">
              <Info className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Personnel Intel Redacted
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[9px] font-black uppercase tracking-widest border-white/10 hover:border-primary/50 transition-all rounded-none"
              disabled={!canAffordScout}
              onClick={() => onScout(warrior)}
            >
              Scout Profile [25G]
            </Button>
          </div>
        )}

        {/* Attributes Grid */}
        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-4 bg-white/[0.01] border border-white/5 p-6">
            {ATTRIBUTE_KEYS.map((key) => (
              <StatBar key={key} label={key} value={warrior.attributes[key]} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">
                Health Capacity
              </span>
              <div className="flex items-center gap-3">
                <Heart className="h-3.5 w-3.5 text-destructive" />
                <span className="text-lg font-display font-black text-foreground">
                  {warrior.derivedStats.hp}
                </span>
              </div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">
                Endurance Pool
              </span>
              <div className="flex items-center gap-3">
                <Zap className="h-3.5 w-3.5 text-arena-fame" />
                <span className="text-lg font-display font-black text-foreground">
                  {warrior.derivedStats.endurance}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lore / Quote */}
        <div className="relative pl-6 border-l border-white/10">
          <Quote className="absolute -left-1 top-0 h-4 w-4 text-white/5" />
          <p className="text-[11px] text-muted-foreground/60 italic leading-relaxed">
            {warrior.lore}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 pt-8 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
              Contract Value
            </span>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-arena-gold" />
              <span className="text-2xl font-display font-black text-arena-gold">
                {warrior.cost}G
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="flex-1 sm:flex-none h-14 px-8 bg-primary text-primary-foreground font-black uppercase text-[11px] tracking-[0.2em] rounded-none hover:shadow-[0_0_25px_rgba(135,34,40,0.4)] transition-all"
              disabled={!canAfford || rosterFull}
              onClick={() => onRecruit(warrior, false)}
            >
              <UserPlus className="h-4 w-4 mr-3" />
              Contract Secure
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none h-14 px-6 border-arena-gold/30 text-arena-gold font-black uppercase text-[10px] tracking-widest rounded-none hover:bg-arena-gold/5 transition-all"
              disabled={!canAffordBonus || rosterFull}
              onClick={() => onRecruit(warrior, true)}
              title="Pay a 50g signing bonus — warrior arrives eager (+2 XP) and gets a gazette mention."
            >
              + Bonus [50G]
            </Button>
          </div>
        </div>
      </div>
    </Surface>
  );
}
