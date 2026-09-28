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
        actions={
          <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 px-6 py-3 rounded-none shadow-2xl">
            <div className="flex flex-col items-center border-r border-white/10 pr-6">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Staff Capacity
              </span>
              <span className="font-display font-black text-primary text-xl flex items-center gap-2 leading-none">
                {currentTrainers.length} <span className="opacity-20">/</span>{' '}
                {TRAINER_MAX_PER_STABLE}
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
        }
      />

      <Tabs defaultValue="current" className="space-y-12">
        <TabsList className="bg-white/[0.02] border border-white/5 p-1 h-14 rounded-none w-full justify-start overflow-x-auto no-scrollbar">
          <TabsTrigger
            value="current"
            className="gap-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-none font-black uppercase text-[11px] tracking-[0.2em]"
          >
            <GraduationCap className="h-4 w-4" /> Current Staff
          </TabsTrigger>
          <TabsTrigger
            value="hire"
            className="gap-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-none font-black uppercase text-[11px] tracking-[0.2em]"
          >
            <UserPlus className="h-4 w-4" /> Hire
          </TabsTrigger>
          <TabsTrigger
            value="mentors"
            className="gap-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-none font-black uppercase text-[11px] tracking-[0.2em]"
          >
            <Award className="h-4 w-4" /> Legacy Mentors
          </TabsTrigger>
          <TabsTrigger
            value="legends"
            className="gap-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-none font-black uppercase text-[11px] tracking-[0.2em]"
          >
            <Skull className="h-4 w-4" /> Fallen Legends
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="current"
          className="mt-0 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
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

        <TabsContent
          value="hire"
          className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <HireTab
            currentHiringPool={currentHiringPool}
            treasury={treasury}
            canHire={canHire}
            refreshPool={refreshPool}
            hireTrainer={hireTrainer}
          />
        </TabsContent>

        <TabsContent value="mentors" className="mt-0">
          <LegacyMentorsTab currentTrainers={currentTrainers} />
        </TabsContent>

        <TabsContent value="legends" className="mt-0">
          <FallenLegendsTab graveyard={graveyard} retired={retired} />
        </TabsContent>
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
