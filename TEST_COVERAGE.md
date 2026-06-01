# Test Coverage Notes

## Indirectly-Tested Engine Modules

The following core engine files have **no dedicated unit tests** but are exercised through integration tests:

### Combat Resolution (`src/engine/combat/`)
| File | Covered By |
|------|-----------|
| `combat/mechanics/combatDamage.ts` | `src/test/combat.test.ts` (21 tests) |
| `combat/mechanics/tacticResolution.ts` | `src/test/combat.test.ts` |
| `combat/mechanics/conditionEngine.ts` | `src/test/combat.test.ts` |
| `combat/mechanics/weatherEffects.ts` | `src/test/combat.test.ts` |
| `combat/mechanics/distanceResolution.ts` | `src/test/combat.test.ts` |
| `combat/resolution/exchangeHelpers.ts` | `src/test/combat.test.ts` |
| `combat/resolution/psychState.ts` | `src/test/combat.test.ts` |
| `combat/narrative/narrator.ts` | `src/test/simulate.test.ts` (40 tests) |

### Bout Processing (`src/engine/bout/`)
| File | Covered By |
|------|-----------|
| `bout/fighterState.ts` | `src/test/combat.test.ts` |
| `bout/injuryHandler.ts` | `src/test/combat.test.ts` |
| `bout/mortalityHandler.ts` | `src/test/combat.test.ts` |
| `bout/progressionHandler.ts` | `src/test/combat.test.ts` |
| `bout/decisionLogic.ts` | `src/test/simulate.test.ts` |
| `bout/warriorStateUpdater.ts` | `src/test/simulate.test.ts` |
| `bout/recordHandler.ts` | `src/test/simulate.test.ts` |
| `bout/services/boutProcessorService.ts` | `src/test/simulate.test.ts` |

### Long-Running Balance
| File | Covered By |
|------|-----------|
| All combat/bout modules above | `src/scripts/simulation.test.ts` (104-week harness) |

## Recommendation

If a bug surfaces in any of these modules, prefer adding a **targeted unit test** for the specific function before fixing it, rather than relying solely on the integration tests. This improves debuggability and prevents regressions.
