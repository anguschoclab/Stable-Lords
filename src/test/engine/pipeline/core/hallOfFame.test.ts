import { describe, it, expect } from "vitest";
import { processHallOfFame } from "@/engine/pipeline/core/hallOfFame";
import type { GameState, Warrior } from "@/types/game";
import { FightingStyle } from "@/types/shared.types";

describe("processHallOfFame", () => {
  const mkW = (id: string, name: string, wins: number, kills: number, fame: number, stableId: string): Warrior => ({
    id,
    name,
    stableId,
    style: FightingStyle.StrikingAttack,
    fame,
    career: { wins, kills, losses: 0 },
    yearlySnapshots: {
      1: { wins: 0, kills: 0, losses: 0, fame: 0 } // Snapshots for Year 1
    },
    status: "Active",
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    awards: []
  } as any);

  const baseState: Partial<GameState> = {
    week: 1,
    year: 2, // Rolled over to Year 2
    player: { id: "p1", stableName: "PlayerStable", fame: 0 } as any,
    fame: 0,
    roster: [],
    rivals: [],
    awards: [],
    newsletter: []
  };

  it("returns state unchanged if not week 1 of a new year", () => {
    const state = { ...baseState, week: 2 } as GameState;
    const res = processHallOfFame(state, 2);
    expect(res).toBe(state);
  });

  it("returns state unchanged if it is the very first week of the game (Year 1)", () => {
    const state = { ...baseState, year: 1 } as GameState;
    const res = processHallOfFame(state, 1);
    expect(res).toBe(state);
  });

  it("correctly calculates and applies annual awards at Year 2 start", () => {
    const state = {
      ...baseState,
      roster: [mkW("w1", "Winner", 10, 0, 10, "p1")],
      rivals: [
        { 
          owner: { id: "r1", stableName: "RivalStable" }, 
          roster: [mkW("w2", "Killer", 5, 5, 20, "r1")],
          fame: 0
        } as any
      ],
    } as GameState;

    const res = processHallOfFame(state, 1);
    
    expect(res.awards.length).toBeGreaterThan(0);
    
    // Warrior of the Year
    const woty = res.awards.find(a => a.type === "WARRIOR_OF_YEAR");
    expect(woty?.warriorName).toBe("Winner");
    expect(woty?.stableId).toBe("p1");

    // Stable of the Year
    const soty = res.awards.find(a => a.type === "STABLE_OF_YEAR");
    expect(soty?.stableName).toBe("PlayerStable"); 

    // Verify Fame rewards 
    // w1 gets WOTY (+50) and CLASS_MVP (+20) -> 10 + 50 + 20 = 80
    const foundWinner = res.roster.find(w => w.id === "w1");
    expect(foundWinner?.fame).toBe(80); 
    
    // Stable fame update:
    // +50 (WOTY) + 20 (MVP) + 50 (SOTY) = 120
    expect(res.fame).toBe(120); 
    expect(res.player.fame).toBe(120); 
  });
});
