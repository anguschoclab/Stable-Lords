import { useState } from 'react';
import { Radio } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';
import { useScouting } from '@/pages/scouting/useScouting';

// Modular Components
import { ScoutIntelTab } from '@/components/scouting/ScoutIntelTab';
import { StableComparison } from '@/components/scouting/StableComparison';
import { WarriorComparison } from '@/components/scouting/WarriorComparison';
import { ReputationQuadrant } from '@/components/charts/ReputationQuadrant';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';

/** Header actions: report count + live-scouts indicator. */
function HeaderStats({ reportCount }: { reportCount: number }) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-end">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
          Scout Reports
        </span>
        <span className="text-sm font-display font-black text-foreground">{reportCount} Filed</span>
      </div>
      <div className="flex items-center gap-4 border-l border-white/5 pl-6">
        <ImperialRing
          size="xs"
          variant="blood"
          className="animate-pulse motion-reduce:animate-none"
        >
          <Radio className="h-3 w-3 text-primary" />
        </ImperialRing>
        <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">
          Scouts at work...
        </span>
      </div>
    </div>
  );
}

/** Three-tab trigger row (Reports / Stable Dynamics / Warrior Face-Off). */
function ScoutTabsList() {
  const triggerClass =
    'flex-1 h-full font-black uppercase text-[10px] tracking-[0.3em] rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all motion-reduce:transition-none';
  return (
    <TabsList className="w-full h-16 bg-white/[0.02] border border-white/5 p-1 rounded-none">
      <TabsTrigger value="scout" className={triggerClass}>
        Reports
      </TabsTrigger>
      <TabsTrigger value="compare" className={triggerClass}>
        Stable Dynamics
      </TabsTrigger>
      <TabsTrigger value="warriors" className={triggerClass}>
        Warrior Face-Off
      </TabsTrigger>
    </TabsList>
  );
}

/**
 * Scouting.
 */
export default function Scouting() {
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const {
    treasury,
    rivals,
    scoutReports,
    roster,
    selectedRivalId,
    selectedWarriorId,
    filteredReports,
    bookmarkedCount,
    handleScout,
    handleSelectRival,
    handleSelectWarrior,
  } = useScouting(showBookmarkedOnly);

  return (
    <PageFrame>
      <PageHeader
        title="Rival Scouting"
        subtitle="WORLD · RIVAL STABLES · SCOUTING REPORTS"
        actions={<HeaderStats reportCount={scoutReports?.length || 0} />}
      />

      <Tabs defaultValue="scout" className="w-full space-y-12">
        <ScoutTabsList />

        <TabsContent value="scout" className="mt-0 focus-visible:outline-none">
          <div className="flex justify-end mb-4">
            <BookmarkFilterToggle
              active={showBookmarkedOnly}
              onToggle={() => setShowBookmarkedOnly((v) => !v)}
              count={bookmarkedCount}
            />
          </div>
          <ScoutIntelTab
            rivals={rivals ?? []}
            reports={filteredReports}
            selectedRivalId={selectedRivalId}
            onSelectRival={handleSelectRival}
            selectedWarriorId={selectedWarriorId}
            onSelectWarrior={handleSelectWarrior}
            treasury={treasury ?? 0}
            onScout={handleScout}
          />
        </TabsContent>

        <TabsContent value="compare" className="mt-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <StableComparison rivals={rivals} />
            </div>
            <div className="space-y-8">
              <SectionDivider label="Reputation" />
              <ReputationQuadrant />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="warriors" className="mt-0 focus-visible:outline-none">
          <WarriorComparison rivals={rivals ?? []} playerRoster={roster} />
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
}
