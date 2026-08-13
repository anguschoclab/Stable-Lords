import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormSparkline } from '@/components/charts/FormSparkline';
import { StatBadge } from '@/components/ui/WarriorBadges';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { useGameStore } from '@/state/useGameStore';
import type { Warrior } from '@/types/warrior.types';

interface WarriorDossierHeaderProps {
  warrior: Warrior;
  record: string;
  rankings?: {
    overallRank: number;
    compositeScore: number;
  };
  isPlayerOwned?: boolean;
} /**
 * Warrior dossier header.
 * @param - { warrior, record, rankings }.
 */

/**
 * Warrior dossier header.
 * @param - { warrior, record, rankings }.
 */
export function WarriorDossierHeader({ warrior, record, rankings, isPlayerOwned = true }: WarriorDossierHeaderProps) {
  const playerChallenges = useGameStore((s) => s.playerChallenges);
  const playerAvoids = useGameStore((s) => s.playerAvoids);
  const toggleChallenge = useGameStore((s) => s.toggleChallenge);
  const toggleAvoid = useGameStore((s) => s.toggleAvoid);

  const isChallenged = playerChallenges?.includes(warrior.id) ?? false;
  const isAvoided = playerAvoids?.includes(warrior.id) ?? false;
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h2 className="text-2xl font-display font-black tracking-tight uppercase">
          {warrior.name}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase opacity-60 tracking-widest">
            {record}
          </span>
          <FormSparkline warriorId={warrior.id} />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-3">
          {!isPlayerOwned && (
            <>
              <Button
                variant={isChallenged ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleChallenge(warrior.id)}
                className="font-display font-black uppercase tracking-widest text-[8px] h-7 px-3"
              >
                {isChallenged ? 'Challenged' : 'Challenge'}
              </Button>
              <Button
                variant={isAvoided ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => toggleAvoid(warrior.id)}
                className="font-display font-black uppercase tracking-widest text-[8px] h-7 px-3"
              >
                {isAvoided ? 'Avoided' : 'Avoid'}
              </Button>
            </>
          )}
          <BookmarkButton entityType="warrior" entityId={warrior.id} size="sm" />
          <StatBadge styleName={warrior.style} />
        </div>
        {rankings && (
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
        )}
      </div>
    </div>
  );
}
