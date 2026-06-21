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
} from 'lucide-react'; /**
                        * Offseason.
                        */

/**
 * Offseason.
 */
export default function Offseason() {
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
                Off-Season
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

        {/* Right Column: Operational Directives */}
        <div className="lg:col-span-4 space-y-12">
          <div className="space-y-6">
            <SectionDivider label="Season Actions" />
            <div className="flex flex-col gap-4">
              {[
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
              ].map((item) => (
                <Link key={item.to} to={item.to}>
                  <Surface
                    variant="glass"
                    className="p-5 border-white/5 hover:border-primary/40 transition-all group flex items-center gap-4"
                  >
                    <ImperialRing size="sm" variant={item.variant}>
                      <item.icon className="h-4 w-4" />
                    </ImperialRing>
                    <div className="flex-1">
                      <div className="text-[11px] font-black uppercase tracking-widest group-hover:text-primary transition-colors">
                        {item.label}
                      </div>
                      <div className="text-[9px] text-muted-foreground/40 uppercase font-black tracking-tight mt-0.5">
                        {item.sub}
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/20 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
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
                  <span className="text-foreground">Note:</span> The offseason is the only window
                  for making roster changes without penalty. Aging is paused during this period.
                </div>
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
