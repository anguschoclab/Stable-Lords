/**
 * Tournament dominance audit — runs a deterministic 52-week headless season
 * and reports, per fighting style: championships, podium spots, and purse gold
 * earned across every seasonal tier (played or sweep-resolved).
 *
 * Run: bun run src/scripts/tournament-dominance.ts
 */
import { runSimulation } from './simulation-harness';
import { loadCombatNarrative } from '@/data/narrative';
import { findWarriorById } from '@/engine/core/warriorLookup';
import type { GameState, TournamentEntry } from '@/types/state.types';

const TIER_PURSE: Record<string, number> = { GOLD: 5000, SILVER: 2500, BRONZE: 1200, IRON: 600 };
const PLACE_MULT = [1.0, 0.5, 0.25] as const;

interface StyleTally {
  championships: number;
  podiums: number;
  purse: number;
  places: number[];
}

function podiumOf(t: TournamentEntry): (string | undefined)[] {
  const finals = t.bracket
    .filter((b) => !b.isBronzeMatch)
    .sort((a, b) => b.round - a.round || a.matchIndex - b.matchIndex)[0];
  const bronze =
    t.bracket.find((b) => b.isBronzeMatch) ??
    t.bracket.find((b) => b.round === 6 && b.matchIndex === 1);
  if (!finals || finals.winner == null) return [];
  const first = finals.winner === 'A' ? finals.warriorIdA : finals.warriorIdD;
  const second = finals.winner === 'A' ? finals.warriorIdD : finals.warriorIdA;
  const third =
    bronze && bronze.winner != null
      ? bronze.winner === 'A'
        ? bronze.warriorIdA
        : bronze.warriorIdD
      : undefined;
  return [first, second, third];
}

function tierOf(t: TournamentEntry): string {
  const raw = (t.tierId || t.id.split('-')[1] || 'Iron').toUpperCase();
  return raw.includes('GOLD')
    ? 'GOLD'
    : raw.includes('SILVER')
      ? 'SILVER'
      : raw.includes('BRONZE')
        ? 'BRONZE'
        : 'IRON';
}

async function main() {
  await loadCombatNarrative();
  const { finalState } = await runSimulation({ weeks: 52, seed: 12345, logFrequency: 13 });
  const state: GameState = finalState;

  const perStyle = new Map<string, StyleTally>();
  const bump = (style: string | undefined, placeIdx: number, purse: number, champ: boolean) => {
    const s = style ?? 'UNKNOWN';
    const t = perStyle.get(s) ?? { championships: 0, podiums: 0, purse: 0, places: [0, 0, 0] };
    if (champ) t.championships++;
    t.podiums++;
    t.purse += purse;
    t.places[placeIdx] = (t.places[placeIdx] ?? 0) + 1;
    perStyle.set(s, t);
  };

  const tournaments = (state.tournaments ?? []).filter((t) => t.completed);
  let sweptCount = 0;
  for (const t of tournaments) {
    const tier = tierOf(t);
    const base = TIER_PURSE[tier] ?? 600;
    const podium = podiumOf(t);
    podium.forEach((warriorId, i) => {
      if (!warriorId) return;
      const w = findWarriorById(state, warriorId, t);
      bump(w?.style, i, Math.floor(base * PLACE_MULT[i]!), i === 0);
    });
    if (t.champion) sweptCount++;
  }

  // Style participation for context: count living warriors per style at end.
  const population = new Map<string, number>();
  const countStyle = (w: { style?: string } | undefined) => {
    if (!w?.style) return;
    population.set(w.style, (population.get(w.style) ?? 0) + 1);
  };
  for (const r of state.rivals ?? []) for (const w of r.roster) countStyle(w);
  for (const w of state.roster ?? []) countStyle(w);

  console.log('\n================ TOURNAMENT DOMINANCE (52 weeks) ================');
  console.log(`Completed tournaments: ${tournaments.length} (champions recorded: ${sweptCount})`);
  console.log('\n  Style               Titles  Podiums  Purse(g)  1st/2nd/3rd   Living');
  const rows = [...perStyle.entries()].sort(
    (a, b) => b[1].championships - a[1].championships || b[1].podiums - a[1].podiums
  );
  for (const [style, t] of rows) {
    const places = `${t.places[0]}/${t.places[1]}/${t.places[2]}`;
    console.log(
      `  ${style.padEnd(20)} ${String(t.championships).padStart(4)} ${String(t.podiums).padStart(8)} ${String(t.purse).padStart(9)} ${places.padStart(12)} ${String(population.get(style) ?? 0).padStart(8)}`
    );
  }

  // Per-tournament champion listing.
  console.log('\n  Per-tournament champions:');
  for (const t of tournaments) {
    const podium = podiumOf(t);
    const champId = podium[0];
    const cw = champId ? findWarriorById(state, champId, t) : undefined;
    console.log(
      `    ${t.name ?? t.id} [${tierOf(t)}]  champion: ${t.champion ?? '?'} (${cw?.style ?? '?'})`
    );
  }
  console.log('===============================================================\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
