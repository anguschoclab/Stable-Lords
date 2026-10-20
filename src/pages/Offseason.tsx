/**
 * Offseason — year-end retrospective and setup for the next season.
 * Refactored to Command Grid (Archetype A) layout.
 */
import { Link } from '@tanstack/react-router';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { PageFrame } from '@/components/ui/PageFrame';
import { YearEndRecap, SeasonSynthesis } from '@/components/ledger';
import {
  CalendarDays,
  UserPlus,
  GraduationCap,
  BookOpen,
  ArrowRight,
  History,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { isActive } from '@/engine/warrior/warriorStatus';

const SEASON_ACTIONS = [
  {
    to: '/stable/recruit',
    label: 'Refresh Roster',
    sub: 'Scout new warriors',
    icon: UserPlus,
    variant: 'blood' as const,
  },
  {
    to: '/stable/trainers',
    label: 'Revise Staff',
    sub: 'Review coaching staff',
    icon: GraduationCap,
    variant: 'gold' as const,
  },
  {
    to: '/stable/finance',
    label: 'Ledger Audit',
    sub: 'Full fiscal retrospective',
    icon: BookOpen,
    variant: 'bronze' as const,
  },
];

function ChecklistStatus({
  ready,
  readyLabel,
  reviewLabel,
}: {
  ready: boolean;
  readyLabel: string;
  reviewLabel: string;
}) {
  const Icon = ready ? CheckCircle2 : AlertCircle;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.15em] ${
        ready ? 'text-primary' : 'text-arena-gold'
      }`}
    >
      <Icon className="h-3 w-3" />
      {ready ? readyLabel : reviewLabel}
    </span>
  );
}

function ChecklistRow({
  to,
  title,
  detail,
  status,
}: {
  to: string;
  title: string;
  detail: string;
  status: { ready: boolean; readyLabel: string; reviewLabel: string };
}) {
  return (
    <Link to={to} className="block group">
      <div className="flex items-center justify-between gap-4 border border-white/5 bg-black/20 p-4 transition-colors group-hover:border-primary/30 motion-reduce:transition-none">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground group-hover:text-primary transition-colors motion-reduce:transition-none">
            {title}
          </p>
          <p className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground/50">
            {detail}
          </p>
        </div>
        <ChecklistStatus
          ready={status.ready}
          readyLabel={status.readyLabel}
          reviewLabel={status.reviewLabel}
        />
      </div>
    </Link>
  );
}

function SeasonCloseChecklist({
  activeCount,
  trainerCount,
  treasury,
  closeEligible,
}: {
  activeCount: number;
  trainerCount: number;
  treasury: number;
  closeEligible: boolean;
}) {
  return (
    <section aria-label="Season Close Checklist" className="space-y-4">
      <SectionDivider label="Season Close Checklist" variant="gold" />
      <Surface variant="glass" className="space-y-3 border-white/5 p-4">
        <ChecklistRow
          to="/stable/recruit"
          title="Review roster"
          detail={`${activeCount} active warriors under contract`}
          status={{ ready: activeCount > 0, readyLabel: 'Ready', reviewLabel: 'Needs review' }}
        />
        <ChecklistRow
          to="/stable/trainers"
          title="Review staff"
          detail={`${trainerCount} trainers under contract`}
          status={{ ready: trainerCount > 0, readyLabel: 'Ready', reviewLabel: 'Needs review' }}
        />
        <ChecklistRow
          to="/stable/finance"
          title="Audit ledger"
          detail={`${treasury} gold in treasury`}
          status={{ ready: treasury >= 0, readyLabel: 'Solvent', reviewLabel: 'Crisis' }}
        />
        <div className="flex items-center justify-between gap-4 border border-white/5 bg-black/20 p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground">
              Close season
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground/50">
              Advancement remains available; close only during the offseason window.
            </p>
          </div>
          <ChecklistStatus
            ready={closeEligible}
            readyLabel="Close eligible"
            reviewLabel="Close unavailable"
          />
        </div>
      </Surface>
    </section>
  );
}

/** Right column: season close checklist, action links + historical-context note. */
function DirectivesColumn({
  activeCount,
  trainerCount,
  treasury,
  closeEligible,
}: {
  activeCount: number;
  trainerCount: number;
  treasury: number;
  closeEligible: boolean;
}) {
  return (
    <div className="lg:col-span-4 space-y-12">
      <SeasonCloseChecklist
        activeCount={activeCount}
        trainerCount={trainerCount}
        treasury={treasury}
        closeEligible={closeEligible}
      />
      <div className="space-y-6">
        <SectionDivider label="Season Actions" />
        <div className="flex flex-col gap-4">
          {SEASON_ACTIONS.map((item) => (
            <Link key={item.to} to={item.to}>
              <Surface
                variant="glass"
                className="p-5 border-white/5 hover:border-primary/40 transition-all group flex items-center gap-4 motion-reduce:transition-none"
              >
                <ImperialRing size="sm" variant={item.variant}>
                  <item.icon className="h-4 w-4" />
                </ImperialRing>
                <div className="flex-1">
                  <div className="text-[11px] font-black uppercase tracking-widest group-hover:text-primary transition-colors motion-reduce:transition-none">
                    {item.label}
                  </div>
                  <div className="text-[9px] text-muted-foreground/40 uppercase font-black tracking-tight mt-0.5">
                    {item.sub}
                  </div>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground/20 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:transform-none" />
              </Surface>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <SectionDivider label="Historical Context" />
        <Surface variant="glass" className="p-6 border-white/5 bg-white/[0.01]">
          <div className="flex items-start gap-4">
            <ImperialRing size="xs" variant="bronze">
              <History className="h-3 w-3 text-muted-foreground/40" />
            </ImperialRing>
            <div className="text-[10px] text-muted-foreground/60 leading-relaxed uppercase font-black tracking-tight">
              <span className="text-foreground">Note:</span> The offseason is the only window for
              making roster changes without penalty. Aging is paused during this period.
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

/**
 * Offseason.
 */
export default function Offseason() {
  const { week, roster, trainers, treasury } = useGameStore(
    useShallow((s) => ({
      week: s.week,
      roster: s.roster,
      trainers: s.trainers,
      treasury: s.treasury,
    }))
  );
  const activeCount = roster.filter((w) => isActive(w)).length;
  const closeEligible = week === 1;

  return (
    <PageFrame maxWidth="xl" className="pb-32">
      <PageHeader
        title="Offseason"
        subtitle="YEAR-END · RETROSPECTIVE"
        eyebrow="Chronicle Archive"
        icon={CalendarDays}
        actions={
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end px-4 border-r border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                Cycle Status
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-arena-gold">
                {closeEligible ? 'Off-Season' : 'In Season'}
              </span>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Retrospective Analysis */}
        <div className="lg:col-span-8 space-y-12">
          <div className="space-y-6">
            <SectionDivider label="Season Recap" variant="gold" />
            <YearEndRecap />
          </div>

          <div className="space-y-6">
            <SectionDivider label="Season Review" />
            <SeasonSynthesis />
          </div>
        </div>

        <DirectivesColumn
          activeCount={activeCount}
          trainerCount={trainers.length}
          treasury={treasury}
          closeEligible={closeEligible}
        />
      </div>
    </PageFrame>
  );
}
