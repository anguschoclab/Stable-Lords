# Media Agent Journal

Tracked memory for `.claude/agents/media-agent.md` — press-layer learnings only.

## 2026-11-22 - Newsletter FOTW scorer ignored marquee signals

**Finding:** `scoreFight` in `src/engine/newsletter/feed.ts` scored only
`Comeback`/`Flashy` tags + `by` outcome — a championship bout (`titleArenaId`,
set on `FightSummary` by `boutResolution.ts` when the contract carries it) that
went to Decision scored 0, losing "FIGHT OF THE WEEK" to a routine flashy KO.
The `Epic` (8+ minute war) and `Dominance` (5+ hits) tags the sim emits in
`postFight.generateOutcomeTags` were likewise invisible to the press.

**Learning:** The newsletter feed and the gazette are parallel selection paths
over the same `FightSummary` surface — a sim signal can be gazette-covered
(`Dominance` is a gazette tag) while newsletter-blind. Also: strict `sc > best`
iteration means tied scores resolve by card order — headline-tier weights need
margin, not parity, to be order-independent.

**Rule:** When adding coverage, audit BOTH selection paths
(`gazetteDetections`/`gazetteNarrative` AND `newsletter/feed.scoreFight`) for
the same sim signal — `titleArenaId`, `flashyTags`, `weather`, `isRivalry` are
all real state the press can cite. The gazette headline chain still ignores
`titleArenaId` entirely (needs a template key — bard's file, coordinate).
