import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useNavigate } from '@tanstack/react-router';
import {
  Bookmark,
  Users,
  Shield,
  Building2,
  GraduationCap,
  Trophy,
  Briefcase,
  Target,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { cn } from '@/lib/utils';
import type { BookmarkEntityType } from '@/types/bookmark.types';

const ENTITY_CONFIG: Record<
  BookmarkEntityType,
  { label: string; icon: React.ElementType; color: string }
> = {
  warrior: { label: 'Warriors', icon: Users, color: 'text-primary' },
  rival: { label: 'Rival Stables', icon: Shield, color: 'text-arena-blood' },
  promoter: { label: 'Promoters', icon: Building2, color: 'text-accent' },
  trainer: { label: 'Trainers', icon: GraduationCap, color: 'text-arena-gold' },
  tournament: { label: 'Tournaments', icon: Trophy, color: 'text-arena-fame' },
  boutOffer: { label: 'Bout Offers', icon: Briefcase, color: 'text-muted-foreground' },
  scoutReport: { label: 'Scout Reports', icon: Target, color: 'text-primary' },
};

function BookmarkedEntityRow({
  type,
  id,
  name,
  subtitle,
  onClick,
}: {
  type: BookmarkEntityType;
  id: string;
  name: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  const cfg = ENTITY_CONFIG[type];
  const Icon = cfg.icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 p-4 border border-white/5 hover:bg-white/[0.02] transition-all group cursor-pointer',
        onClick ? 'cursor-pointer' : ''
      )}
    >
      <div className={cn('p-2 bg-white/[0.02] border border-white/5', cfg.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-black uppercase tracking-tight text-foreground truncate">
          {name}
        </div>
        {subtitle && (
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
            {subtitle}
          </div>
        )}
      </div>
      <BookmarkButton entityType={type} entityId={id} size="sm" />
    </div>
  );
}

export default function Bookmarks() {
  const store = useGameStore();
  const navigate = useNavigate();

  const bookmarks = store.bookmarks;

  const grouped = useMemo(() => {
    const groups: Record<
      BookmarkEntityType,
      { id: string; name: string; subtitle?: string; onClick?: () => void }[]
    > = {
      warrior: [],
      rival: [],
      promoter: [],
      trainer: [],
      tournament: [],
      boutOffer: [],
      scoutReport: [],
    };

    for (const b of bookmarks) {
      let name = 'Unknown Entity';
      let subtitle: string | undefined;
      let onClick: (() => void) | undefined;

      switch (b.entityType) {
        case 'warrior': {
          const allWarriors = [
            ...store.roster,
            ...store.graveyard,
            ...store.retired,
            ...(store.rivals?.flatMap((r) => r.roster) ?? []),
          ];
          const w = allWarriors.find((x) => x.id === b.entityId);
          if (w) {
            name = w.name;
            subtitle = w.style;
            onClick = () => navigate({ to: '/warrior/$id', params: { id: w.id } });
          } else {
            name = '[Entity Removed]';
          }
          break;
        }
        case 'rival': {
          const r = store.rivals?.find((x) => x.id === b.entityId || x.owner.id === b.entityId);
          if (r) {
            name = r.owner.stableName;
            subtitle = r.owner.name;
            onClick = () => navigate({ to: '/world/stable/$id', params: { id: r.owner.id } });
          } else {
            name = '[Entity Removed]';
          }
          break;
        }
        case 'promoter': {
          const p = Object.values(store.promoters || {}).find((x) => x.id === b.entityId);
          if (p) {
            name = p.name;
            subtitle = `${p.tier} · ${p.personality}`;
            onClick = () => navigate({ to: '/stable/promoter/$id', params: { id: p.id } });
          } else {
            name = '[Entity Removed]';
          }
          break;
        }
        case 'trainer': {
          const t = store.trainers?.find((x) => x.id === b.entityId);
          if (t) {
            name = t.name;
            subtitle = `${t.tier} · ${t.focus}`;
          } else {
            name = '[Entity Removed]';
          }
          break;
        }
        case 'tournament': {
          const tour = store.tournaments?.find((x) => x.id === b.entityId);
          if (tour) {
            name = tour.name;
            subtitle = `${tour.season} · Year ${tour.week}`;
            onClick = () => navigate({ to: '/world/tournaments' });
          } else {
            name = '[Entity Removed]';
          }
          break;
        }
        case 'boutOffer': {
          const offer = Object.values(store.boutOffers || {}).find((x) => x.id === b.entityId);
          if (offer) {
            const promoter = Object.values(store.promoters || {}).find(
              (p) => p.id === offer.promoterId
            );
            name = offer.id;
            subtitle = promoter ? `${promoter.name} · ${offer.purse}G` : `${offer.purse}G`;
            onClick = () => navigate({ to: '/stable/bouts' });
          } else {
            name = '[Entity Removed]';
          }
          break;
        }
        case 'scoutReport': {
          const report = store.scoutReports?.find((x) => x.id === b.entityId);
          if (report) {
            name = report.warriorName;
            subtitle = `${report.quality} Intel · Week ${report.week}`;
            onClick = () => navigate({ to: '/world/intelligence' });
          } else {
            name = '[Entity Removed]';
          }
          break;
        }
      }

      groups[b.entityType].push({ id: b.entityId, name, subtitle, onClick });
    }

    return groups;
  }, [bookmarks, store, navigate]);

  const totalBookmarks = bookmarks.length;
  const hasBookmarks = totalBookmarks > 0;

  return (
    <PageFrame maxWidth="xl">
      <PageHeader
        icon={Bookmark}
        eyebrow="WATCHLIST"
        title="Bookmarks"
        subtitle="TRACKED ENTITIES · INTELLIGENCE REGISTRY"
        actions={
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Tracked Assets
              </span>
              <span className="text-sm font-display font-black text-foreground">
                {totalBookmarks}
              </span>
            </div>
          </div>
        }
      />

      {!hasBookmarks ? (
        <Surface
          variant="glass"
          className="py-32 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
        >
          <ImperialRing size="lg" variant="bronze" className="opacity-20">
            <Bookmark className="h-8 w-8" />
          </ImperialRing>
          <div className="space-y-2">
            <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
              No Bookmarks Established
            </p>
            <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic max-w-sm mx-auto">
              Bookmark warriors, stables, promoters, and other entities from their detail pages to
              track them here.
            </p>
          </div>
        </Surface>
      ) : (
        <div className="space-y-12">
          {(Object.keys(grouped) as BookmarkEntityType[]).map((type) => {
            const items = grouped[type];
            if (items.length === 0) return null;
            const cfg = ENTITY_CONFIG[type];

            return (
              <section key={type}>
                <SectionDivider label={cfg.label} />
                <div className="mt-6 space-y-2">
                  {items.map((item) => (
                    <BookmarkedEntityRow
                      key={item.id}
                      type={type}
                      id={item.id}
                      name={item.name}
                      subtitle={item.subtitle}
                      onClick={item.onClick}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}
