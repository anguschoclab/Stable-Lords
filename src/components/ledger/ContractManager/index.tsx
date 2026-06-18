import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Surface } from '@/components/ui/Surface';
import { TrendingDown, ShieldCheck } from 'lucide-react';
import { useContractData } from './hooks/useContractData';
import { ContractPortfolioHeader } from './components/ContractPortfolioHeader';
import { EmptyContractState } from './components/EmptyContractState';
import { TrainerRow } from './components/TrainerRow';
import { SummaryCard } from './components/SummaryCard';

export function ContractManager() {
  const { activeTrainers, totalWeeklyExpense, expiringSoonCount } = useContractData();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
