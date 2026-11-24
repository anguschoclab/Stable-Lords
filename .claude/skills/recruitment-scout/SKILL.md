---
name: recruitment-scout
description: Run recruitment, scouting, draft, signing, and materialization-parity tests. Implementation guidance lives in stable-management and warrior-development.
disable-model-invocation: true
---

# Recruitment and scouting runner

```bash
bun run test --reporter=verbose "src/test/engine/recruitment.test.ts" "src/test/engine/recruitment/" "src/test/engine/scouting.test.ts" "src/test/engine/scouting/" "src/test/engine/recruitScouting.test.ts" "src/test/engine/draftService.test.ts" "src/test/engine/potential.test.ts"
bun run test --reporter=verbose "src/test/engine/ai/recruitMaterialization.parity.test.ts" "src/test/engine/owner/recruitmentUnification.test.ts"
```

`stable-management` owns pool/draft/signing flow; `warrior-development` owns
potential and growth; `rival-ai` owns draft decisions. `run-domain-tests` owns
path/title filtering. Select the relevant paths, not an unmapped `generation`
or `bloodlines` argument.

Read tier weights from `rollPotentialTier` in
`src/engine/warrior/potential.ts` (Common 50%, Promising 30%, Exceptional 15%,
Prodigy 5% at audit time), not the former percentages that totaled only 60%.
Generation flows through `src/engine/recruitment/recruitment/generate.ts`;
signing must preserve recruit identity, lineage, favorites, traits, and avatar
metadata rather than rerolling a different warrior. Seeded name/style draws are
order-sensitive. Compare player/AI materialization, not just pool creation.
