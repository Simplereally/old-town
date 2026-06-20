# E41-S05 — Magic weapon icons and models

## Epic

E41 — Item Asset Pipeline and Equipment Visuals

## Dependency chain

- Depends on: E41-S01, E41-S02
- Blocks: E41-S09

## Spec references

- `docs/items/weapons/magic.md` — 6 families × 13 tiers
- `docs/magic-tiers.md` — magic tier ladder (Chalkmarked, Tallowbound, Bellwax, …), bead system
- `docs/items/weapons/00-index.md` — magic family table
- `POC_SPEC.md` §13 (Combat — magic), §16 (Items)

## Objective

Create flat icons and wielded 3D models for all 78 magic weapons (6 families × 13 tiers). Magic weapons use the magic tier palette (Chalkmarked → Starfall) and the bead-cord visual language: wands, staves, rods, foci, primers, codices. The OSRS read: a staff icon is always a staff, a wand icon is always a small wand, and the tier changes the script/wax/ink material.

## Magic weapon families (6)

| Family | Silhouette read | Hands | Role |
|--------|----------------|-------|------|
| Wand | Short stick + tip bead | 1H | Fast casting |
| Staff | Tall staff + crown bead | 2H | Bead savings |
| Rod | Battle staff + blade cap | 2H | Melee + magic hybrid |
| Focus | Off-hand lens/disc | 1H (off) | Accuracy boost |
| Primer | Small spellbook | 1H | Basic spellbook |
| Codex | Larger tome | 1H | Advanced spellbook |

## Required architectural decisions

- **Magic tier palette** (Chalkmarked, Tallowbound, Bellwax, Blacksalt, Warden Script, Greenwold, Gravebound, Blueglass, Carmine Ink, Argent Script, Crownvellum, Starfall) drives `script`/`wax`/`ink`/`cloth`/`bead` regions.
- **Silhouette regions:** Wand/Staff/Rod use `shaft`, `tip`, `bead`, `accent`. Focus uses `lens`, `rim`, `accent`. Primer/Codex use `cover`, `page`, `seal`, `accent`.
- **Beads are visible:** the tip bead on wands/staves is colored to read as a drilled spell-token (per `docs/magic-tiers.md` bead philosophy). This is the magic equivalent of a bowstring — it tells other players "that is a magic weapon".
- **Procedural geometry per family:** wand = thin cylinder + bead sphere; staff = tall cylinder + crown; rod = staff + small blade cap; focus = disc/lens; primer/codex = small box book.
- **Off-hand focus:** Focus attaches to the left hand (off-hand), leaving the main hand for a wand — the OSRS wand + orb combo read.
- **Primers/Codices** are held in one hand and render as a small book; they are not melee weapons (melee stats are terrible, per design rule 8).
- **Staves provide unlimited elemental beads** — this is a gameplay fact from E02/E11; visually the staff bead glows faintly with the toon gradient, no custom shader.

## Implementation checklist

- [X] Create 6 family SVG silhouettes under `assets/items/silhouettes/magic/`.
- [X] Register all 78 magic weapon icons in `assets/items/manifest.json`.
- [X] Create 6 procedural geometry factories under `apps/client/src/game/scene/models/magic/`.
- [X] Register factories + 13 magic tier materials with `RenderResourceRegistry`.
- [X] Implement wand (1H main), staff/rod (2H), focus (1H off), primer/codex (1H) attachments.
- [X] Run `bun run items:build-assets` to rasterize + pack magic icons.
- [X] Update `content/items/magic-weapons.json` so every magic weapon's `icon`/`model` resolve.
- [X] Write test: every magic weapon item ID has resolvable `icon` + `model`.
- [X] Write test: magic silhouettes have required regions (`shaft`/`tip`/`bead` or `cover`/`page`/`seal`).
- [X] Write test: each magic geometry factory returns finite-bounds geometry.

## Acceptance criteria

- [X] All 78 magic weapons have flat icons in inventory/bank/equipment.
- [X] All 78 have wielded 3D models with correct hand assignment (wand 1H, staff 2H, focus off-hand, book 1H).
- [X] Bead tips are visible on wands/staves/rods.
- [X] Tier is readable (Chalkmarked = white chalk + slate beads, Bellwax = golden wax, Starfall = meteor-stone beads).
- [X] Every magic `icon`/`model` resolves.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run items:build-assets`
- [X] `bun run items:validate-assets`
- [X] `bun run content:validate`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E41/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
