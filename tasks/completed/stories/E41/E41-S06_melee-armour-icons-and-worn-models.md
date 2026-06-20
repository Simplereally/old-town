# E41-S06 — Melee armour icons and worn models

## Epic

E41 — Item Asset Pipeline and Equipment Visuals

## Dependency chain

- Depends on: E41-S01, E41-S02
- Blocks: E41-S09

## Spec references

- `docs/items/armour/00-index.md` — melee armour slots, "Full Penny" set, set bonuses
- `docs/items/armour/head.md`, `chest.md`, `legs.md`, `feet.md`, `hands.md`, `shield.md` — slot details
- `docs/melee-armour-tiers.md` — melee tier philosophy
- `POC_SPEC.md` §16 (Items, equipment)

## Objective

Create flat icons and worn 3D models for all 117 melee armour pieces (9 slots × 13 tiers). Melee armour is metal/martial: helms, greathelms, harnesses, hauberks, platecoats, chausses, sabatons, gauntlets, wards. The OSRS read: a full set of one tier reads as one cultural identity ("full Penny", "full Warden", "full Starfall"), and each slot has a distinct silhouette so a mixed set still composes.

## Melee armour slots (9)

| Slot | Base name | Silhouette read | Notes |
|------|-----------|----------------|-------|
| Head (light) | Helm | Open-faced helm | — |
| Head (heavy) | Greathelm | Full-face enclosed helm | Magic penalty |
| Chest (plate) | Harness | Breastplate | Light chest |
| Chest (chain) | Hauberk | Chain mail torso | Hybrid |
| Chest (heavy) | Platecoat | Full plate torso | Run penalty |
| Legs | Chausses | Leg armour | — |
| Feet | Sabatons | Armoured boots | Run boost |
| Hands | Gauntlets | Armoured gloves | Attack boost |
| Shield | Ward | Shield | Off-hand |

## Required architectural decisions

- **One SVG silhouette per slot base name** (Helm, Greathelm, Harness, Hauberk, Platecoat, Chausses, Sabatons, Gauntlets, Ward) under `assets/items/silhouettes/armour-melee/`. Regions: `metal`, `trim`, `accent`, `straps`.
- **Melee tier palette** (Cobbled → Starfall) drives the metal color. Cobbled = rust/wood/straps (joke). Bellmetal = warm gold. Wardensteel = steel + blue/white trim. Starfall = dark steel + pale meteor flecks.
- **Chest has three silhouettes** (Harness/Hauberk/Platecoat) so the chest tradeoff matrix from `armour/00-index.md` is visible: Harness = light plate, Hauberk = chain, Platecoat = heavy full plate.
- **Worn 3D models attach to the humanoid body parts:** Helm/Greathelm → head, Harness/Hauberk/Platecoat → torso, Chausses → legs, Sabatons → feet, Gauntlets → hands, Ward → left hand (off-hand). The existing `ActorRenderer` humanoid pool exposes these attachment proxies.
- **Mixed-set composition:** a Wardensteel Helm + Bellmetal Harness must render both correctly. Each slot is an independent mesh; the appearance system (E28-S01) already supports per-slot overrides — this story supplies the geometry.
- **Greathelm encloses the face** (visual only; the magic penalty is server-side). Platecoat is visibly bulkier than Harness.
- **Ward (shield) attaches to the left hand** and reads as a shield silhouette, distinct from the Buckler (ranged, E41-S07) and Charmward (magic, E41-S07).

## Implementation checklist

- [X] Create 9 slot SVG silhouettes under `assets/items/silhouettes/armour-melee/`.
- [X] Register all 117 melee armour icons in `assets/items/manifest.json`.
- [X] Create 9 procedural geometry factories under `apps/client/src/game/scene/models/armour-melee/`.
- [X] Register factories + 13 melee tier materials with `RenderResourceRegistry`.
- [X] Implement slot → body-part attachment for all 9 slots in `ActorRenderer`.
- [X] Run `bun run items:build-assets` to rasterize + pack melee armour icons.
- [X] Update `content/items/armour.json` so every melee armour item's `icon`/`model` resolve.
- [X] Write test: every melee armour item ID has resolvable `icon` + `model`.
- [X] Write test: chest items map to the correct silhouette (Harness/Hauberk/Platecoat) by family.
- [X] Write test: each armour geometry factory returns finite-bounds geometry.

## Acceptance criteria

- [X] All 117 melee armour pieces have flat icons in inventory/bank/equipment.
- [X] All 117 have worn 3D models on the correct body slot.
- [X] A full same-tier set reads as one cultural identity (Full Penny, Full Warden, Full Starfall).
- [X] Mixed-tier sets compose without visual conflict.
- [X] Greathelm encloses the face; Platecoat is visibly heavier than Harness.
- [X] Ward reads as a shield in the left hand.
- [X] Every melee armour `icon`/`model` resolves.

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
