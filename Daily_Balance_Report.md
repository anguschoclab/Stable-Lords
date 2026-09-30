# Daily Balance Report

## Simulation Results
- **Weeks Simulated:** 1000
- **Total Bouts:** 69961 (56859 weekly / 13102 tournament)
- **Kill Outcomes:** 2523 (1905 weekly / 618 tournament)
- **Unique Deaths:** 2808
- **Weekly Kill Rate:** 3.35% (design target 8–15%)
- **Rival Stable Gold:** mean 26295 / median 24726 (final week)

## Style Win Rates
- **PARRY-STRIKE:** 57.67%
- **PARRY-RIPOSTE:** 54.83%
- **LUNGING ATTACK:** 53.75%
- **TOTAL PARRY:** 53.36%
- **PARRY-LUNGE:** 51.69%
- **SLASHING ATTACK:** 48.75%
- **BASHING ATTACK:** 47.82%
- **STRIKING ATTACK:** 45.32%
- **AIMED BLOW:** 41.06%
- **WALL OF STEEL:** 30.92%

## Suggested Variable Tweaks (For Product Owner Approval)
- **Lethality Note**: Weekly kill rate is 3.35% — below the legacy 8–15% band, consistent with the ~70-pt recruit population (certified fixture band is 6–16%, see balance.slow.test.ts). Raising the world rate further needs a population-conditional approach, not a global constant (fixture overshoots 3–5× faster).
- **Meta Anomaly**: WALL OF STEEL win rate is too low (30.92%). Check style-attr fit first (ARCHETYPE_STAT_WEIGHTS blend in generateRecruitAttrs) before touching combat constants.

