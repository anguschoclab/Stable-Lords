import StepNav from '@/components/orphanage/StepNav';
import { PlanValueSlider } from '@/components/planBuilder/sections';
import { withPlanTactic, isPlanTactic, tacticButtonClasses } from '@/components/planBuilder/planTactics';
import { Swords, Zap, Shield, Activity, Target, Flame, Clock } from 'lucide-react';
import { STYLE_DISPLAY_NAMES, FightingStyle } from '@/types/game';
import type { Warrior, FightPlan } from '@/types/game';

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

function TacticGrid({
  plan,
  onSelect,
}: {
  plan: FightPlan;
  onSelect: (t: (typeof PLAN_TACTICS)[number]) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-arena-fame">
        Tactics
      </span>
      <div className="grid grid-cols-2 gap-2">
        {PLAN_TACTICS.map((t) => {
          const isActive = isPlanTactic(plan, t);
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              aria-label={`Select Tactic: ${t.label}`}
              className={tacticButtonClasses(isActive)}
            >
              <t.icon className="w-4 h-4 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface PlanStepProps {
  warrior: Warrior;
  plan: FightPlan;
  onPlanChange: (plan: FightPlan) => void;
  onBack: () => void;
  onNext: () => void;
}

/** Warrior identity row for the plan card. */
function PlanWarriorRow({ warrior }: { warrior: Warrior }) {
  return (
    <div
      className="flex items-center gap-3 p-3"
      style={{
        background: 'rgba(var(--inkwash-rgb), 0.6)',
        border: '1px solid rgba(var(--oak-rgb), 0.5)',
      }}
    >
      <div className="flex-1">
        <span className="font-display font-bold text-base text-foreground">{warrior.name}</span>
        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mt-0.5">
          {STYLE_DISPLAY_NAMES[warrior.style as FightingStyle] || warrior.style}
        </div>
      </div>
      <Swords className="h-4 w-4 text-muted-foreground/30" />
    </div>
  );
}

/**
 *
 */
export default function PlanStep({ warrior, plan, onPlanChange, onBack, onNext }: PlanStepProps) {
  const handleTactic = (t: (typeof PLAN_TACTICS)[number]) => {
    onPlanChange(withPlanTactic(plan, t));
  };

  return (
    <div className="space-y-4">
      <div
        className="p-7 space-y-6"
        style={{
          background: 'linear-gradient(145deg, var(--background) 0%, var(--card) 100%)',
          border: '1px solid rgba(var(--gold-glow-rgb), 0.3)',
          borderTopColor: 'rgba(var(--gold-glow-rgb), 0.5)',
        }}
      >
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Set the Plan</h2>
          <p className="text-xs text-muted-foreground/50 mt-0.5">
            Strategy shapes the bout before steel is drawn
          </p>
        </div>

        <PlanWarriorRow warrior={warrior} />

        <PlanValueSlider
          id="plan-step-oe"
          label="Offensive Effort"
          value={plan.OE}
          onChange={(v) => onPlanChange({ ...plan, OE: v })}
          endLabels={{ low: 'Cautious', high: 'Reckless' }}
          toneClass="text-arena-gold"
        />

        <PlanValueSlider
          id="plan-step-al"
          label="Activity Level"
          value={plan.AL ?? 5}
          onChange={(v) => onPlanChange({ ...plan, AL: v })}
          endLabels={{ low: 'Passive', high: 'Active' }}
          toneClass="text-arena-fame"
        />

        <PlanValueSlider
          id="plan-step-kd"
          label="Kill Desire"
          value={plan.killDesire ?? 5}
          onChange={(v) => onPlanChange({ ...plan, killDesire: v })}
          endLabels={{ low: 'Mercy', high: 'Kill' }}
          toneClass="text-destructive"
        />

        <TacticGrid plan={plan} onSelect={handleTactic} />

        <p className="text-[10px] text-muted-foreground/40 leading-relaxed italic">
          Your choices here determine how {warrior.name} fights. Different plans produce different
          outcomes — experiment freely.
        </p>
      </div>

      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextLabel="To the Arena"
        nextIcon={Swords}
        nextSize="lg"
      />
    </div>
  );
}
