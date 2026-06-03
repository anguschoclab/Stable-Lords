import { PaperDoll } from '@/components/ui/PaperDoll';

/**
 * Death modal paper doll section displaying warrior silhouette.
 */
export function DeathModalPaperDoll() {
  return (
    <div className="flex justify-center bg-black/40 rounded-none p-4 border border-white/5 relative group">
      <div className="absolute inset-0 bg-arena-blood/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl rounded-none" />
      <div className="relative w-full max-w-52 aspect-[1/2] opacity-60 grayscale filter contrast-125">
        <PaperDoll healthMap={{}} />
      </div>
    </div>
  );
}
