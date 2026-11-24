<!-- markdownlint-disable MD013 -->

# MEGAPLAN V32 — DEFERRED

_Open deferred register — items are folded into `MEGAPLAN_BACKLOG.md` at
close-out._

| ID | Item | Reason deferred |
|---|---|---|
| V32-D1 | The ~600-image Gemini art run — key exists in `.env` but the project is **free-tier with image quota `limit: 0`** (verified: 429 on `gemini-2.5-flash-image` + `gemini-3-pro-image-preview`; `imagen-4.0-generate-001` 404s on v1beta). Unblocked by enabling billing on the GCP project or supplying a paid-tier key; then `bun run avatar:generate && bun run avatar:ingest && bun run avatar:sheet`. | External billing gate |
| V32-D2 | Legacy placeholder layer-sprites + layered generation path removal — kept as bootstrap fallback until pool coverage is proven. | Coverage safeguard |
| V32-D3 | Whole-portrait stable-color tinting — replaced by crest-color frame ring; painterly hue-rotate looked wrong by design. | Design choice, revisit only if frame reads weak |
