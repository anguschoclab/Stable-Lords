import {
  BookOpen,
  Coins,
  Sparkles,
  GraduationCap,
  ScrollText,
  Skull,
  CalendarDays,
  AlertCircle,
  Hourglass,
} from 'lucide-react';
import { useGameStore } from '@/state/useGameStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Separator } from '@/components/ui/separator';
import { TreasuryOverview } from '@/components/ledger/TreasuryOverview';
import { InsightVault } from '@/components/ledger/InsightVault';
import { InsightManager } from '@/components/ledger/InsightManager';
import { ContractManager } from '@/components/ledger/ContractManager';
import { Chronicle } from '@/components/ledger/Chronicle';
import { HallOfWarriors } from '@/components/ledger/HallOfWarriors';
import { YearEndRecap } from '@/components/ledger/YearEndRecap';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { computeWeeklyBreakdown } from '@/engine/economy';
import { cn } from '@/lib/utils';

export default function StableLedger() {
  const store = useGameStore();
  const { season, week, treasury } = store;
  const breakdown = computeWeeklyBreakdown(store);
  const runway = breakdown.totalExpenses > 0 ? Math.floor(treasury / breakdown.totalExpenses) : 99;
  const isEmergency = runway < 4;

  return (
    <PageFrame maxWidth="lg" className="pb-32">
      <PageHeader
        icon={BookOpen}
        eyebrow="Registry Administration"
        title="Stable Ledger"
        subtitle={`FISCAL YEAR: 412 AE · SEASON: ${season} · Week: ${week}`}
        actions={
          <div className="flex items-center gap-6 px-6 py-3 bg-secondary/10 border border-white/5 backdrop-blur-2xl">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                Registry Balance
              </span>
              <span className="font-mono font-black text-arena-gold text-lg leading-none">
                {(treasury ?? 0).toLocaleString()} <span className="text-[10px] opacity-40">G</span>
              </span>
            </div>
          </div>
        }
      />

      {/* Band 2 — Financial Runway Alert */}
      <Surface
        variant={isEmergency ? 'blood' : 'glass'}
        className={cn(
          'flex items-center justify-between p-6 border-l-4',
          isEmergency ? 'border-l-primary shadow-lg shadow-primary/10' : 'border-l-accent/40'
        )}
      >
        <div className="flex items-center gap-5">
          <div
            className={cn(
              'p-3 transform rotate-45 border',
              isEmergency
                ? 'bg-destructive/20 border-destructive/40 animate-pulse'
                : 'bg-accent/10 border-accent/30'
            )}
          >
            <div className="transform -rotate-45">
              {isEmergency ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <Hourglass className="h-5 w-5 text-accent" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Operational Lifeline
              </span>
              {isEmergency && (
                <Badge className="bg-destructive text-foreground text-[8px] font-black h-4 px-2 rounded-none">
                  CRITICAL
                </Badge>
              )}
            </div>
            <p className="text-2xl font-display font-black uppercase tracking-tight text-foreground leading-none mt-2">
              {runway === 99 ? 'UNLIMITED' : `${runway} CYCLES`} REMAINING
            </p>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
            <div className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1.5">
              Weekly Burn
            </div>
            <div className="font-mono font-black text-destructive text-xl leading-none">
              -{breakdown.totalExpenses} <span className="text-xs opacity-30">G</span>
            </div>
          </div>
          <div className="h-10 w-px bg-white/5" />
          <div className="text-right">
            <div className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1.5">
              Net Variance
            </div>
            <div
              className={cn(
                'font-mono font-black text-xl leading-none',
                breakdown.net >= 0 ? 'text-primary' : 'text-destructive'
              )}
            >
              {breakdown.net >= 0 ? '+' : ''}
              {breakdown.net} <span className="text-xs opacity-30">G</span>
            </div>
          </div>
        </div>
      </Surface>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-6 h-auto p-1 bg-[#080604] border border-white/5 backdrop-blur-2xl rounded-none mb-10 overflow-hidden">
          {[
            { value: 'overview', icon: Coins, label: 'Ledger' },
            { value: 'tokens', icon: Sparkles, label: 'Vault' },
            { value: 'contracts', icon: GraduationCap, label: 'Personnel' },
            { value: 'chronicle', icon: ScrollText, label: 'Archive' },
            { value: 'hall', icon: Skull, label: 'Monolith' },
            { value: 'year-end', icon: CalendarDays, label: 'Cycle End' },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-[9px] font-black uppercase tracking-[0.2em] py-4 gap-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_-4px_0_hsl(var(--primary))] transition-all duration-300 rounded-none border-r border-white/5 last:border-0"
            >
              <tab.icon className="h-3.5 w-3.5 opacity-60" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <TabsContent value="overview" className="focus-visible:outline-none">
            <TreasuryOverview />
          </TabsContent>
          <TabsContent value="tokens" className="focus-visible:outline-none space-y-12">
            <InsightManager />
            <SectionDivider label="Historical Insight Reserve" />
            <InsightVault />
          </TabsContent>
          <TabsContent value="contracts" className="focus-visible:outline-none">
            <ContractManager />
          </TabsContent>
          <TabsContent value="chronicle" className="focus-visible:outline-none">
            <Chronicle />
          </TabsContent>
          <TabsContent value="hall" className="focus-visible:outline-none">
            <HallOfWarriors />
          </TabsContent>
          <TabsContent value="year-end" className="focus-visible:outline-none">
            <YearEndRecap />
          </TabsContent>
        </div>
      </Tabs>
    </PageFrame>
  );
}
