# Plan 7 — List virtualization

## Dependency
`@tanstack/react-virtual` is **not** installed (no react-window either). Add it
(`bun add @tanstack/react-virtual`, v3, React 18-compatible).

## Inventory (max sizes from `engine/storage/truncation.ts` caps)
| List | File | Max | Verdict |
|---|---|---|---|
| World cemetery | `Graveyard.tsx` `FallenGrid` | 200 | **Virtualize P1** |
| Hall of Fame fallen | `HallOfFame/components/FallenGrid.tsx` | 200 | **Virtualize P1** |
| Warrior leaderboard | `world/WarriorLeaderboard.tsx` | rendered `.slice(0,100)` | **Virtualize P2** |
| Stable rankings | `world/StableRankings.tsx` | ~51 | Defer/optional |
| Rival stable list | `scouting/RivalStableList.tsx` | ~50 (Radix Tooltip each) | Defer |
| Rival warrior list | `scouting/RivalWarriorList.tsx` | ~5-10 | Don't |
| Roster wall | `stable/RosterWall.tsx` | ~10 | Don't — fix animation |
| Recruit pool | `Recruit/index.tsx` | ≤36 | Don't |

The `Scouting.tsx:42` `.map` builds a lookup Map (not DOM) — leave it.

## P1 grids — window virtualizer (preserve page scroll)
Use `useWindowVirtualizer` over **rows** (chunk items by a `useColumns()` breakpoint hook 1/2/3),
`scrollMargin = parentRef.offsetTop`, absolute-positioned row tracks with `translateY`,
**dynamic** `measureElement` (cards vary in height). One pattern covers both grids.

## P2 leaderboard — table virtualizer
Wrap body in `max-h-[70vh] overflow-auto`, sticky `<thead>`, `useVirtualizer` with
`getScrollElement`, **fixed** `estimateSize` (~48px, uniform rows), spacer-row technique
(leading/trailing `<tr>` with padding height) to keep table semantics. Guard init for
`TabsContent` zero-height-on-mount.

## RosterWall + AnimatePresence conflict
`AnimatePresence mode="popLayout"` + per-item `delay: i*0.05` (`RosterWall.tsx:89-104`;
same in Graveyard `:119-125` and HoF FallenGrid `:38-44`). **Virtualization and popLayout fight**
(virtualizer unmounts off-screen rows; popLayout keeps/measures all). For virtualized grids:
**remove per-item motion** (absolute index makes `delay: idx*0.05` meaningless). For RosterWall
(≤10): keep but **cap** stagger `delay: Math.min(i,8)*0.05`, drop `popLayout`. Optional CSS fade
(`tailwindcss-animate`, already a dep) on the container.

## Verification
Seed ~200 graveyard / 100 leaderboard (AdminTools); DOM node count stays bounded while scrolling
(Playwright `locator.count()` under threshold across scroll); no gaps/overlap; sticky header;
remeasure on breakpoint resize; Profiler commit time drops.

## Risks
Scroll-container height (prefer window virtualizer for grids; explicit `max-h` for tables);
dynamic measurement jump (tune `estimateSize`); column recompute on resize; a11y (keep table
semantics, `aria-rowcount`, find-in-page caveat); animation conflict (above); Radix Tooltip
recycle on scroll (reason to defer P3); Tabs remount.

## Critical files
`package.json`; `src/pages/Graveyard.tsx`; `src/pages/HallOfFame/components/FallenGrid.tsx`;
`src/components/world/WarriorLeaderboard.tsx`; `src/components/stable/RosterWall.tsx`.
