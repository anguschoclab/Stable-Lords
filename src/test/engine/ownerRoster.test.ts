/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { processAIRosterManagement } from "@/engine/ownerRoster";
import { FightingStyle } from "@/types/game";

if (!global.crypto) {
  (global as any).crypto = { randomUUID: () => "mock-uuid" };
}

describe("ownerRoster - processAIRosterManagement", () => {
  const mockState: any = {
    week: 1,
    season: "Spring",
    arenaHistory: [],
    rivals: [
      {
        owner: { id: "r1", name: "Rival 1", stableName: "Stable 1", personality: "Aggressive" },
        roster: [
          { id: "w1", name: "Warrior 1", status: "Active", age: 25, career: { wins: 0, losses: 0, kills: 0 }, style: FightingStyle.BashingAttack, attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 } }
        ]
      }
    ],
    player: { id: "p1", stableName: "Player Stable" }
  };

  it("should attempt recruitment when roster is low", () => {
    // Mock Math.random to always trigger recruitment
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    
    const { updatedRivals, gazetteItems } = processAIRosterManagement(mockState);
    
    expect(updatedRivals[0].roster.length).toBeGreaterThan(1);
    expect(gazetteItems.some(i => i.includes("recruits"))).toBe(true);
    
    vi.restoreAllMocks();
  });

  it("should retire old or underperforming warriors", () => {
    const elderlyState = {
      ...mockState,
      rivals: [
        {
          owner: { id: "r1", personality: "Methodical" },
          roster: [
            { id: "w1", status: "Active", age: 31, career: { wins: 0, losses: 10, kills: 0 }, attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 } }
          ]
        }
      ]
    };
    
    vi.spyOn(Math, 'random').mockReturnValue(0.01); // Trigger 15% age-based retirement
    const { updatedRivals, gazetteItems } = processAIRosterManagement(elderlyState as any);
    
    expect(updatedRivals[0].roster.length).toBe(0);
    expect(gazetteItems.some(i => i.includes("retires"))).toBe(true);
    
    vi.restoreAllMocks();
  });
});
