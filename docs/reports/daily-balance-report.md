# Daily Balance Report

## Simulation Results
- **Weeks Simulated:** 1000
- **Total Bouts:** 131401 (125046 weekly / 6355 tournament)
- **Kill Outcomes:** 6181 (5855 weekly / 326 tournament)
- **Unique Deaths:** 6181
- **Weekly Kill Rate:** 4.68% (design target 8–15%)
- **Rival Stable Gold:** mean 15406 / median 3579 (final week)

## Style Win Rates
- **TOTAL PARRY:** 62.99%
- **PARRY-RIPOSTE:** 59.38%
- **SLASHING ATTACK:** 48.96%
- **PARRY-STRIKE:** 48.55%
- **PARRY-LUNGE:** 48.42%
- **WALL OF STEEL:** 47.21%
- **STRIKING ATTACK:** 46.80%
- **AIMED BLOW:** 45.13%
- **BASHING ATTACK:** 44.36%
- **LUNGING ATTACK:** 43.66%

## Suggested Variable Tweaks (For Product Owner Approval)
- **Lethality Low**: Weekly kill rate is 4.68% (Target: 8% - 15%). Lever: raise KILL_WINDOW.SCALE. If it collapsed suddenly, check first that rival max HP is not inflating (derivedStats.hp is a stat, not a health percentage).

