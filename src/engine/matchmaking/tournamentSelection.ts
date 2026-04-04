import type { GameState, Warrior, RivalStableData, TournamentEntry, TournamentBout } from "@/types/game";
import { makeWarrior } from "@/engine/factories";
import { FightingStyle } from "@/types/shared.types";
import { SeededRNG } from "@/utils/random";

/**
 * TournamentSelectionService - Handles qualification and filler logic for 64-man tournaments.
 */
export const TournamentSelectionService = {
  /**
   * Selects the top 64 warriors for a specific tier.
   * If not enough stable-affiliated warriors, generates NPC freelancers.
   */
  selectQualifiedWarriors(state: GameState, tier: string, seed: number): { warriors: Warrior[]; stabledIds: string[] } {
    const rng = new SeededRNG(seed);
    const qualified: Warrior[] = [];
    
    // 1. Collect all stable-affiliated warriors in this tier
    const worldWarriors: { warrior: Warrior; stable: RivalStableData | null }[] = [];
    
    // Rivals
    (state.rivals || []).forEach(r => {
      if (r.tier === tier) {
        r.roster.forEach(w => {
          if (w.status === "Active") {
            worldWarriors.push({ warrior: w, stable: r });
          }
        });
      }
    });

    // Player (if matching tier)
    if (state.player.renown === (tier === "Legendary" ? 5 : tier === "Major" ? 2 : tier === "Established" ? 1 : 0)) {
      state.roster.forEach(w => {
         if (w.status === "Active") {
           worldWarriors.push({ warrior: w, stable: null });
         }
      });
    }

    // 2. Rank by Season Points (Wins/Kills)
    // Formula: (Wins * 3) + (Kills * 5) + (Fame / 10)
    const ranked = worldWarriors.sort((a, b) => {
      const scoreA = (a.warrior.career?.wins || 0) * 3 + (a.warrior.career?.kills || 0) * 5 + (a.warrior.fame || 0) / 10;
      const scoreB = (b.warrior.career?.wins || 0) * 3 + (b.warrior.career?.kills || 0) * 5 + (b.warrior.fame || 0) / 10;
      return scoreB - scoreA;
    });

    // Take top 64 (or all available if < 64)
    const elite = ranked.slice(0, 64).map(r => r.warrior);
    qualified.push(...elite);

    // 3. Fill with NPC Freelancers if < 64
    const fillersNeeded = 64 - qualified.length;
    for (let i = 0; i < fillersNeeded; i++) {
        const freelancer = this.generateFreelancer(tier, i, rng);
        qualified.push(freelancer);
    }

    return { 
      warriors: qualified.slice(0, 64), 
      stabledIds: elite.map(w => w.id) 
    };
  },

  /**
   * Generates a full 64-man tournament entry for a given week and season.
   */
  generateTournament(state: GameState, tier: string, week: number, season: string, seed: number): TournamentEntry {
    const { warriors } = this.selectQualifiedWarriors(state, tier, seed);
    const shuffled = [...warriors].sort(() => Math.random() - 0.5);
    
    const bracket: TournamentBout[] = [];
    // Round 1 has 32 matches
    for (let i = 0; i < 64; i += 2) {
      bracket.push({
        round: 1,
        matchIndex: i / 2,
        a: shuffled[i].name,
        d: shuffled[i+1].name,
        stableA: shuffled[i].stableId,
        stableD: shuffled[i+1].stableId,
      });
    }

    return {
      id: `t_${tier.toLowerCase()}_${week}`,
      season: season as any,
      week,
      name: `${season} ${tier} Grand Championship`,
      bracket,
      completed: false
    };
  },

  /**
   * Generates a "Freelancer" NPC to fill tournament brackets.
   * Tier influences their attribute pool.
   */
  generateFreelancer(tier: string, index: number, rng: SeededRNG): Warrior {
    const styles = Object.values(FightingStyle);
    const style = rng.pick(styles);
    
    // Attribute Pool scaling
    // Minor: 70 pts, Established: 85 pts, Major: 100 pts, Legendary: 120 pts
    const pool = tier === "Legendary" ? 120 : tier === "Major" ? 100 : tier === "Established" ? 85 : 70;
    
    const attrs = {
      ST: 5, CN: 5, SZ: 10, WT: 10, WL: 10, SP: 5, DF: 5
    };
    
    let remaining = pool - (5+5+10+10+10+5+5);
    const keys: (keyof typeof attrs)[] = ["ST", "CN", "SP", "DF", "WL", "WT"];
    
    while (remaining > 0) {
      const key = rng.pick(keys);
      if (attrs[key] < 25) {
        attrs[key]++;
        remaining--;
      }
    }

    return makeWarrior(
      undefined, 
      `Freelancer ${rng.pick(["Thrax", "Murmillo", "Retiarius", "Dimachaerus"])} #${index}`,
      style,
      attrs,
      {},
      () => rng.next()
    );
  }
};
