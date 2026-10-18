import { Eye, Target, Shield, Heart, Zap, Crown } from 'lucide-react';
import { TagBadge } from '@/components/ui/WarriorBadges';
import { Badge } from '@/components/ui/badge';
import { STYLE_DISPLAY_NAMES, FightingStyle } from '@/types/game';
import { EditableText } from '@/components/ui/EditableText';
import { useGameStore } from '@/state/useGameStore';
import type { InsightToken } from '@/types/state.types';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { AvatarForEntity, AvatarRerollButton } from '@/components/avatar';
import type { Warrior } from '@/types/warrior.types';

interface ObfuscatedWarrior {
  name: string;
  epithet?: string;
  champion: boolean;
  style: FightingStyle | 'UNKNOWN';
  career: { wins: number; losses: number; kills: number };
  fame: number;
  popularity: number;
  flair: string[];
  titles: string[];
  injuries: (string | { name: string })[];
}

interface WarriorHeroHeaderProps {
  warrior: ObfuscatedWarrior;
  record: string;
  streakLabel: string | null;
  streakVal: number;
  id?: string;
  isPlayerOwned?: boolean;
  insightTokens?: InsightToken[];
  /** Arena display names this warrior reigns over / once reigned over. */
  arenaCrowns?: { current: string[]; past: string[] };
  /** Full warrior record used to render the procedural portrait. */
  sourceWarrior?: Warrior;
}

/**
 * Render the WarriorHeroHeader component.
 * @param  props - {
  warrior,
  record,
  streak label,
  streak val,
  id,
  is player owned,
  insight tokens,
}.
 */
/** Left-side identity block: portrait, name, stats, badges. */
function WarriorIdentityBlock(props: WarriorHeroHeaderProps) {
  const { warrior, sourceWarrior, isPlayerOwned, id, record, insightTokens, arenaCrowns } = props;
  const renameWarrior = useGameStore((s) => s.renameWarrior);
  const intelCount = insightTokens?.filter((token) => token.warriorId === id).length ?? 0;

  return (
    <div className="flex items-start gap-6">
      {sourceWarrior && (
        <div className="shrink-0">
          <AvatarForEntity
            entityId={sourceWarrior.id}
            entityType="warrior"
            source={sourceWarrior}
            size="xl"
          />
        </div>
      )}
      <div className="space-y-4">
        <div className="space-y-1">
          <span className="text-[8px] font-black uppercase tracking-[0.15em] text-primary/60">
            {isPlayerOwned ? 'Your Gladiator' : 'Rival Gladiator'}
          </span>
          <div className="flex items-center gap-4">
            {isPlayerOwned && id ? (
              <EditableText
                value={warrior.name}
                onSave={(newName) =>
                  renameWarrior(id as import('@/types/shared.types').WarriorId, newName)
                }
                className="text-4xl font-display font-black uppercase tracking-tight"
                label="Rename"
              />
            ) : (
              <h1 className="text-4xl font-display font-black uppercase tracking-tight">
                {warrior.name}
              </h1>
            )}
            {warrior.epithet && (
              <span className="text-2xl font-display italic text-arena-gold/80 tracking-tight">
                {warrior.epithet}
              </span>
            )}
            {isPlayerOwned && sourceWarrior && (
              <AvatarRerollButton
                config={{
                  entityId: sourceWarrior.id,
                  entityType: 'warrior',
                  seed: sourceWarrior.avatarSeed ?? 0,
                  name: sourceWarrior.name,
                  age: sourceWarrior.age,
                  style: sourceWarrior.style,
                  kills: sourceWarrior.career?.kills,
                  fame: sourceWarrior.fame,
                  injuries: sourceWarrior.injuries?.map((i) =>
                    typeof i === 'string' ? i : i.name
                  ),
                }}
              />
            )}
          </div>
        </div>

        <StatStrip style={warrior.style} record={record} intelCount={intelCount} />
        <BadgeStrip warrior={warrior} arenaCrowns={arenaCrowns} />
      </div>
    </div>
  );
}

/**
 * Render the WarriorHeroHeader component.
 * @param props - Header data and callbacks.
 */
export function WarriorHeroHeader(props: WarriorHeroHeaderProps) {
  return (
    <Surface variant="glass" className="relative p-8 border-white/5 overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <WarriorIdentityBlock {...props} />
        <StatusRings />
      </div>
    </Surface>
  );
}

/** Style, record, and intel-count strip under the warrior name. */
function StatStrip({
  style,
  record,
  intelCount,
}: {
  style: ObfuscatedWarrior['style'];
  record: string;
  intelCount: number;
}) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <Shield className="h-3.5 w-3.5 text-muted-foreground/40" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {style === 'UNKNOWN' ? 'Unknown Style' : STYLE_DISPLAY_NAMES[style as FightingStyle]}
        </span>
      </div>
      <div className="h-4 w-px bg-white/10" />
      <div className="flex items-center gap-2">
        <Target className="h-3.5 w-3.5 text-muted-foreground/40" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {record}
        </span>
      </div>
      {intelCount > 0 && (
        <>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-primary">
            <Eye className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {intelCount} Intel Acquired
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/** Flair, titles, arena crowns, and injury badges. */
function BadgeStrip({
  warrior,
  arenaCrowns,
}: {
  warrior: ObfuscatedWarrior;
  arenaCrowns?: { current: string[]; past: string[] };
}) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {warrior.flair.map((f) => (
        <TagBadge key={f} tag={f} type="flair" />
      ))}
      {warrior.titles.map((t) => (
        <TagBadge key={t} tag={t} type="title" />
      ))}
      {arenaCrowns?.current.map((name) => (
        <Badge
          key={`crown-${name}`}
          className="bg-arena-gold/20 text-arena-gold border-arena-gold/40"
        >
          <Crown className="h-3 w-3 mr-1" /> Champion of {name}
        </Badge>
      ))}
      {arenaCrowns?.past.map((name) => (
        <Badge
          key={`ex-crown-${name}`}
          variant="outline"
          className="text-arena-gold/50 border-arena-gold/20"
        >
          <Crown className="h-3 w-3 mr-1" /> Former Champion of {name}
        </Badge>
      ))}
      {warrior.injuries.map((i) => {
        const injName = typeof i === 'string' ? i : i.name;
        return <TagBadge key={injName} tag={injName} type="injury" />;
      })}
    </div>
  );
}

/** Condition and wounds imperial rings on the header's right side. */
function StatusRings() {
  return (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <ImperialRing size="md" variant="blood">
          <Zap className="h-5 w-5 text-primary" />
        </ImperialRing>
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
          Condition
        </span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ImperialRing size="md" variant="bronze">
          <Heart className="h-5 w-5 text-muted-foreground/60" />
        </ImperialRing>
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
          Wounds
        </span>
      </div>
    </div>
  );
}
