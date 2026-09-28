import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { Shield, Crown, Star, Quote } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { ReputationSliders } from '@/components/stable/ReputationSliders';
import { RosterWall } from '@/components/stable/RosterWall';
import { TrainerTable } from '@/components/stable/TrainerTable';
import { StyleMeterTable } from '@/components/charts/StyleMeterTable';
import { FavoritesCharting } from '@/components/warrior/favorites/FavoritesCharting';
import { InsightManager } from '@/components/ledger';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';

/** Header stat block: fame and master titles. */
function HeaderStats({ fame, titles }: { fame: number; titles: number }) {
  return (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-end">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">
          Eminent Fame
        </span>
        <div className="flex items-center gap-2 font-display font-black text-xl text-arena-gold">
          {fame} <Star className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="h-8 w-px bg-white/5" />
      <div className="flex flex-col items-end">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">
          Master Titles
        </span>
        <div className="flex items-center gap-2 font-display font-black text-xl text-primary">
          {titles} <Crown className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

/** Sidebar: reputation metrics, style composition, favorites, creed. */
function HallSidebar({
  stableName,
  roster,
}: {
  stableName: string;
  roster: NonNullable<ReturnType<typeof useGameStore.getState>['roster']>;
}) {
  return (
    <aside className="lg:col-span-4 space-y-12">
      <section>
        <SectionDivider label="Reputation Metrics" />
        <div className="mt-8">
          <ReputationSliders />
        </div>
      </section>

      <section>
        <SectionDivider label="Style Composition" />
        <div className="mt-8">
          <StyleMeterTable />
        </div>
      </section>

      <section>
        <SectionDivider label="Favorite Affinities" />
        <div className="mt-8">
          <FavoritesCharting warriors={roster ?? []} />
        </div>
      </section>

      <section>
        <SectionDivider label="Stable Creed" />
        <Surface
          variant="glass"
          className="mt-8 p-6 border-white/5 bg-white/[0.01] relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 opacity-[0.03]">
            <Quote className="h-24 w-24" />
          </div>
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed italic relative z-10">
            "The sand remembers every drop of blood shed in the name of the{' '}
            {stableName.split(' ')[0]} legacy. We do not just fight; we endure."
          </p>
        </Surface>
      </section>
    </aside>
  );
}

/**
 * Stable hall.
 */
export default function StableHall() {
  const { player, fame, insightTokens, roster } = useGameStore(
    useShallow((s) => ({
      player: s.player,
      fame: s.fame,
      insightTokens: s.insightTokens,
      roster: s.roster,
    }))
  );
  const pendingTokens = (insightTokens ?? []).length;

  return (
    <PageFrame>
      <PageHeader
        eyebrow="Your Stable"
        title={player.stableName}
        subtitle={`OWNER · ${player.name.toUpperCase()} · EST. 410 AE`}
        icon={Shield}
        actions={<HeaderStats fame={fame} titles={player.titles || 0} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <HallSidebar stableName={player.stableName} roster={roster} />

        {/* Main: Roster & Staff */}
        <div className="lg:col-span-8 space-y-12">
          <section>
            <SectionDivider label="Roster" variant="primary" />
            <div className="mt-8">
              <RosterWall />
            </div>
          </section>

          <section>
            <SectionDivider label="Trainers" variant="gold" />
            <div className="mt-8">
              <TrainerTable />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <SectionDivider label="Patronage Awards" className="flex-1" />
              {pendingTokens > 0 && (
                <Badge className="bg-arena-gold/10 text-arena-gold border border-arena-gold/20 text-[9px] font-black rounded-none ml-4">
                  {pendingTokens} pending
                </Badge>
              )}
            </div>
            <InsightManager />
          </section>
        </div>
      </div>
    </PageFrame>
  );
}
