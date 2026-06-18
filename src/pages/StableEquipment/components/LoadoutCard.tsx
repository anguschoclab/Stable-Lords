import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Swords, HardHat, Shirt, HelpCircle, AlertTriangle } from 'lucide-react';
import { checkWeaponRequirements } from '@/data/equipment';
import { GearRow } from './GearRow';
import type { Warrior } from '@/types/state.types';
import type { EquipmentLoadout } from '@/data/equipment';

interface LoadoutRec {
  label: string;
  description: string;
  synergy: number;
  totalWeight: number;
  loadout: EquipmentLoadout;
  breakdown: {
    weapon: { item: { name: string; weight: number } };
    armor: { item: { name: string; weight: number } };
    shield: { item: { name: string; weight: number }; blocked?: boolean };
    helm: { item: { name: string; weight: number } };
  };
}

interface LoadoutCardProps {
  rec: LoadoutRec;
  index: number;
  carryCap: number;
  targetWarrior: Warrior | undefined;
  onApply: (loadout: EquipmentLoadout, label: string) => void;
  disabled: boolean;
}

export function LoadoutCard({
  rec,
  index,
  carryCap,
  targetWarrior,
  onApply,
  disabled,
}: LoadoutCardProps) {
  const isTop = index === 0;
  const reqCheck =
    targetWarrior && rec.loadout.weapon
      ? checkWeaponRequirements(rec.loadout.weapon, targetWarrior.attributes)
      : null;

  return (
    <Surface
      padding="none"
      className={cn(
        'transition-all group overflow-hidden flex flex-col',
        isTop
          ? 'border-primary/40 shadow-[0_0_50px_-20px_rgba(var(--primary-rgb),0.3)] ring-1 ring-primary/20'
          : 'border-white/5 hover:border-white/10'
      )}
    >
      <div
        className={cn('p-6 space-y-4 flex-1 flex flex-col', isTop ? 'bg-primary/5' : 'bg-black/20')}
      >
        <div className="flex items-center justify-between">
          <Badge className="bg-primary/20 text-primary border-primary/20 font-black uppercase text-[8px] tracking-[0.2em] px-2 py-0 border">
            {rec.synergy}% SYNERGY
          </Badge>
          {isTop && (
            <Badge className="bg-arena-gold text-primary-foreground font-black uppercase text-[8px] tracking-[0.2em] px-2 py-0 border-none">
              OPTIMAL PATH
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="font-display text-lg font-black uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">
            {rec.label}
          </h3>
          <p className="text-[10px] text-muted-foreground/80 leading-relaxed italic pr-4">
            &ldquo;{rec.description}&rdquo;
          </p>
        </div>

        <div className="space-y-2.5 pt-4 border-t border-white/5">
          <GearRow
            icon={Swords}
            name={rec.breakdown.weapon.item.name}
            weight={rec.breakdown.weapon.item.weight}
            error={!!(reqCheck && !reqCheck.met)}
            high={isTop}
          />
          <GearRow
            icon={Shirt}
            name={rec.breakdown.armor.item.name}
            weight={rec.breakdown.armor.item.weight}
            high={isTop}
          />
          <GearRow
            icon={Shield}
            name={rec.breakdown.shield.item.name}
            weight={rec.breakdown.shield.item.weight}
            blocked={rec.breakdown.shield.blocked}
            high={isTop}
          />
          <GearRow
            icon={HardHat}
            name={rec.breakdown.helm.item.name}
            weight={rec.breakdown.helm.item.weight}
            high={isTop}
          />
        </div>

        {reqCheck && !reqCheck.met && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 space-y-2 mt-4">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase text-destructive tracking-[0.3em]">
              <AlertTriangle className="h-3 w-3" /> Stat Requirement Failed
            </div>
            <div className="flex flex-wrap gap-2">
              {reqCheck.failures.map(
                (f: { stat: string; current: number; required: number }, fi: number) => (
                  <div
                    key={fi}
                    className="text-[9px] font-mono font-black text-destructive/80 uppercase"
                  >
                    {`[${f.stat}: ${f.current} < ${f.required}]`}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-6 mt-auto">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] mb-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 text-muted-foreground/40 italic cursor-help">
                    System Encumbrance
                    <HelpCircle className="h-2.5 w-2.5 text-muted-foreground/30 shrink-0" />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-[240px] text-[10px] leading-relaxed space-y-1.5 p-3"
                >
                  <p className="font-black uppercase tracking-wider text-foreground">Encumbrance</p>
                  <p className="text-muted-foreground">
                    Total weight of all equipped gear (weapon + armor + shield + helm). Exceeding a
                    warrior&apos;s carry threshold reduces Speed (SP) and increases fatigue per
                    bout.
                  </p>
                  <p className="text-muted-foreground">
                    High-ST warriors tolerate heavier loads. Recommended: keep under {carryCap}{' '}
                    units for balanced fighters.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span
              className={cn(
                'font-mono font-black',
                rec.totalWeight > carryCap ? 'text-destructive' : 'text-primary'
              )}
            >
              {rec.totalWeight} / {carryCap} WT
            </span>
          </div>
          <div className="h-1 bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, (rec.totalWeight / carryCap) * 100)}%`,
              }}
              className={cn(
                'h-full',
                rec.totalWeight > carryCap
                  ? 'bg-destructive shadow-[0_0_10px_rgba(var(--destructive),0.5)]'
                  : 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]'
              )}
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-black/40 border-t border-white/5">
        <Button
          className={cn(
            'w-full h-12 font-black uppercase text-[10px] tracking-[0.4em] transition-all',
            isTop
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-white/[0.05] border-white/10 hover:bg-white/[0.1] text-foreground'
          )}
          onClick={() => onApply(rec.loadout, rec.label)}
          disabled={disabled}
        >
          Apply Loadout
        </Button>
      </div>
    </Surface>
  );
}
