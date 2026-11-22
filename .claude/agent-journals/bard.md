# Bard's Journal

## 2026-02-14 - Gazette tokens are per-call-site, not per-category

**Discovery:** `gazette.json` headline and featured pools share category names
(`Kill`, `Rivalry`, `LegacyRivalry`, `Upset`, …) but each `t()` call site in
`src/engine/gazette/gazetteNarrative.ts` supplies a **different** token set.
`featured` rivalry gets `suffix` ('rd'/'th'); the `headlines.LegacyRivalry`
site does not — one template's `{{count}}{{suffix}}` rendered literally to
players. `headlines.Kill` supplies `{week, killer, loser}` — three templates
used `{{winner}}`, which is only valid in `fights.*` and
`headlines.Upset`/`major_upset`. `t()` (`gazetteTemplateHelpers.ts:67`)
silently returns unmatched `{{tokens}}` verbatim, and `narrative_validate`
does not check token-vs-context — so these leaks pass every gate.

**Rule:** Before reusing a `{{token}}` in any gazette pool, grep the exact
`t(rngService.pick(gh.X), { … })` data object for THAT pool in
`generateGazetteHeadline` / `featuredParagraphs` / `graveyardParagraphs`.
Sibling categories with the same name do NOT share the contract.

**Check:** `python3` one-liner — extract `{{token}}` sets per array in
`gazette.json` and diff against the keys each call site passes to `t()`.
Audit script used this run found exactly 4 leaks (1 `{{suffix}}`, 3
`{{winner}}`); post-fix diff = 0.

## 2026-02-14 - Dead pools in recruitment.json

**Discovery:** `recruitment.json`'s `style_blurbs` map has **no consumer**
(only the `Recruitment` type declares it) and `origin` is read only at
`origin[0]` as a static seeded fallback in `gameStateFactory.ts:214` — the
live recruit path uses `generateOrigin()` → `lore/origins.ts`'s ORIGINS pool
(280+ entries). Expanding either JSON pool adds content players never see.

**Rule:** A thin pool is only an expansion target if a production call site
draws from it — grep the key path (`x.y.z`) across `src/engine` and
`src/pages` before composing.

**Check:** `grep -rn "style_blurbs\|recruitment\.origin" src/` — hits only
`gameStateFactory.ts` (`origin[0]`), the type file, and test fixtures.
