import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormSparkline } from '@/components/charts/FormSparkline';
import { StatBadge } from '@/components/ui/WarriorBadges';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { useGameStore } from '@/state/useGameStore';
import type { Warrior } from '@/types/warrior.types';
import { warriorDisplayName } from '@/utils/warriorDisplay';
import { AvatarForEntity } from '@/components/avatar';
import { isWarriorListed } from '@/engine/matchmaking/schedulingAssistant/matchups';

interface WarriorDossierHeaderProps {
  warrior: Warrior;
  record: string;
  rankings?: {
    overallRank: number;
    compositeScore: number;
  };
  isPlayerOwned?: boolean;
}

/** Challenge/avoid mark buttons for non-player warriors. */
function MarkButtons({ warrior }: { warrior: Warrior }) {
  const playerChallenges = useGameStore((s) => s.playerChallenges);
  const playerAvoids = useGameStore((s) => s.playerAvoids);
  const playerStableAvoids = useGameStore((s) => s.playerStableAvoids);
  const toggleChallenge = useGameStore((s) => s.toggleChallenge);
  const toggleAvoid = useGameStore((s) => s.toggleAvoid);
  const toggleStableAvoid = useGameStore((s) => s.toggleStableAvoid);

  const isChallenged = playerChallenges?.includes(warrior.id) ?? false;
  const isAvoided =
    (playerAvoids?.includes(warrior.id) ??
      playerStableAvoids?.includes(warrior.stableId as string)) ??
    false;
  const isStableAvoided =
    warrior.stableId !== undefined &&
    (playerStableAvoids?.includes(warrior.stableId as string) ?? false);
  const listed = isWarriorListed(warrior);
  const unlistedTip = 'Unlisted — marks bind after this warrior has fought once';
  return (
    <>
      <Button
        variant={isChallenged ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleChallenge(warrior.id)}
        disabled={!listed}
        tooltip={!listed ? unlistedTip : undefined}
        className="font-display font-black uppercase tracking-widest text-[8px] h-7 px-3"
      >
        {isChallenged ? 'Challenged' : 'Challenge'}
      </Button>
      <Button
        variant={isAvoided ? 'destructive' : 'outline'}
        size="sm"
        onClick={() => toggleAvoid(warrior.id)}
        disabled={!listed}
        tooltip={!listed ? unlistedTip : undefined}
        className="font-display font-black uppercase tracking-widest text-[8px] h-7 px-3"
      >
        {isAvoided ? 'Avoided' : 'Avoid'}
      </Button>
      {warrior.stableId !== undefined && (
        <Button
          variant={isStableAvoided ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => toggleStableAvoid(warrior.stableId as string)}
          tooltip="Avoid the whole stable — vetoes inbound offers from all its warriors"
          className="font-display font-black uppercase tracking-widest text-[8px] h-7 px-3"
        >
          {isStableAvoided ? 'Stable Avoided' : 'Avoid Stable'}
        </Button>
      )}
    </>
  );
}

/** Right-hand action cluster: challenge/avoid toggles, bookmark, style + rank badges. */
function HeaderActions({
  warrior,
  rankings,
  isPlayerOwned,
}: {
  warrior: Warrior;
  rankings: WarriorDossierHeaderProps['rankings'];
  isPlayerOwned: boolean;
}) {
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        {!isPlayerOwned && <MarkButtons warrior={warrior} />}
        <BookmarkButton entityType="warrior" entityId={warrior.id} size="sm" />
        <StatBadge styleName={warrior.style} />
      </div>
      {rankings && <RankBadges rankings={rankings} />}
    </div>
  );
}

/** Rank + composite-score badge pair under the action cluster. */
function RankBadges({ rankings }: { rankings: NonNullable<WarriorDossierHeaderProps['rankings']> }) {
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={cn(
          'text-[10px] font-black uppercase tracking-tighter border-primary/20',
          rankings.overallRank <= 64
            ? 'text-arena-gold bg-arena-gold/5'
            : 'text-primary bg-primary/5'
        )}
      >
        RANK #{rankings.overallRank}
      </Badge>
      <Badge
        variant="secondary"
        className="text-[10px] font-black uppercase tracking-tighter bg-neutral-900 border border-white/5 opacity-80"
      >
        {Math.round(rankings.compositeScore)} PTS
      </Badge>
    </div>
  );
}

/**
 * Warrior dossier header.
 * @param - { warrior, record, rankings }.
 */
export function WarriorDossierHeader({
  warrior,
  record,
  rankings,
  isPlayerOwned = true,
}: WarriorDossierHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <AvatarForEntity
          entityId={warrior.id}
          entityType="warrior"
          source={warrior}
          size="md"
          className="border border-white/10 bg-neutral-950 shrink-0"
        />
        <div className="space-y-1">
          <h2 className="text-2xl font-display font-black tracking-tight uppercase">
            {warriorDisplayName(warrior)}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase opacity-60 tracking-widest">
              {record}
            </span>
            <FormSparkline warriorId={warrior.id} />
          </div>
        </div>
      </div>
      <HeaderActions warrior={warrior} rankings={rankings} isPlayerOwned={isPlayerOwned} />
    </div>
  );
}
