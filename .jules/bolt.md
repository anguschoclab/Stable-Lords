## 2024-05-19 - Expensive Set allocation in map loop
**Learning:** In `RivalsListWidget.tsx`, creating `new Set((state.roster || []).map(w => w.name))` inside `recentRivalBouts.map` creates an expensive object repeatedly inside a render loop when it could just be reused from the `recentRivalBouts` useMemo or memoized on its own.
**Action:** Move expensive allocations like `new Set(...)` mapping outside of loop rendering or `useMemo` it so it's not repeatedly executed for each item in the map.
## 2024-05-19 - Expensive Set allocation in map loop
**Learning:** In `RivalsListWidget.tsx`, creating `new Set((state.roster || []).map(w => w.name))` inside `recentRivalBouts.map` creates an expensive object repeatedly inside a render loop when it could just be reused from the `recentRivalBouts` useMemo or memoized on its own.
**Action:** Move expensive allocations like `new Set(...)` mapping outside of loop rendering or `useMemo` it so it's not repeatedly executed for each item in the map.
