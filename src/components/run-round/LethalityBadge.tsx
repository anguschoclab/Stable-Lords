import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import type { Warrior } from '@/types/game';

interface LethalityBadgeProps {
  wA: Warrior;
  wB: Warrior;
  crowdMood: string;
}

/** HP breakpoints — a fighter below them raises the lethality read. */
const HP_RISK = { CRITICAL: 15, LOW: 25 } as const;
/** Score bands — which badge tier the total renders. */
const RISK_BAND = { HIGH: 4, MODERATE: 2 } as const;

function getLethalityScore(wA: Warrior, wB: Warrior, crowdMood: string) {
  let score = 0;
  // Lower HP = higher risk
  const hpA = wA.derivedStats?.hp ?? 0;
  const hpB = wB.derivedStats?.hp ?? 0;

  if (hpA < HP_RISK.CRITICAL || hpB < HP_RISK.CRITICAL) score += 2;
  else if (hpA < HP_RISK.LOW || hpB < HP_RISK.LOW) score += 1;

  const powerStyles = ['Bashing Attack', 'Striking Attack', 'Slashing Attack', 'Lunging Attack'];
  if (powerStyles.includes(wA.style)) score += 1;
  if (powerStyles.includes(wB.style)) score += 1;

  if (crowdMood === 'Bloodthirsty') score += 2;
  else if (crowdMood === 'Restless') score += 1;

  return score;
}

/**
 * Lethality badge.
 * @param - { w a, w b, crowd mood }.
 */
export function LethalityBadge({ wA, wB, crowdMood }: LethalityBadgeProps) {
  const score = getLethalityScore(wA, wB, crowdMood);

  if (score >= RISK_BAND.HIGH) {
    return (
      <Badge
        variant="outline"
        className="border-destructive/50 text-destructive bg-destructive/5 gap-1.5 font-black uppercase text-[9px] tracking-widest px-2.5"
      >
        <Shield className="h-3 w-3" /> High Lethality Risk
      </Badge>
    );
  }
  if (score >= RISK_BAND.MODERATE) {
    return (
      <Badge
        variant="outline"
        className="border-arena-gold/50 text-arena-gold bg-arena-gold/5 gap-1.5 font-black uppercase text-[9px] tracking-widest px-2.5"
      >
        <Shield className="h-3 w-3" /> Moderate Danger
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-border/40 text-muted-foreground/60 gap-1.5 font-black uppercase text-[9px] tracking-widest px-2.5"
    >
      <Shield className="h-3 w-3" /> Standard Bout
    </Badge>
  );
}
