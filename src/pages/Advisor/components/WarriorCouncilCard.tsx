import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatBadge } from '@/components/ui/WarriorBadges';
import {
  Swords,
  Trophy,
  Dumbbell,
  Heart,
  AlertTriangle,
  Sparkles,
  Shield,
  Activity,
} from 'lucide-react';
import type { WarriorAdvisorCard, CampaignFocus } from '@/engine/advisor/types';
import type { WarriorId } from '@/types/shared.types';

interface WarriorCouncilCardProps {
  card: WarriorAdvisorCard;
  onApplyPlan: (warriorId: WarriorId) => void;
  onSetFocus: (warriorId: WarriorId, focus: CampaignFocus) => void;
}

const FOCUS_LABELS: Record<CampaignFocus, { label: string; color: string }> = {
  TOURNAMENT_PUSH: { label: 'Tournament Push', color: 'border-arena-gold/40 text-arena-gold bg-arena-gold/10' },
  PROSPECT_DEV: { label: 'Prospect Dev', color: 'border-arena-pop/40 text-arena-pop bg-arena-pop/10' },
  PURSE_HUNTER: { label: 'Purse Hunter', color: 'border-primary/40 text-primary bg-primary/10' },
  REHABILITATION: { label: 'Rehab / Rest', color: 'border-destructive/40 text-destructive bg-destructive/10' },
  VETERAN_TWILIGHT: { label: 'Twilight Legacy', color: 'border-purple-400/40 text-purple-400 bg-purple-400/10' },
};

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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-display font-black text-lg text-foreground tracking-tight">
            {card.warriorName}
          </span>
          <StatBadge styleName={card.style} />
          {card.tournamentAdvice.overallRank && (
            <Badge variant="outline" className="text-[9px] font-mono border-white/10">
              Rank #{card.tournamentAdvice.overallRank}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn('text-[9px] font-black uppercase tracking-wider', focusMeta.color)}
          >
            {focusMeta.label}
          </Badge>
        </div>

        {/* Fatigue & Injury Indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <Activity
              className={cn(
                'h-3 w-3',
                card.fatigueStatus.value >= 40
                  ? 'text-destructive'
                  : card.fatigueStatus.value >= 20
                    ? 'text-arena-gold'
                    : 'text-primary'
              )}
            />
            <span className="text-muted-foreground/60 uppercase">Fatigue:</span>
            <span className="font-bold">{card.fatigueStatus.value}%</span>
          </div>

          {card.injuryStatus.isInjured && (
            <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-widest gap-1">
              <AlertTriangle className="h-2.5 w-2.5" />
              {card.injuryStatus.severities[0] ?? 'Injured'}
            </Badge>
          )}
        </div>
      </div>

      {/* Headline Directive */}
      <div className="my-4 px-3 py-2 bg-white/[0.02] border-l-2 border-primary/50 text-[11px] font-semibold text-foreground/90">
        {card.headlineSummary}
      </div>

      {/* 3-Column Tactical Advice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Column 1: Combat & Tournament */}
        <div className="space-y-3 bg-white/[0.01] p-4 border border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
            <Swords className="h-3.5 w-3.5 text-primary" />
            <span>Combat & Tournament</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-[8px] font-black uppercase tracking-widest',
                  isFight
                    ? 'border-primary/40 text-primary bg-primary/10'
                    : isBlocked
                      ? 'border-destructive/40 text-destructive bg-destructive/10'
                      : 'border-arena-gold/40 text-arena-gold bg-arena-gold/10'
                )}
              >
                {card.fightAdvice.action.replace(/_/g, ' ')}
              </Badge>
              {card.fightAdvice.matchupEdge !== undefined && card.fightAdvice.matchupEdge !== 0 && (
                <span className="text-[9px] font-mono text-primary font-bold">
                  {card.fightAdvice.matchupEdge > 0 ? `+${card.fightAdvice.matchupEdge}` : card.fightAdvice.matchupEdge} Edge
                </span>
              )}
            </div>

            <p className="text-[11px] font-bold text-foreground">
              {card.fightAdvice.headline}
            </p>

            {card.fightAdvice.warnings.map((warn, i) => (
              <p key={i} className="text-[10px] text-destructive flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>{warn}</span>
              </p>
            ))}

            {card.tournamentAdvice.qualifiedTier && (
              <p className="text-[10px] text-arena-gold/90 flex items-center gap-1.5 font-medium pt-1 border-t border-white/5">
                <Trophy className="h-3 w-3 shrink-0" />
                <span>{card.tournamentAdvice.headline}</span>
              </p>
            )}
          </div>
        </div>

        {/* Column 2: Training Regimen */}
        <div className="space-y-3 bg-white/[0.01] p-4 border border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
            {card.trainingAdvice.mode === 'recovery' ? (
              <Heart className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <Dumbbell className="h-3.5 w-3.5 text-arena-pop" />
            )}
            <span>Training Regimen</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-[8px] font-black uppercase tracking-widest',
                  card.trainingAdvice.mode === 'recovery'
                    ? 'border-destructive/40 text-destructive bg-destructive/10'
                    : 'border-arena-pop/40 text-arena-pop bg-arena-pop/10'
                )}
              >
                {card.trainingAdvice.mode}
              </Badge>
              {card.trainingAdvice.gainChance && (
                <span className="text-[9px] font-mono text-arena-pop font-bold">
                  {Math.round(card.trainingAdvice.gainChance * 100)}% Chance
                </span>
              )}
            </div>

            <p className="text-[11px] font-bold text-foreground">
              {card.trainingAdvice.headline}
            </p>

            <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
              {card.trainingAdvice.reasoning}
            </p>

            {card.trainingAdvice.burnWarning && (
              <p className="text-[9px] text-arena-gold/80 italic pt-1 border-t border-white/5">
                {card.trainingAdvice.burnWarning}
              </p>
            )}
          </div>
        </div>

        {/* Column 3: Tactics & Loadout */}
        <div className="space-y-3 bg-white/[0.01] p-4 border border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
            <Shield className="h-3.5 w-3.5 text-arena-gold" />
            <span>Tactics & Loadout</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[8px] font-mono border-white/10">
                OE {card.tacticsAdvice.suggestedOE} / AL {card.tacticsAdvice.suggestedAL}
              </Badge>
              {card.tacticsAdvice.fallbackCondition && (
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/10 text-muted-foreground/80">
                  {card.tacticsAdvice.fallbackCondition}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold text-foreground">
              <span>{card.tacticsAdvice.bestOffensiveTactic}</span>
              <span className="text-muted-foreground/40 font-normal">+</span>
              <span>{card.tacticsAdvice.bestDefensiveTactic}</span>
            </div>

            {card.tacticsAdvice.gearNotes.map((note, i) => (
              <p key={i} className="text-[10px] text-muted-foreground/80 leading-relaxed">
                {note}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
            Change Focus:
          </span>
          {card.suggestedCampaignFocus !== card.campaignFocus && (
            <span className="text-[9px] font-black uppercase tracking-widest text-arena-gold/80">
              Suggested: {FOCUS_LABELS[card.suggestedCampaignFocus].label}
            </span>
          )}
          <select
            value={card.campaignFocus}
            onChange={(e) => onSetFocus(card.warriorId, e.target.value as CampaignFocus)}
            className="bg-black/40 border border-white/10 text-[9px] font-black uppercase tracking-wider px-2 py-1 text-muted-foreground hover:text-foreground focus:outline-none"
          >
            <option value="PURSE_HUNTER">Purse Hunter</option>
            <option value="TOURNAMENT_PUSH">Tournament Push</option>
            <option value="PROSPECT_DEV">Prospect Dev</option>
            <option value="REHABILITATION">Rehabilitation</option>
            <option value="VETERAN_TWILIGHT">Twilight Legacy</option>
          </select>
        </div>

        <Button
          size="sm"
          onClick={() => onApplyPlan(card.warriorId)}
          className="h-9 px-6 font-black uppercase text-[10px] tracking-widest gap-2 bg-primary/20 hover:bg-primary text-primary-foreground border border-primary/40 rounded-none transition-all"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Apply Plan for {card.warriorName}
        </Button>
      </div>
    </Surface>
  );
}
