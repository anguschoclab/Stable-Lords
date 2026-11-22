# Narrative Agent Journal

Tracked memory for `narrative-agent` runs — critical learnings only (see
`.claude/agents/narrative-agent.md` for what qualifies).

## 2026-11-22 - Gazette headline chain is priority-ordered, and sits near the 80-line ratchet

**Finding:** `generateGazetteHeadline` (`src/engine/gazette/gazetteNarrative.ts`)
is a first-match-wins cascade — TitleBout → streaks → rivalry → rising star →
upset → kills → KOs → standard. New triggers must be inserted at the right
priority slot, not appended at the end where they can never outrank filler.
`generateWeeklyGazette` detections (streaks, rivalry, upsets, debuts) run off
`computeFightAnalysis` over `allFights`, but kills/KOs/title bouts are detected
inline from the week's `fights` — the two detection styles coexist.

**Learning:** Adding ~13 lines inline pushed `generateGazetteHeadline` past
the 80-line function ceiling enforced by
`src/test/megaplan/fileBudget.test.ts` (ratchet count, not a per-file
exception). New headline branches must be extracted helpers called from the
cascade — `titleBoutHeadline` is the pattern.

**Rule:** Headline priority = milestone beats spotlight beats filler. The sim
already stamps `FightSummary.titleArenaId` for championship bouts
(`boutResolution.ts`); both press surfaces now honor it — newsletter FOTW +5
(media-agent, commit 1bb45decc) and gazette `TitleBout` headline + `'Title
Bout'` tag (this run). Templates for new triggers belong in
`src/data/narrative/gazette.json` and must also be declared in
`src/types/narrative/gazette.ts` (`GazetteHeadlines`); supply every
`{{token}}` the template uses — `t()` renders missing keys raw.
