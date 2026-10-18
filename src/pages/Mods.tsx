/**
 * Mods — House Rules and content-pack loader.
 * Spec: Feature Matrix #25 (`/mods`) and #36 (Content Updater).
 */
import { useRef, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { useGameStore } from '@/state/useGameStore';
import { CANONICAL_HOUSE_RULES } from '@/types/state.types';
import { parseContentPack, type ContentPack } from '@/lib/contentPacks';
import { readFileInput } from '@/utils/fileInput';
import type { GameStore } from '@/state/store.types';
import { ContentPacksSection, HouseRulesSection } from '@/pages/mods/sections';

function useContentPackActions(
  installedPacks: ContentPack[],
  setState: GameStore['setState']
) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingPack, setPendingPack] = useState<string | null>(null);
  const [packError, setPackError] = useState<string | null>(null);

  const installPack = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingPack(e.target.files?.[0]?.name ?? 'content pack');
    setPackError(null);
    readFileInput(
      e,
      (content) => {
        const pack = parseContentPack(content);
        if (installedPacks.some((p) => p.id === pack.id)) {
          setPendingPack(null);
          setPackError(`Pack "${pack.id}" is already installed.`);
          toast.error(`Pack "${pack.id}" is already installed.`);
          return;
        }
        setState((s) => {
          s.contentPacks = [...(s.contentPacks ?? []), pack];
        });
        setPendingPack(null);
        toast.success(`Content pack "${pack.name}" installed.`);
      },
      (err) => {
        const message = err instanceof Error ? err.message : 'Failed to load pack.';
        setPendingPack(null);
        setPackError(message);
        toast.error(message);
      }
    );
  };

  const removePack = (id: string) => {
    setState((s) => {
      s.contentPacks = (s.contentPacks ?? []).filter((p) => p.id !== id);
    });
    toast.success('Content pack removed.');
  };

  return { fileRef, pendingPack, packError, installPack, removePack };
}

/**
 * Mods page.
 */
export default function Mods() {
  const houseRules = useGameStore((s) => s.houseRules) ?? CANONICAL_HOUSE_RULES;
  const contentPacks = useGameStore((s) => s.contentPacks) ?? [];
  const setState = useGameStore((s) => s.setState);
  const { fileRef, pendingPack, packError, installPack, removePack } = useContentPackActions(
    contentPacks,
    setState
  );

  const nonCanonical = houseRules.deathRateMult !== 1 || houseRules.severeInjuryInsteadOfDeath;

  const setRules = (patch: Partial<typeof houseRules>) => {
    setState((s) => {
      s.houseRules = { ...CANONICAL_HOUSE_RULES, ...s.houseRules, ...patch };
    });
  };

  const resetRules = () => setRules(CANONICAL_HOUSE_RULES);

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
            resetRules={resetRules}
          />
        </div>

        <div>
          <SectionDivider label="Content Packs" variant="gold" />
          <ContentPacksSection
            contentPacks={contentPacks}
            fileRef={fileRef}
            pendingPack={pendingPack}
            packError={packError}
            installPack={installPack}
            removePack={removePack}
          />
        </div>
      </div>
    </PageFrame>
  );
}
