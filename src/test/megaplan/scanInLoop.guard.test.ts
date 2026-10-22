import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectScanInLoop } from '../../../scripts/scan-in-loop.mjs';

/**
 * scan-in-loop guard — megaplan ratchet.
 *
 * External audit finding: `Array.find/.filter/.some/.includes/.indexOf`
 * executing once per loop iteration is O(N×M); an indexBy/groupBy/keySet
 * built before the loop turns it into O(N). The scanner (AST-accurate,
 * typescript compiler API) flags every such call nested in a loop body or
 * an iterative-method callback.
 *
 * KNOWN_EXCEPTIONS are reviewed LEGITIMATE scans only: bounded lists (bout
 * warriorIds, severity tables), per-iteration collections (each item's own
 * roster/tags/participants), string substring checks, one-time index
 * construction, and early-return scans. Every entry requires a concrete
 * 'why' — no placeholder reasons. Keyed on file + code substring so line
 * drift doesn't silently break the guard. Ceiling is 0 beyond the list.
 */
const KNOWN_EXCEPTIONS: { file: string; match: string; why: string }[] = [
  {
    file: 'src/components/arena/TacticalLogView.tsx',
    match: "log.findIndex((e) => e.minute === targetMinute)",
    why: 'early-return backward walk — the findIndex executes at most once per call',
  },
  {
    file: 'src/components/avatar/AvatarForEntity.tsx',
    match: "r.roster?.some((w) => w.id === entityId)",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/components/bout-viewer/AIDebugDrawer.tsx',
    match: "r.roster?.some((w) => w.id === viewer.id)",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/components/layout/breadcrumbs/routeCrumbs.ts',
    match: "r.roster?.some((w) => w.id === id)",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/data/arenas/registry.ts',
    match: "a.tags.includes(tag)",
    why: 'per-iteration collection — the current item\'s own tag/style list (small)',
  },
  {
    file: 'src/data/equipment/equipment.utils.ts',
    match: "item.restrictedStyles?.includes(style)",
    why: 'per-iteration collection — the current item\'s own tag/style list (small)',
  },
  {
    file: 'src/engine/advisor/boutOfferAdvisor/gates.ts',
    match: "o.warriorIds.includes(warrior.id)",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/advisor/stableCouncil/directives.ts',
    match: "(patch.conditions ?? []).some( (c) => !coveredTriggers.has(c.trigger.type) )",
    why: 'per-iteration collection — each payload patch\'s own suggested conditions (inner scan already Set-backed)',
  },
  {
    file: 'src/engine/advisor/stableCouncil/lookahead.ts',
    match: "o.warriorIds.find((wid) => playerWarriorIds.has(wid))",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/advisor/stableCouncil/lookahead.ts',
    match: "o.warriorIds.find((wid) => playerWarriorIds.has(wid))",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/advisor/stableCouncil/lookahead.ts',
    match: "o.warriorIds.find((wid) => wid !== playerId)",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/advisor/stableCouncilService.ts',
    match: "o.warriorIds.some((wid) => playerWarriorIds.has(wid) && o.responses[wid] === 'Pe",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/advisor/trainingAdvisor.ts',
    match: "w.reason.includes('ceiling')",
    why: 'string substring check, not array membership — out of scope',
  },
  {
    file: 'src/engine/aging/agingSystem.ts',
    match: "rUpdate.roster.filter((w) => !retiredIds.has(w.id))",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/engine/ai/expansionService.ts',
    match: "candidate.roster.some((w) => ctx.usedWarriorIds.has(w.id))",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/engine/ai/memory/seasonRecord.ts',
    match: "fight.analysis?.factors.find((f) => f.favored === (side === 'A' ? 'D' : 'A'))",
    why: 'per-iteration collection — each fight\'s own analysis factors',
  },
  {
    file: 'src/engine/ai/workers/budgetWorker.ts',
    match: "offer.warriorIds.some((id) => rosterIds.has(id as string))",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/ai/workers/competitionWorker/boutAcceptance/gates.ts',
    match: "(BLOCKING_INJURY_SEVERITIES as readonly string[]).includes(injury.severity as Bl",
    why: 'bounded constant list — O(few) by construction',
  },
  {
    file: 'src/engine/ai/workers/competitionWorker/offerProcessor/counters.ts',
    match: "Object.values(responses).includes('Countered')",
    why: 'bounded scan — offer.responses is a ≤2-entry record',
  },
  {
    file: 'src/engine/ai/workers/crownWorker.ts',
    match: "(champ.injuries ?? []).some((i) => i.permanent)",
    why: 'per-iteration collection — the current item\'s own field',
  },
  {
    file: 'src/engine/ai/workers/intelWorker.ts',
    match: "offer.warriorIds.find((id) => selfIds.has(id))",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/ai/workers/intelWorker.ts',
    match: "offer.warriorIds.find((id) => id !== mine)",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/ai/workers/intelWorker.ts',
    match: "offer.warriorIds.find((id) => selfIds.has(id))",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/ai/workers/intelWorker.ts',
    match: "offer.warriorIds.find((id) => id !== mine)",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/autosim/autosim.ts',
    match: "o.warriorIds.some((id) => playerIds.has(id))",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/autosim/autosim.ts',
    match: "offer.warriorIds.find((id) => playerIds.has(id))",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/avatar/avatarCatalog.ts',
    match: "entry.tags.includes(tag)",
    why: 'per-iteration collection — the current item\'s own tag/style list (small)',
  },
  {
    file: 'src/engine/avatar/avatarGenerator.ts',
    match: "e.tags.includes('wrinkles')",
    why: 'per-iteration collection — the current item\'s own tag/style list (small)',
  },
  {
    file: 'src/engine/avatar/avatarGenerator.ts',
    match: "e.tags.includes('scar')",
    why: 'per-iteration collection — the current item\'s own tag/style list (small)',
  },
  {
    file: 'src/engine/avatar/avatarGenerator.ts',
    match: "e.tags.includes('eyepatch')",
    why: 'per-iteration collection — the current item\'s own tag/style list (small)',
  },
  {
    file: 'src/engine/avatar/avatarGenerator.ts',
    match: "e.tags.includes('warpaint')",
    why: 'per-iteration collection — the current item\'s own tag/style list (small)',
  },
  {
    file: 'src/engine/bout/crowdMood.ts',
    match: "f.flashyTags?.includes('Flashy')",
    why: 'per-iteration collection — the current item\'s own field',
  },
  {
    file: 'src/engine/bout/offerCleanup.ts',
    match: "(offer.warriorIds ?? []).some( (wId) => wId && (deadIds.has(wId) || retiredIds.h",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/championship/arenaChampionship/core.ts',
    match: "(r.roster ?? []).some((w) => w.id === warriorId)",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/engine/championship/arenaChampionship/core.ts',
    match: "o.warriorIds.includes(warriorId)",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/championship/arenaChampionship/core.ts',
    match: "o.warriorIds.includes(warriorId)",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/championship/arenaChampionship/phases/refusals.ts',
    match: "offer.warriorIds.find((id) => offer.responses?.[id] === 'Declined' && !isVoidDec",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/championship/arenaChampionship/phases/refusals.ts',
    match: "offer.warriorIds.find( (id) => offer.responses?.[id] !== 'Accepted' && !isVoidDe",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/championship/arenaChampionship/phases/relinquish.ts',
    match: "rival.roster.some((w) => w.id === champId)",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/engine/championship/arenaChampionship/phases/seeding.ts',
    match: "rows.find((r) => !picked.has(r.warrior.id))",
    why: 'per-iteration rows (arena-ranked list from a per-arena map) — `picked` mutates mid-loop, so the scan must rerun',
  },
  {
    file: 'src/engine/championship/championsTournament.ts',
    match: "[...t.bracket] .filter((b) => !b.isBronzeMatch)",
    why: 'per-iteration collection — each tournament\'s own bracket',
  },
  {
    file: 'src/engine/combat/mechanics/hitLocation.ts',
    match: "covered.includes(l)",
    why: 'bounded constant list — O(few) by construction',
  },
  {
    file: 'src/engine/core/entityIndex.ts',
    match: "[rival.tier, rival.philosophy, rival.owner.personality].filter(Boolean)",
    why: 'per-iteration tiny literals — a small fixed-size filter / name tokenization of the current entry',
  },
  {
    file: 'src/engine/core/entityIndex.ts',
    match: "name.split(/\\s+/).some((w) => w.startsWith(q))",
    why: 'per-iteration tiny literals — a small fixed-size filter / name tokenization of the current entry',
  },
  {
    file: 'src/engine/core/entityIndex.ts',
    match: "entry.searchText.includes(q)",
    why: 'string substring check, not array membership — out of scope',
  },
  {
    file: 'src/engine/gazette/gazetteDetections.ts',
    match: "f.flashyTags?.includes('Comeback')",
    why: 'per-iteration collection — the current item\'s own field',
  },
  {
    file: 'src/engine/gazette/gazetteDetections.ts',
    match: "f.flashyTags?.includes('Dominance')",
    why: 'per-iteration collection — the current item\'s own field',
  },
  {
    file: 'src/engine/impacts/rivals.ts',
    match: "r.roster.some((w) => value.has(w.id))",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/engine/impacts/rivals.ts',
    match: "r.roster.some((w) => ids.has(w.id))",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/engine/impacts/rivals.ts',
    match: "r.roster.filter((w) => !ids.has(w.id))",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/engine/injuries/injurySystem.ts',
    match: "(biasLocs as readonly string[]).includes(i.location)",
    why: 'bounded constant list — O(few) by construction',
  },
  {
    file: 'src/engine/matchmaking/boutOfferFilters.ts',
    match: "offer.warriorIds.some((wId: string) => playerIds.has(wId))",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/matchmaking/boutOfferFilters.ts',
    match: "o.warriorIds.includes(selectedWarriorId as WarriorId)",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/matchmaking/tournamentSelection/resolution/results.ts',
    match: "r.roster.some((w) => w.id === victim.id)",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/engine/matchmaking/tournamentSelection/resolution/results.ts',
    match: "r.roster.filter((w) => w.id !== victim.id)",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/engine/owner/grudges.ts',
    match: "PERSONALITY_CLASH[persA]?.includes(persB)",
    why: 'bounded constant lookup row — PERSONALITY_CLASH values are tiny fixed lists',
  },
  {
    file: 'src/engine/owner/grudges.ts',
    match: "PERSONALITY_CLASH[persB]?.includes(persA)",
    why: 'bounded constant lookup row — PERSONALITY_CLASH values are tiny fixed lists',
  },
  {
    file: 'src/engine/pipeline/passes/RecruitmentPass.ts',
    match: "r.roster.filter(isActive)",
    why: 'one-time index construction — the single pass that builds activeCounts, not a repeated scan',
  },
  {
    file: 'src/engine/pipeline/passes/RecruitmentPass.ts',
    match: "orderRivalsForClearance([...rivalsById.values()], state.week).filter( (r) => (ac",
    why: 'per-iteration recompute — rivalsById mutates as stables sign clearance veterans; the inner roster scan was already hoisted into activeCounts',
  },
  {
    file: 'src/engine/pipeline/passes/rivalStableShard/successorMint.ts',
    match: "newStable.roster.some((w) => usedWarriorIds.has(w.id))",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/engine/pipeline/passes/RivalStrategyPass/churn.ts',
    match: "stable.roster.some((w) => usedWarriorIds.has(w.id))",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/engine/pipeline/services/weekPipeline/caches.ts',
    match: "Object.keys(impact).some((k) => CACHE_TOUCHING_KEYS.has(k as keyof StateImpact))",
    why: 'per-iteration record — each impact\'s own keys; nothing invariant to hoist',
  },
  {
    file: 'src/engine/pipeline/services/weekPipeline/finalize.ts',
    match: "r.seasonalGrowth?.filter((sg) => sg.season === state.season)",
    why: 'per-iteration collection — each stable\'s own seasonalGrowth entries',
  },
  {
    file: 'src/engine/recruitment/draftService.ts',
    match: "r.roster.filter(isActive)",
    why: 'disjoint per-stable roster scan — total work is linear in roster size; the .some gate also preserves referential identity for untouched stables',
  },
  {
    file: 'src/engine/stable/stableReputation.ts',
    match: "item.includes(stableName)",
    why: 'string substring check, not array membership — out of scope',
  },
  {
    file: 'src/engine/stats/simulationMetrics.ts',
    match: "o.warriorIds.some((id) => playerIds.has(id as string))",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/stats/simulationMetrics.ts',
    match: "code.includes('@CORNER')",
    why: 'string substring check, not array membership — out of scope',
  },
  {
    file: 'src/engine/storage/truncation.ts',
    match: "(r.seasonalGrowth || []).filter((sg) => sg.season === state.season)",
    why: 'per-iteration collection — each stable\'s own seasonalGrowth entries',
  },
  {
    file: 'src/engine/trainers/trainerAging.ts',
    match: "updatedRivalTrainers.some((t, i) => { const orig = rivalTrainers[i]; return !ori",
    why: 'per-iteration collection — each stable\'s own trainer list',
  },
  {
    file: 'src/engine/training/trainingGains/traitTraining.ts',
    match: "t.styles.includes(warrior.style)",
    why: 'per-iteration collection — the current item\'s own tag/style list (small)',
  },
  {
    file: 'src/engine/training/trainingGains/traitTraining.ts',
    match: "g.includes(traitId)",
    why: 'per-iteration collection — the current item\'s own tag/style list (small)',
  },
  {
    file: 'src/engine/training/trainingGains/traitTraining.ts',
    match: "existing.some((e) => g.includes(e))",
    why: 'per-iteration collection — the current item\'s own tag/style list (small)',
  },
  {
    file: 'src/engine/training/trainingGains/traitTraining.ts',
    match: "g.includes(e)",
    why: 'per-iteration collection — the current item\'s own tag/style list (small)',
  },
  {
    file: 'src/engine/traits/generation.ts',
    match: "t.styles?.includes(style)",
    why: 'per-iteration collection — the current item\'s own tag/style list (small)',
  },
  {
    file: 'src/engine/traits/mods.ts',
    match: "Object.entries(def.effect.fightPlanMod).filter( (e): e is [keyof FightPlan, numb",
    why: 'module-init pass over the static TRAITS registry — runs once at load',
  },
  {
    file: 'src/engine/validate/stateInvariants.ts',
    match: "offer.warriorIds.includes(wId)",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/engine/warrior/health.ts',
    match: "(w.injuries || []).filter((i): i is InjuryData => typeof i !== 'string')",
    why: 'per-iteration collection — the current item\'s own field',
  },
  {
    file: 'src/hooks/useDigestSummary.ts',
    match: "o.warriorIds.some( (id) => playerWarriorIds.has(id) && (o.responses[id] === 'Pen",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/hooks/useDigestSummary.ts',
    match: "o.warriorIds.some((id) => playerWarriorIds.has(id))",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/hooks/useListShell.ts',
    match: "opts.searchText(item).some((s) => s.toLowerCase().includes(q))",
    why: 'string substring check, not array membership — out of scope',
  },
  {
    file: 'src/hooks/useListShell.ts',
    match: "s.toLowerCase().includes(q)",
    why: 'string substring check, not array membership — out of scope',
  },
  {
    file: 'src/hooks/useTacticalAlerts.ts',
    match: "o.warriorIds.some( (id) => playerWarriorIds.has(id) && (o.responses[id] === 'Pen",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/lib/bibleIndex.ts',
    match: "section.lower.includes(q)",
    why: 'string substring check, not array membership — out of scope',
  },
  {
    file: 'src/lib/boutUtils.ts',
    match: "keywords.some((k) => t.includes(k))",
    why: 'string substring check, not array membership — out of scope',
  },
  {
    file: 'src/lib/boutUtils.ts',
    match: "t.includes(k)",
    why: 'string substring check, not array membership — out of scope',
  },
  {
    file: 'src/lib/contentPacks.ts',
    match: "(p.arenaLore ?? []).filter((e) => e.arenaId === arenaId)",
    why: 'per-iteration collection — each content pack\'s own lore entries',
  },
  {
    file: 'src/pages/BookingOffice/components/OfferCard.tsx',
    match: "offer.warriorIds.includes(w.id)",
    why: 'bounded scan — bout offer warriorIds is a ≤2-element list; a Set adds allocation without gain',
  },
  {
    file: 'src/pages/TournamentPrep.tsx',
    match: "t.participants.filter((w) => w.stableId === player?.id)",
    why: 'per-iteration collection — each tournament\'s own participants',
  },
];

interface ScanViolation {
  file: string;
  line: number;
  text: string;
}

describe('megaplan: scan-in-loop guard', () => {
  const { violations } = collectScanInLoop() as { violations: ScanViolation[] };
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

  it('no NEW in-loop linear scans beyond the reviewed exceptions', () => {
    const novel = violations.filter(
      (v) => !KNOWN_EXCEPTIONS.some((k) => k.file === v.file && norm(v.text).startsWith(k.match))
    );
    expect(
      novel,
      `new in-loop linear scans introduced — hoist/index or extend the allowlist knowingly:\n${novel
        .map((v) => `  ${v.file}:${v.line}  ${v.text.split('\n')[0]}`)
        .join('\n')}`
    ).toEqual([]);
  });

  it('every allowlisted exception still exists (stale entries must be removed)', () => {
    for (const k of KNOWN_EXCEPTIONS) {
      expect(
        violations.some((v) => v.file === k.file && norm(v.text).startsWith(k.match)),
        `allowlisted exception no longer found: ${k.file} "${k.match}" — remove it from KNOWN_EXCEPTIONS`
      ).toBe(true);
    }
  });

  it('every exception carries a reviewed reason (no placeholders)', () => {
    for (const e of KNOWN_EXCEPTIONS) {
      expect(e.why.length, `${e.file} ${e.match}`).toBeGreaterThan(20);
      expect(e.why).not.toMatch(/pending triage|todo|fixme|baseline/i);
    }
  });
});
