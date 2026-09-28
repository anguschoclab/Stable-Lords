import { useState } from 'react';
import { TRAINER_MAX_PER_STABLE } from '@/engine/trainers/trainers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, UserPlus, Users, Award, Skull } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { VeteranReassignmentDialog } from '@/components/stable/VeteranReassignmentDialog';
import { LegacyMentorsTab } from '@/components/stable/LegacyMentorsTab';
import { FallenLegendsTab } from '@/components/stable/FallenLegendsTab';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';
import { useTrainers } from '@/pages/Trainers/hooks/useTrainers';
import { CurrentStaffTab, HireTab } from '@/pages/Trainers/tabs';

/** Header stats cluster — staff capacity + budget. */
function StaffStats({ staffCount, treasury }: { staffCount: number; treasury: number }) {
  return (
    <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 px-6 py-3 rounded-none shadow-2xl">
      <div className="flex flex-col items-center border-r border-white/10 pr-6">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
          Staff Capacity
        </span>
        <span className="font-display font-black text-primary text-xl flex items-center gap-2 leading-none">
          {staffCount} <span className="opacity-20">/</span> {TRAINER_MAX_PER_STABLE}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
          Budget
        </span>
        <span className="font-display font-black text-arena-gold text-xl flex items-center gap-2 leading-none">
          {treasury.toLocaleString()}G
        </span>
      </div>
    </div>
  );
}

const TRAINER_TAB_TRIGGER =
  'gap-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-none font-black uppercase text-[11px] tracking-[0.2em] motion-reduce:transition-none';

/** The four staff tabs — current, hire, mentors, legends. */
function TrainerTabList() {
  return (
    <TabsList className="bg-white/[0.02] border border-white/5 p-1 h-14 rounded-none w-full justify-start overflow-x-auto no-scrollbar">
      <TabsTrigger value="current" className={TRAINER_TAB_TRIGGER}>
        <GraduationCap className="h-4 w-4" /> Current Staff
      </TabsTrigger>
      <TabsTrigger value="hire" className={TRAINER_TAB_TRIGGER}>
        <UserPlus className="h-4 w-4" /> Hire
      </TabsTrigger>
      <TabsTrigger value="mentors" className={TRAINER_TAB_TRIGGER}>
        <Award className="h-4 w-4" /> Legacy Mentors
      </TabsTrigger>
      <TabsTrigger value="legends" className={TRAINER_TAB_TRIGGER}>
        <Skull className="h-4 w-4" /> Fallen Legends
      </TabsTrigger>
    </TabsList>
  );
}

/**
 * Trainers.
 */
export default function Trainers() {
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const {
    graveyard,
    retired,
    treasury,
    currentTrainers,
    bookmarkedCount,
    currentHiringPool,
    canHire,
    convertDialogOpen,
    setConvertDialogOpen,
    convertableRetired,
    refreshPool,
    hireTrainer,
    fireTrainer,
    convertWarrior,
  } = useTrainers(showBookmarkedOnly);

  return (
    <PageFrame maxWidth="xl" className="pb-32">
      <PageHeader
        icon={Users}
        eyebrow="Stable Staff"
        title="Trainers"
        subtitle="COACHING · DEVELOPMENT"
        actions={<StaffStats staffCount={currentTrainers.length} treasury={treasury} />}
      />

      <Tabs defaultValue="current" className="space-y-12">
        <TrainerTabList />

        <TabsContent
          value="current"
          className="mt-0 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none"
        >
          <div className="flex justify-end">
            <BookmarkFilterToggle
              active={showBookmarkedOnly}
              onToggle={() => setShowBookmarkedOnly((v) => !v)}
              count={bookmarkedCount}
            />
          </div>
          <CurrentStaffTab
            currentTrainers={currentTrainers}
            convertableRetired={convertableRetired}
            canHire={canHire}
            onFire={fireTrainer}
            onOpenConvert={() => setConvertDialogOpen(true)}
          />
        </TabsContent>

        <TrainerSecondaryTabs
          currentHiringPool={currentHiringPool}
          treasury={treasury}
          canHire={canHire}
          refreshPool={refreshPool}
          hireTrainer={hireTrainer}
          currentTrainers={currentTrainers}
          graveyard={graveyard}
          retired={retired}
        />
      </Tabs>

      {/* Convert Dialog */}
      <VeteranReassignmentDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        convertableRetired={convertableRetired}
        onConvert={convertWarrior}
      />
    </PageFrame>
  );
}

/** Hire / mentors / fallen-legends tab contents. */
function TrainerSecondaryTabs(
  t: Pick<
    ReturnType<typeof useTrainers>,
    | 'currentHiringPool'
    | 'treasury'
    | 'canHire'
    | 'refreshPool'
    | 'hireTrainer'
    | 'currentTrainers'
    | 'graveyard'
    | 'retired'
  >
) {
  return (
    <>
      <TabsContent
        value="hire"
        className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none"
      >
        <HireTab
          currentHiringPool={t.currentHiringPool}
          treasury={t.treasury}
          canHire={t.canHire}
          refreshPool={t.refreshPool}
          hireTrainer={t.hireTrainer}
        />
      </TabsContent>

      <TabsContent value="mentors" className="mt-0">
        <LegacyMentorsTab currentTrainers={t.currentTrainers} />
      </TabsContent>

      <TabsContent value="legends" className="mt-0">
        <FallenLegendsTab graveyard={t.graveyard} retired={t.retired} />
      </TabsContent>
    </>
  );
}
