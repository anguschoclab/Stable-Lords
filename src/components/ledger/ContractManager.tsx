import { useGameStore } from '@/state/useGameStore';
import { Link } from '@tanstack/react-router';
import { TRAINER_WEEKLY_SALARY } from '@/engine/trainers';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatBattery } from '@/components/ui/StatBattery';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  GraduationCap,
  AlertTriangle,
  Coins,
  UserCheck,
  TrendingDown,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Trainer } from '@/types/game';

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function getSalary(tier: Trainer['tier']): number {
  return TRAINER_WEEKLY_SALARY[tier] ?? 35;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ContractPortfolioHeaderProps {
  activeCount: number;
  totalWeeklyExpense: number;
  expiringSoonCount: number;
}

function ContractPortfolioHeader({
  activeCount,
  totalWeeklyExpense,
  expiringSoonCount,
}: ContractPortfolioHeaderProps) {
  return (
    <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-900/40 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
          <UserCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-base font-black uppercase tracking-tight">
            Personnel_Contract_Ledger
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
              Faculty_Enlistment // Active_Staff: {activeCount}
            </span>
            <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
            Weekly_Payroll_Sync
          </span>
          <span className="font-mono font-black text-destructive text-lg">
            -{totalWeeklyExpense.toLocaleString()}G
          </span>
        </div>
        {expiringSoonCount > 0 && (
          <div className="flex flex-col items-end px-6 border-l border-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-destructive opacity-40">
              Impaired_Tenure
            </span>
            <div className="flex items-center gap-2 font-mono font-black text-destructive text-lg">
              <AlertTriangle className="h-4 w-4 animate-bounce" />
              {expiringSoonCount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyContractState() {
  return (
    <div className="py-24 text-center flex flex-col items-center gap-6 group">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
        <GraduationCap className="h-16 w-16 text-muted-foreground opacity-20 relative z-10 group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-display font-black uppercase tracking-[0.2em] text-muted-foreground">
          The_Academy_Is_Offline
        </p>
        <p className="text-xs text-muted-foreground/60 italic max-w-sm mx-auto leading-relaxed">
          No specialists are currently under contract. Institutional growth is stagnant.
          Access the recruitment terminal to restore faculty operations.
        </p>
      </div>
      <Link to="/ops/recruit" className="mt-4">
        <Button>Access_Recruitment_Hub</Button>
      </Link>
    </div>
  );
}

interface TrainerTierBadgeProps {
  tier: Trainer['tier'];
}

function TrainerTierBadge({ tier }: TrainerTierBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[9px] font-black border-none uppercase tracking-[0.2em] px-3 py-0.5 h-auto',
        tier === 'Master'
          ? 'bg-arena-gold/20 text-arena-gold shadow-[0_0_10px_rgba(255,215,0,0.1)]'
          : tier === 'Seasoned'
            ? 'bg-primary/20 text-primary'
            : 'bg-secondary/40 text-muted-foreground'
      )}
    >
      {tier}
    </Badge>
  );
}

interface TrainerSpecializationCellProps {
  focus: Trainer['focus'];
}

function TrainerSpecializationCell({ focus }: TrainerSpecializationCellProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
      <span className="text-xs font-black uppercase tracking-widest text-foreground/80 group-hover:text-foreground transition-all">
        {focus}
      </span>
    </div>
  );
}

interface TrainerTenureCellProps {
  weeksLeft: number;
}

function TrainerTenureCell({ weeksLeft }: TrainerTenureCellProps) {
  const pct = Math.min((weeksLeft / 52) * 100, 100);
  const isExpiring = weeksLeft <= 4;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col gap-1 mx-auto w-full max-w-40">
          <StatBattery
            label="TNR"
            value={pct}
            max={100}
            labelValue={`${weeksLeft}W`}
            colorClass={isExpiring ? 'bg-destructive animate-pulse' : 'bg-primary'}
          />
          {isExpiring && (
            <span className="text-[8px] font-black uppercase text-destructive tracking-[0.2em] animate-pulse text-center">
              Critical_End_Notice
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
        Tenure Remainder: {weeksLeft} Weeks
      </TooltipContent>
    </Tooltip>
  );
}

interface TrainerSalaryCellProps {
  tier: Trainer['tier'];
}

function TrainerSalaryCell({ tier }: TrainerSalaryCellProps) {
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center justify-end gap-2 text-sm font-mono font-black text-destructive/80 group-hover:text-destructive group-hover:drop-shadow-[0_0_5px_rgba(255,0,0,0.2)] transition-all">
        <span>{getSalary(tier)}</span>
        <Coins className="h-4 w-4 text-arena-gold opacity-60" />
      </div>
      <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest mt-0.5">
        Recurring_Debit
      </span>
    </div>
  );
}

interface TrainerRowProps {
  trainer: Trainer;
}

function TrainerRow({ trainer: t }: TrainerRowProps) {
  return (
    <TableRow key={t.id} className="border-white/5 group hover:bg-white/2 transition-colors">
      <TableCell className="pl-8 py-5">
        <div className="flex flex-col">
          <span className="font-display font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">
            {t.name}
          </span>
          {t.retiredFromWarrior && (
            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">
              VETERAN_ID: {t.retiredFromWarrior}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="py-5">
        <TrainerTierBadge tier={t.tier} />
      </TableCell>
      <TableCell className="py-5">
        <TrainerSpecializationCell focus={t.focus} />
      </TableCell>
      <TableCell className="py-5">
        <TrainerTenureCell weeksLeft={t.contractWeeksLeft} />
      </TableCell>
      <TableCell className="text-right pr-8 py-5">
        <TrainerSalaryCell tier={t.tier} />
      </TableCell>
    </TableRow>
  );
}

interface SummaryCardProps {
  icon: LucideIcon;
  iconClass: string;
  borderClass: string;
  label: string;
  value: string;
  sublabel: string;
}

function SummaryCard({ icon: Icon, iconClass, borderClass, label, value, sublabel }: SummaryCardProps) {
  return (
    <Surface
      variant="glass"
      padding="md"
      className={cn(
        'bg-neutral-900/40 border-border/10 flex items-center gap-6 group transition-all',
        borderClass
      )}
    >
      <div
        className={cn(
          'p-4 rounded-none border transition-all',
          iconClass
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">
          {label}
        </p>
        <p className="text-xl font-mono font-black">{value}</p>
        <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">
          {sublabel}
        </p>
      </div>
    </Surface>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Contract manager.
 * @returns The result.
 */
export function ContractManager() {
  // ⚡ Bolt: Narrowed state subscription to prevent re-renders on unrelated global state changes
  const trainers = useGameStore((s) => s.trainers);
  const safeTrainers = trainers ?? [];
  const activeTrainers = safeTrainers.filter((t) => t.contractWeeksLeft > 0);

  const totalWeeklyExpense = activeTrainers.reduce(
    (sum, t) => sum + getSalary(t.tier),
    0
  );

  const expiringSoonCount = activeTrainers.filter((t) => t.contractWeeksLeft <= 4).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── Contract Portfolio Matrix ─── */}
      <Surface
        variant="glass"
        padding="none"
        className="border-border/10 overflow-hidden shadow-2xl relative"
      >
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/40 via-primary/10 to-transparent opacity-50" />

        <ContractPortfolioHeader
          activeCount={activeTrainers.length}
          totalWeeklyExpense={totalWeeklyExpense}
          expiringSoonCount={expiringSoonCount}
        />

        <div className="overflow-x-auto custom-scrollbar">
          {activeTrainers.length === 0 ? (
            <EmptyContractState />
          ) : (
            <Table>
              <TableHeader className="bg-black/20 sticky top-0 z-10 backdrop-blur-md border-b border-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest pl-8 py-4">
                    Personnel_Asset
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 py-4">
                    Classification
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 py-4">
                    Specialization
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-center text-muted-foreground/60 py-4">
                    Tenure_Stability
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-8 py-4">
                    Weekly_Payroll
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTrainers.map((t) => (
                  <TrainerRow key={t.id} trainer={t} />
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Surface>

      {/* ─── Strategic Personnel Summary ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryCard
          icon={TrendingDown}
          iconClass="bg-destructive/10 border-destructive/20 shadow-[0_0_15px_rgba(255,0,0,0.1)] group-hover:bg-destructive/20 text-destructive"
          borderClass="hover:border-destructive/30"
          label="System_Fiscal_Impact"
          value={`-${totalWeeklyExpense.toLocaleString()}G / Cycle`}
          sublabel="Aggregated_Personnel_Maintenance"
        />
        <SummaryCard
          icon={ShieldCheck}
          iconClass="bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] group-hover:bg-primary/20 text-primary"
          borderClass="hover:border-primary/30"
          label="Strategic_Operational_Status"
          value="Martial_Optimization"
          sublabel="Institutional_Efficiency_Synced"
        />
      </div>
    </div>
  );
}
