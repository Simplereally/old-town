# E41-S07 — Ranged and magic armour icons and worn models

## Epic

E41 — Item Asset Pipeline and Equipment Visuals

## Dependency chain

- Depends on: E41-S01, E41-S02
- Blocks: E41-S09

## Spec references

- `docs/items/armour/00-index.md` — magic + ranged armour slots, "Full Chalk" / "Full Patch" sets
- `docs/items/armour/cowl.md`, `robe.md`, `wraps.md`, `softshoes.md`, `cuffs.md`, `charmward.md` — magic slots
- `docs/items/armour/coif.md`, `jerkin.md`, `chaps.md`, `vambraces.md`, `treads.md`, `buckler.md` — ranged slots
- `docs/ranged-armour-tiers.md` — ranged armour tier ladder (Patchhide → Starfall Hide)
- `docs/magic-tiers.md` — magic tier ladder (Chalkmarked → Starfall)
- `POC_SPEC.md` §16 (Items, equipment)

## Objective

Create flat icons and worn 3D models for all 156 ranged + magic armour pieces (6 ranged slots × 13 + 6 magic slots × 13). Ranged armour is hide/cloth/fieldcraft (Patchhide → Starfall Hide). Magic armour is script/bead/cloth (Chalkmarked → Starfall). The OSRS read: a full ranged set reads as a hunter, a full magic set reads as a caster — distinct from metal melee armour.

## Ranged armour slots (6) — ranged-armour palette

| Slot | Base name | Silhouette read |
|------|-----------|----------------|
| Head | Coif | Cloth/leather hood |
| Chest | Jerkin | Light leather torso |
| Legs | Chaps | Leg coverings |
| Hands | Vambraces | Arm guards |
| Feet | Treads | Soft boots |
| Off-hand | Buckler | Small shield |

## Magic armour slots (6) — magic palette

| Slot | Base name | Silhouette read |
|------|-----------|----------------|
| Head | Cowl | Cloth hood |
| Chest | Robe | Cloth torso |
| Legs | Wraps | Cloth legs |
| Hands | Cuffs | Cloth gloves |
| Feet | Softshoes | Cloth boots |
| Off-hand | Charmward | Defensive charm-board |

## Required architectural decisions

- **Ranged armour silhouettes** use regions `hide`, `stitch`, `buckle`, `accent` and the **ranged-armour tier palette** (Patchhide, Boghide, Bellhide, Blackscale, Wardenhide, Greenwold, Graveskin, Blueglass Scale, Carmine Hide, Argentweave, Crownhide, Starfall Hide). Cobbled = torn cloth + rope straps.
- **Magic armour silhouettes** use regions `cloth`, `script`, `seal`, `accent` and the **magic tier palette** (Chalkmarked, Tallowbound, Bellwax, Blacksalt, Warden Script, Greenwold, Gravebound, Blueglass, Carmine Ink, Argent Script, Crownvellum, Starfall). Cobbled = mismatched rags + cracked beads.
- **Worn attachments:** Coif/Cowl → head, Jerkin/Robe → torso, Chaps/Wraps → legs, Vambraces/Cuffs → hands, Treads/Softshoes → feet, Buckler/Charmward → left hand.
- **Buckler vs Ward vs Charmward** are visually distinct: Buckler = small round leather shield, Ward = larger metal shield (E41-S06), Charmward = a warding charm-board/focus (not a shield).
- **Magic robes read as cloth, not metal** — the robe silhouette is flowing, the cowl is a hood. This is the instant caster read.
- **Ranged armour reads as fieldcraft** — coif + jerkin + chaps read as a hunter/ranger, distinct from both metal and robes.

## Implementation checklist

- [X] Create 6 ranged + 6 magic slot SVG silhouettes under `assets/items/silhouettes/armour-ranged/` and `armour-magic/`.
- [X] Register all 156 ranged+magic armour icons in `assets/items/manifest.json`.
- [X] Create 12 procedural geometry factories under `apps/client/src/game/scene/models/armour-ranged/` and `armour-magic/`.
- [X] Register factories + ranged-armour and magic tier materials with `RenderResourceRegistry`.
- [X] Implement slot → body-part attachments for all 12 slots.
- [X] Run `bun run items:build-assets` to rasterize + pack ranged+magic armour icons.
- [X] Update `content/items/magic-armour.json` and ranged armour JSON so every item's `icon`/`model` resolve.
- [X] Write test: every ranged+magic armour item ID has resolvable `icon` + `model`.
- [X] Write test: ranged silhouettes have `hide`/`stitch`/`buckle` regions; magic silhouettes have `cloth`/`script`/`seal`.
- [X] Write test: each armour geometry factory returns finite-bounds geometry.

## Acceptance criteria

- [X] All 156 ranged+magic armour pieces have flat icons in inventory/bank/equipment.
- [X] All 156 have worn 3D models on the correct body slot.
- [X] Full Patch reads as a ranger; Full Chalk reads as a caster; both distinct from metal melee.
- [X] Buckler, Ward, and Charmward are visually distinct off-hand pieces.
- [X] Every ranged+magic armour `icon`/`model` resolves.

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
