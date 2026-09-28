import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import type { WarriorAdvisorCard, CampaignFocus } from '@/engine/advisor/types';
import type { WarriorId } from '@/types/shared.types';
import {
  FOCUS_LABELS,
  CouncilCardHeader,
  CombatColumn,
  TrainingColumn,
  TacticsColumn,
  CouncilCardFooter,
} from './councilCardSections';

interface WarriorCouncilCardProps {
  card: WarriorAdvisorCard;
  onApplyPlan: (warriorId: WarriorId) => void;
  onSetFocus: (warriorId: WarriorId, focus: CampaignFocus) => void;
}

/** Per-warrior council card surfacing fight, training, and tactics advice with focus override and apply-plan controls. */
export function WarriorCouncilCard({ card, onApplyPlan, onSetFocus }: WarriorCouncilCardProps) {
  const focusMeta = FOCUS_LABELS[card.campaignFocus] ?? FOCUS_LABELS.PURSE_HUNTER;
  const isBlocked = card.fightAdvice.action === 'BLOCKED_BY_INJURY';
  const isRest = card.fightAdvice.action === 'REST_RECOMMENDED';
  const isFight = card.fightAdvice.action === 'ACCEPT_OFFER';

  return (
    <Surface
      variant="glass"
      className={cn(
        'p-6 border transition-all duration-300 relative overflow-hidden',
        isBlocked
          ? 'border-destructive/30 bg-destructive/[0.02]'
          : isRest
            ? 'border-arena-gold/30 bg-arena-gold/[0.01]'
            : 'border-white/10 hover:border-primary/30'
      )}
    >
      <CouncilCardHeader card={card} focusMeta={focusMeta} />

      {/* Headline Directive */}
      <div className="my-4 px-3 py-2 bg-white/[0.02] border-l-2 border-primary/50 text-[11px] font-semibold text-foreground/90">
        {card.headlineSummary}
      </div>

      {/* 3-Column Tactical Advice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <CombatColumn card={card} isFight={isFight} isBlocked={isBlocked} />
        <TrainingColumn card={card} />
        <TacticsColumn card={card} />
      </div>

      <CouncilCardFooter card={card} onApplyPlan={onApplyPlan} onSetFocus={onSetFocus} />
    </Surface>
  );
}
