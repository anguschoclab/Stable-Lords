import { type GameState, type InsightToken } from "@/types/state.types";
import { type Warrior } from "@/types/warrior.types";

/**
 * Stable Lords — Token Mutation Logic
 * Handles the consumption of Insight Tokens to reveal warrior secrets.
 */

export function consumeInsightToken(state: GameState, tokenId: string, warriorId: string): GameState {
  const token = state.insightTokens?.find(t => t.id === tokenId);
  if (!token) return state;

  const updatedState = { ...state };
  
  // 1. Update the Warrior
  updatedState.roster = updatedState.roster.map(w => {
    if (w.id !== warriorId) return w;

    const draft = { ...w };
    if (!draft.favorites) {
       draft.favorites = {
         weaponId: "gladius",
         rhythm: { oe: 0.5, al: 0.5 },
         discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 }
       };
    }

    if (token.type === "Weapon") {
      draft.favorites.discovered.weapon = true;
    } else if (token.type === "Rhythm") {
      draft.favorites.discovered.rhythm = true;
    }

    return draft;
  });

  // 2. Remove the Token
  updatedState.insightTokens = updatedState.insightTokens.filter(t => t.id !== tokenId);

  return updatedState;
}
