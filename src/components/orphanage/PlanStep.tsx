import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Swords, Zap, Shield, Activity, Target, Flame, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STYLE_DISPLAY_NAMES, FightingStyle } from '@/types/game';
import type { Warrior, FightPlan, OffensiveTactic, DefensiveTactic } from '@/types/game';

const PLAN_TACTICS = [
  { id: 'Lunge', type: 'offensive' as const, label: 'Lunge', icon: Zap },
  { id: 'Slash', type: 'offensive' as const, label: 'Slash', icon: Swords },
  { id: 'Bash', type: 'offensive' as const, label: 'Bash', icon: Shield },
  { id: 'Decisiveness', type: 'offensive' as const, label: 'DEC', icon: Target },
  { id: 'Dodge', type: 'defensive' as const, label: 'Dodge', icon: Activity },
  { id: 'Parry', type: 'defensive' as const, label: 'Parry', icon: Shield },
  { id: 'Riposte', type: 'defensive' as const, label: 'Riposte', icon: Flame },
  { id: 'Responsiveness', type: 'defensive' as const, label: 'RESP', icon: Clock },
];

interface PlanStepProps {
  warrior: Warrior;
  plan: FightPlan;
  onPlanChange: (plan: FightPlan) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function PlanStep({ warrior, plan, onPlanChange, onBack, onNext }: PlanStepProps) {
  const handleTactic = (t: (typeof PLAN_TACTICS)[number]) => {
    if (t.type === 'offensive') {
      onPlanChange({ ...plan, offensiveTactic: t.id as OffensiveTactic });
    } else {
      onPlanChange({ ...plan, defensiveTactic: t.id as DefensiveTactic });
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="p-7 space-y-6"
        style={{
          background: 'linear-gradient(145deg, #150F08 0%, #110C07 100%)',
          border: '1px solid rgba(201,151,42,0.3)',
          borderTopColor: 'rgba(201,151,42,0.5)',
        }}
      >
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Set the Plan</h2>
          <p className="text-xs text-muted-foreground/50 mt-0.5">
            Strategy shapes the bout before steel is drawn
          </p>
        </div>

        <div
          className="flex items-center gap-3 p-3"
          style={{ background: 'rgba(20,15,8,0.6)', border: '1px solid rgba(60,42,22,0.5)' }}
        >
          <div className="flex-1">
            <span className="font-display font-bold text-base text-foreground">{warrior.name}</span>
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mt-0.5">
              {STYLE_DISPLAY_NAMES[warrior.style as FightingStyle] || warrior.style}
            </div>
          </div>
          <Swords className="h-4 w-4 text-muted-foreground/30" />
        </div>

        {/* Offensive Effort Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-arena-gold">
              Offensive Effort
            </span>
            <span className="text-sm font-mono font-bold text-arena-gold">{plan.OE}</span>
          </div>
          <Slider
            value={[plan.OE]}
            onValueChange={([v]) => onPlanChange({ ...plan, OE: v ?? 5 })}
            min={1}
            max={10}
            step={1}
          />
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
            <span>Cautious</span>
            <span>Reckless</span>
          </div>
        </div>

        {/* Activity Level Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-arena-fame">
              Activity Level
            </span>
            <span className="text-sm font-mono font-bold text-arena-fame">{plan.AL ?? 5}</span>
          </div>
          <Slider
            value={[plan.AL ?? 5]}
            onValueChange={([v]) => onPlanChange({ ...plan, AL: v ?? 5 })}
            min={1}
            max={10}
            step={1}
          />
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
            <span>Passive</span>
            <span>Active</span>
          </div>
        </div>

        {/* Kill Desire Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-destructive">
              Kill Desire
            </span>
            <span className="text-sm font-mono font-bold text-destructive">
              {plan.killDesire ?? 5}
            </span>
          </div>
          <Slider
            value={[plan.killDesire ?? 5]}
            onValueChange={([v]) => onPlanChange({ ...plan, killDesire: v ?? 5 })}
            min={1}
            max={10}
            step={1}
          />
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
            <span>Mercy</span>
            <span>Kill</span>
          </div>
        </div>

        {/* Tactic Buttons */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-arena-fame">
            Tactics
          </span>
          <div className="grid grid-cols-2 gap-2">
            {PLAN_TACTICS.map((t) => {
              const isActive =
                plan &&
                ((t.type === 'offensive' && plan.offensiveTactic === t.id) ||
                  (t.type === 'defensive' && plan.defensiveTactic === t.id));
              return (
                <button
                  key={t.id}
                  onClick={() => handleTactic(t)}
                  aria-label={`Select Tactic: ${t.label}`}
                  className={cn(
                    'flex items-center gap-2 p-3 text-xs font-bold uppercase tracking-wider border transition-all motion-reduce:transition-none motion-reduce:transform-none duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                    isActive
                      ? 'bg-arena-blood/20 border-arena-blood/60 text-foreground'
                      : 'bg-white/5 border-white/10 text-muted-foreground hover:border-arena-gold/40 hover:text-foreground'
                  )}
                >
                  <t.icon className="w-4 h-4 shrink-0" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/40 leading-relaxed italic">
          Your choices here determine how {warrior.name} fights. Different plans produce different
          outcomes — experiment freely.
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2 border-[rgba(60,42,22,0.8)] bg-transparent hover:bg-white/5 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 gap-2 font-display font-bold tracking-wider uppercase"
          size="lg"
        >
          To the Arena <Swords className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
