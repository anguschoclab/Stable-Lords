const fs = require('fs');
const filepath = 'src/test/engine/pipeline/passes/SeasonalPass.test.ts';
let content = fs.readFileSync(filepath, 'utf8');

const testCode = `  it('should trigger the midnight_market offseason event, deducting gold, adding XP, and adding an Insight Token', () => {
    const rng = new SeededRNGService(99);
    const originalNext = rng.next.bind(rng);
    let callCount = 0;
    const mockNext = () => {
      callCount++;
      if (callCount === 1)
        return (
          (Object.keys((narrativeContent as any).offseason_events).indexOf('midnight_market') +
            0.5) /
          eventCount
        );
      return originalNext();
    };
    rng.next = mockNext as () => number;

    const impact = runSeasonalPass(baseState, 1, rng);
    expect(impact.treasuryDelta).toBe(-40);
    expect(impact.rosterUpdates).toBeDefined();

    let foundXp = false;
    impact.rosterUpdates!.forEach((u) => {
      if (u.xp && u.xp > 0) foundXp = true;
    });
    expect(foundXp).toBe(true);

    expect(impact.insightTokens).toBeDefined();
    expect(impact.insightTokens!.length).toBe(1);
    expect(impact.insightTokens![0]!.type).toBe('Tactic');

    expect(impact.newsletterItems!.length).toBe(1);
    expect(impact.newsletterItems![0]!.title).toBe('The Midnight Market');
    expect(impact.newsletterItems![0]!.items[0]).toContain('40 gold');
  });
`;

if (!content.includes("should trigger the midnight_market offseason event")) {
  content = content.replace(/describe\('SeasonalPass', \(\) => {/, `describe('SeasonalPass', () => {\n${testCode}`);
  fs.writeFileSync(filepath, content, 'utf8');
  console.log("Added test to SeasonalPass.test.ts");
} else {
  console.log("Test already exists");
}
