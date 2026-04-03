import type { GameState, Warrior } from "@/types/game";

export function processHallOfFame(state: GameState, newWeek: number): GameState {
  if (newWeek % 52 !== 0) return state;

  const yearNum = Math.floor(newWeek / 52);
  const hofNews: string[] = [];

  let bestByFame: Warrior | undefined;
  let bestKiller: Warrior | undefined;
  let bestWins: Warrior | undefined;

  const checkWarrior = (w: Warrior) => {
    if (!bestByFame || (w.fame ?? 0) > (bestByFame.fame ?? 0)) bestByFame = w;
    if (w.career.kills > 0 && (!bestKiller || w.career.kills > bestKiller.career.kills)) bestKiller = w;
    if (w.career.wins > 0 && (!bestWins || w.career.wins > bestWins.career.wins)) bestWins = w;
  };

  for (let i = 0; i < state.roster.length; i++) checkWarrior(state.roster[i]);
  for (let i = 0; i < state.graveyard.length; i++) checkWarrior(state.graveyard[i]);
  for (let i = 0; i < state.retired.length; i++) checkWarrior(state.retired[i]);
  if (state.rivals) {
    for (let r = 0; r < state.rivals.length; r++) {
      const roster = state.rivals[r].roster;
      for (let i = 0; i < roster.length; i++) checkWarrior(roster[i]);
    }
  }

  if (bestByFame && (bestByFame.fame ?? 0) > 0) hofNews.push(`🏛️ HALL OF FAME: ${bestByFame.name} (${bestByFame.style}) inducted as Year ${yearNum}'s greatest warrior with ${bestByFame.fame} fame!`);
  if (bestKiller && bestKiller.name !== bestByFame?.name) hofNews.push(`💀 DEADLIEST BLADE: ${bestKiller.name} earns the "Deadliest Blade" honor with ${bestKiller.career.kills} kills in Year ${yearNum}.`);
  if (bestWins && bestWins.name !== bestByFame?.name && bestWins.name !== bestKiller?.name) hofNews.push(`⚔️ IRON CHAMPION: ${bestWins.name} recorded the most victories (${bestWins.career.wins}) in Year ${yearNum}.`);

  const yearTournaments = state.tournaments.filter(t => t.completed && t.champion && t.week >= newWeek - 52);
  for (const t of yearTournaments) hofNews.push(`🏆 ${t.champion} won the ${t.name} (Week ${t.week}).`);

  const stables = [
    { name: state.player.stableName, fame: state.player.fame ?? 0 },
    ...(state.rivals || []).map(r => ({ name: r.owner.stableName, fame: r.roster.reduce((sum, w) => sum + (w.fame ?? 0), 0) })),
  ].sort((a, b) => b.fame - a.fame);

  if (stables[0] && stables[0].fame > 0) hofNews.push(`🏟️ STABLE OF THE YEAR: ${stables[0].name} dominated Year ${yearNum} with ${stables[0].fame} total fame.`);

  if (hofNews.length === 0) return state;

  return { ...state, newsletter: [...state.newsletter, { week: newWeek, title: `Year ${yearNum} Hall of Fame Inductions`, items: hofNews }] };
}
