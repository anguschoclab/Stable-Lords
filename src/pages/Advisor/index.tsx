import { useState, useMemo } from 'react';
import { PageFrame } from '@/components/ui/PageFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Surface } from '@/components/ui/Surface';
import { ShieldCheck, Users } from 'lucide-react';
import { useStableAdvisor } from '@/hooks/useStableAdvisor';
import { CouncilHeader } from './components/CouncilHeader';
import { CouncilFilterTabs, type AdvisorFilterTab } from './components/CouncilFilterTabs';
import { WarriorCouncilCard } from './components/WarriorCouncilCard';

export default function AdvisorPage() {
  const { cards, summary, applyWarriorSetup, applyAllSetups, setWarriorCampaignFocus } =
    useStableAdvisor();
  const [activeTab, setActiveTab] = useState<AdvisorFilterTab>('all');

  const counts: Record<AdvisorFilterTab, number> = useMemo(
    () => ({
      all: cards.length,
      ready: cards.filter((c) => c.fightAdvice.action === 'ACCEPT_OFFER').length,
      tournament: cards.filter((c) => c.tournamentAdvice.qualifiedTier !== null).length,
      rehab: cards.filter((c) => c.campaignFocus === 'REHABILITATION').length,
    }),
    [cards]
  );

  const filteredCards = useMemo(() => {
    switch (activeTab) {
      case 'ready':
        return cards.filter((c) => c.fightAdvice.action === 'ACCEPT_OFFER');
      case 'tournament':
        return cards.filter((c) => c.tournamentAdvice.qualifiedTier !== null);
      case 'rehab':
        return cards.filter((c) => c.campaignFocus === 'REHABILITATION');
      default:
        return cards;
    }
  }, [cards, activeTab]);

  return (
    <PageFrame maxWidth="xl" className="pb-32 space-y-8">
      <PageHeader
        icon={ShieldCheck}
        eyebrow="Strategic Intelligence"
        title="Lanista's War Council"
        subtitle="CAMPAIGN PACING · FIGHT SELECTION · TOURNAMENT CONTENDERS · TRAINING REGIMEN"
      />

      {/* Top Directives & Master Plan Executor */}
      <CouncilHeader summary={summary} onExecuteAll={applyAllSetups} />

      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <SectionDivider label={`Warriors Council [${filteredCards.length}]`} variant="gold" />
        </div>

        <CouncilFilterTabs currentTab={activeTab} onTabChange={setActiveTab} counts={counts} />

        {filteredCards.length === 0 ? (
          <Surface variant="glass" className="py-24 text-center border-dashed border-white/5 space-y-3">
            <Users className="h-8 w-8 mx-auto text-muted-foreground/30" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
              No Warriors in Current Category
            </p>
          </Surface>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCards.map((card) => (
              <WarriorCouncilCard
                key={card.warriorId}
                card={card}
                onApplyPlan={applyWarriorSetup}
                onSetFocus={setWarriorCampaignFocus}
              />
            ))}
          </div>
        )}
      </div>
    </PageFrame>
  );
}
