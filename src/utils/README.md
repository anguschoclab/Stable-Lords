# Shared Utilities (`src/utils/`)

This directory contains general-purpose utilities shared across the codebase.
All modules are framework-agnostic and have no React or game-logic dependencies
(except `roster.ts` and `warriorCollection.ts`, which depend on game types).

## Modules

### `math.ts`
Math helpers for clamping, interpolation, and rounding.

| Export | Signature | Purpose |
|--------|-----------|---------|
| `clamp` | `(value, min, max) => number` | Constrain a value to `[min, max]` |
| `clamp01` | `(value) => number` | Constrain a value to `[0, 1]` |
| `lerp` | `(a, b, t) => number` | Linear interpolation between `a` and `b` |
| `mapRange` | `(value, inMin, inMax, outMin, outMax) => number` | Map a value from one range to another |
| `roundTo` | `(value, decimals) => number` | Round to N decimal places |
| `addCapped` | `(base, addition, max) => number` | Add to a base value, capped at max |

### `random.ts`
Seeded RNG implementation and helpers.

| Export | Signature | Purpose |
|--------|-----------|---------|
| `SeededRNG` / `SeededRNGService` | `class implements IRNGService` | Deterministic RNG with seed |
| `randomPick` | `(arr, rng) => T` | Pick a random element from an array |
| `stringToSeed` | `(str) => number` | Convert a string to a numeric seed |
| `hashStr` | `(s) => number` | Hash a string to a number |
| `shuffled` | `(arr, rng) => T[]` | Return a shuffled copy of an array |

### `cryptoRandom.ts`
Cryptographic random number generation (non-deterministic).

| Export | Signature | Purpose |
|--------|-----------|---------|
| `cryptoRandom` | `() => number` | Cryptographic random float in `[0, 1)` |
| `cryptoRandomInt` | `(min, max) => number` | Cryptographic random integer in `[min, max]` |

### `format.ts`
Game-specific string formatting helpers.

| Export | Signature | Purpose |
|--------|-----------|---------|
| `formatWeek` | `(week, season) => string` | Format week/season as display string |
| `formatDateOfDeath` | `(week, season) => string` | Format date of death for warrior records |

### `dateUtils.ts`
General date formatting.

| Export | Signature | Purpose |
|--------|-----------|---------|
| `formatDate` | `(iso) => string` | Format an ISO date string for display |

### `idUtils.ts`
ID generation with optional mock override for testing.

| Export | Signature | Purpose |
|--------|-----------|---------|
| `generateId` | `(rng?, prefix?) => string` | Generate a unique ID with optional prefix |
| `setMockIdGenerator` | `(generator) => void` | Override ID generation for tests |

### `keyUtils.ts`
Key generation for pair lookups.

| Export | Signature | Purpose |
|--------|-----------|---------|
| `getPairKey` / `getStablePairKey` / `getWarriorPairKey` | `(id1, id2) => string` | Generate a deterministic key for an unordered pair |

### `logger.ts`
Logging utility with leveled output.

| Export | Signature | Purpose |
|--------|-----------|---------|
| `logger` | `object` | Logger with `info`, `warn`, `error` methods |

### `nameLogic.ts`
Name generation logic.

| Export | Signature | Purpose |
|--------|-----------|---------|
| `generateDynasticName` | `(originalName, seed) => string` | Generate a dynastic successor name |

### `roster.ts`
Player roster manipulation utilities (game-type aware).

| Export | Signature | Purpose |
|--------|-----------|---------|
| `buildActiveWarriorMap` | `(state) => Map<string, Warrior>` | Build a lookup map of active warriors |
| `updateRoster` | `(roster, updates) => Warrior[]` | Apply partial updates to roster warriors |
| `removeFromRoster` | `(roster, ids) => Warrior[]` | Remove warriors by ID |
| `filterActive` | `(roster) => Warrior[]` | Filter to active warriors only |
| `filterByStatus` | `(roster, status) => Warrior[]` | Filter by specific status |
| `filterHealthy` | `(roster) => Warrior[]` | Filter to active, uninjured warriors |

### `warriorCollection.ts`
Re-export barrel for warrior collection utilities.

| Export | Source | Purpose |
|--------|--------|---------|
| `collectAllKnownWarriors` | `@/engine/core/warriorCollection` | Collect all warriors (roster + graveyard + retired + rivals) |
| `buildWarriorMap` | `@/engine/core/warriorCollection` | Build a comprehensive warrior lookup map |

### `stateUtils.ts`
State manipulation helpers for Redux-like state updates.

| Export | Signature | Purpose |
|--------|-----------|---------|
| `updateEntityInList` | `(list, id, updates) => T[]` | Update an entity in a list by ID |
| `truncateArray` | `(list, limit) => T[]` | Truncate an array to a maximum length |

### `storage.ts`
localStorage error handling.

| Export | Signature | Purpose |
|--------|-----------|---------|
| `handleLocalStorageQuotaError` | `(operation, data) => void` | Handle QuotaExceededError with logging |

### `escapeHtml.ts`
HTML escaping utility.

| Export | Signature | Purpose |
|--------|-----------|---------|
| `escapeHtml` | `(str) => string` | Escape HTML special characters in a string |

## Usage Guidelines

- Import via the `@/utils/` alias: `import { clamp } from '@/utils/math'`
- Prefer `clamp()` over inline `Math.max(min, Math.min(max, val))` patterns
- Prefer `filterActive()` over inline `roster.filter(w => w.status === 'Active')`
- Use `SeededRNGService` for deterministic game logic; `cryptoRandom` for non-deterministic cases
