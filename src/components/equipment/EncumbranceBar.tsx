import { Progress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';
import {
  getEncumbranceRatio,
  getEncumbranceTier,
  getEncumbrancePenalties,
  type EncumbranceTier,
} from '@/data/equipment/encumbrance';
import type { EquipmentLoadout } from '@/data/equipment';

interface EncumbranceBarProps {
  totalWeight: number;
  carryCap: number;
  loadout: EquipmentLoadout;
}

const TIER_COLORS: Record<EncumbranceTier, string> = {
  NONE: 'bg-primary',
  LIGHT: 'bg-primary',
  MEDIUM: 'bg-arena-gold',
  HEAVY: 'bg-arena-blood',
  OVER: 'bg-destructive',
};

const TIER_TEXT: Record<EncumbranceTier, string> = {
  NONE: 'text-primary',
  LIGHT: 'text-primary',
  MEDIUM: 'text-arena-gold',
  HEAVY: 'text-arena-blood',
  OVER: 'text-destructive',
};

const TIER_LABELS: Record<EncumbranceTier, string> = {
  NONE: 'Unencumbered',
  LIGHT: 'Light',
  MEDIUM: 'Medium',
  HEAVY: 'Heavy',
  OVER: 'Over-encumbered',
};

/**
 *
 */
export function EncumbranceBar({ totalWeight, carryCap, loadout }: EncumbranceBarProps) {
  const ratio = getEncumbranceRatio(loadout, carryCap);
  const tier = getEncumbranceTier(ratio);
  const penalties = getEncumbrancePenalties(tier);
  const encPct = Math.min(100, ratio * 100);
  const hasPenalties = tier === 'HEAVY' || tier === 'OVER';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Encumbrance</span>
        <span className={`font-mono font-semibold ${TIER_TEXT[tier]}`}>
          {totalWeight} / {carryCap} · {TIER_LABELS[tier]}
        </span>
      </div>
      <Progress
        value={encPct}
        className={`h-2.5 [&>div]:${TIER_COLORS[tier]}`}
      />
      {hasPenalties && (
        <div className="space-y-1 mt-2">
          <div className={`flex items-center gap-1.5 text-xs ${TIER_TEXT[tier]} font-semibold`}>
            <AlertTriangle className="h-3.5 w-3.5" />
            {TIER_LABELS[tier]} — combat penalties apply:
          </div>
          <div className="grid grid-cols-3 gap-2 pl-5 text-[10px] font-mono">
            <div className={`${TIER_TEXT[tier]}/10 ${TIER_TEXT[tier]} p-1 rounded-none border border-current/20 text-center`}>
              {penalties.iniPenalty} INI
            </div>
            {penalties.defPenalty !== 0 && (
              <div className={`${TIER_TEXT[tier]}/10 ${TIER_TEXT[tier]} p-1 rounded-none border border-current/20 text-center`}>
                {penalties.defPenalty} DEF
              </div>
            )}
            {penalties.parPenalty !== 0 && (
              <div className={`${TIER_TEXT[tier]}/10 ${TIER_TEXT[tier]} p-1 rounded-none border border-current/20 text-center`}>
                {penalties.parPenalty} PAR
              </div>
            )}
            <div className={`${TIER_TEXT[tier]}/10 ${TIER_TEXT[tier]} p-1 rounded-none border border-current/20 text-center`}>
              +{Math.round((penalties.enduranceMult - 1) * 100)}% END
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
