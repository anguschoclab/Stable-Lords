# Plan 5 — Lazy-load recharts

## Problem (confirmed)

`vendor-ui` ~543 kB / 159 kB gzip, almost all recharts + D3. Only two files import recharts:
`src/components/ui/chart.tsx` and `src/components/charts/WarriorRadarChart.tsx` (and `chart.tsx`'s
only consumer is `WarriorRadarChart`). Consumers: `WarriorDossier.tsx` (7, 68, always-visible
card) and `warrior/BiometricsTab.tsx` (3, 33, behind a tab). `ReputationQuadrant` etc. are
hand-rolled SVG (not recharts). No SSR; `React.lazy` already used in `__root.tsx`.

## Why it ships eagerly

A static import chain from the entry reaches recharts. `manualChunks` (`vite.config.ts:57-65`)
names `recharts` inside `vendor-ui`, which is eager (holds `lucide-react`/`date-fns`). **Only a
dynamic `import()` creates a lazy boundary, and the manualChunks rule wins** — so the config
change is mandatory, not optional.

## Fix — lazy boundary at `WarriorRadarChart` (the sole recharts entry)

In **both** `WarriorDossier.tsx` and `BiometricsTab.tsx`: remove the static import; add

```ts
const WarriorRadarChart = lazy(() =>
  import('@/components/charts/WarriorRadarChart').then((m) => ({ default: m.WarriorRadarChart }))
);
```

Wrap the render in:

```tsx
<Suspense fallback={<div className="w-full aspect-square max-w-md mx-auto animate-pulse rounded-none bg-white/5" />}>
  <WarriorRadarChart ... />
</Suspense>
```

The fallback box matches the chart wrapper → no layout shift. `BiometricsTab` currently imports
no React symbols — add `import { lazy, Suspense } from 'react'`. Don't touch
`WarriorRadarChart.tsx`/`ui/chart.tsx` internals (named export → the `.then(default)` shim
handles it; `chart.tsx` rides along).

**Mandatory config** — `vite.config.ts:59`: remove `recharts` →
`'vendor-ui': ['lucide-react', 'date-fns']`. Do not re-name it elsewhere; let Rollup emit the
recharts+d3 async chunk via the dynamic import.

## Verification

`npm run build`: vendor-ui drops ~400 kB raw; a new ~159 kB-gzip recharts chunk appears, NOT
modulepreloaded. `npm run preview`: recharts absent from initial waterfall; open
Dossier/Biometrics → chunk fetches on demand, skeleton then chart; second open = cached.

## Alternative & recommendation

Hand-rolled SVG radar (like `ReputationQuadrant`) removes recharts entirely (~159 kB gzip gone
forever) but is more work + visual-regression risk. **Recommend lazy-load now** (~30 min, near-zero
risk); treat SVG rewrite as an optional follow-up.

## Risks

manualChunks still capturing recharts (biggest trap — verify post-build); fallback flash
(mitigated by matching box); `chart.tsx` shared usage (confirmed single consumer); named-vs-default
export (shim); BiometricsTab missing React import; failed dynamic import degrades to root
`errorComponent` (`__root.tsx:82`).

## Critical files

`vite.config.ts`; `src/components/WarriorDossier.tsx`; `src/components/warrior/BiometricsTab.tsx`;
`src/components/charts/WarriorRadarChart.tsx`; `src/components/ui/chart.tsx`.
