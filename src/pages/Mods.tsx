/**
 * Mods — House Rules and content-pack loader.
 * Spec: Feature Matrix #25 (`/mods`) and #36 (Content Updater).
 */
import { useRef } from 'react';
import { FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { useGameStore } from '@/state/useGameStore';
import { CANONICAL_HOUSE_RULES } from '@/types/state.types';
import { parseContentPack } from '@/lib/contentPacks';
import { ContentPacksSection, HouseRulesSection } from '@/pages/mods/sections';

/**
 * Mods page.
 */
export default function Mods() {
  const houseRules = useGameStore((s) => s.houseRules) ?? CANONICAL_HOUSE_RULES;
  const contentPacks = useGameStore((s) => s.contentPacks) ?? [];
  const setState = useGameStore((s) => s.setState);
  const fileRef = useRef<HTMLInputElement>(null);

  const nonCanonical = houseRules.deathRateMult !== 1 || houseRules.severeInjuryInsteadOfDeath;

  const setRules = (patch: Partial<typeof houseRules>) => {
    setState((s) => {
      s.houseRules = { ...CANONICAL_HOUSE_RULES, ...s.houseRules, ...patch };
    });
  };

  const installPack = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result;
        if (typeof content !== 'string') throw new Error('Invalid file content');
        const pack = parseContentPack(content);
        if (contentPacks.some((p) => p.id === pack.id)) {
          toast.error(`Pack "${pack.id}" is already installed.`);
          return;
        }
        setState((s) => {
          s.contentPacks = [...(s.contentPacks ?? []), pack];
        });
        toast.success(`Content pack "${pack.name}" installed.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load pack.');
      }
    };
    reader.onerror = () => toast.error('Failed to read file.');
    reader.readAsText(file);
  };

  const removePack = (id: string) => {
    setState((s) => {
      s.contentPacks = (s.contentPacks ?? []).filter((p) => p.id !== id);
    });
    toast.success('Content pack removed.');
  };

  return (
    <PageFrame maxWidth="lg">
      <PageHeader
        icon={FlaskConical}
        eyebrow="Utilities"
        title="Mods & House Rules"
        subtitle="NON-CANONICAL VARIANTS & CONTENT PACKS"
      />

      <div className="space-y-8">
        <div>
          <SectionDivider label="House Rules" variant="gold" />
          <HouseRulesSection
            houseRules={houseRules}
            nonCanonical={nonCanonical}
            setRules={setRules}
          />
        </div>

        <div>
          <SectionDivider label="Content Packs" variant="gold" />
          <ContentPacksSection
            contentPacks={contentPacks}
            fileRef={fileRef}
            installPack={installPack}
            removePack={removePack}
          />
        </div>
      </div>
    </PageFrame>
  );
}
