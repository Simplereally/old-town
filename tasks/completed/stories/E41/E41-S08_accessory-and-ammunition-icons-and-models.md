# E41-S08 — Accessory and ammunition icons and models

## Epic

E41 — Item Asset Pipeline and Equipment Visuals

## Dependency chain

- Depends on: E41-S01, E41-S02
- Blocks: E41-S09

## Spec references

- `docs/items/accessories/00-index.md` — 6 accessory slots × 13 bands
- `docs/items/accessories/capes.md`, `amulets.md`, `rings.md`, `charms.md`, `belts.md`, `trophies.md`
- `docs/items/misc/ammunition.md` — 9 ammo types × 13 tiers
- `docs/ranged-tiers.md` — ammo naming (Arrows, Bolts, Quarrels, Bodkins, Barbs, Broadheads, Starheads…)
- `POC_SPEC.md` §16 (Items, equipment, ammo)

## Objective

Create flat icons and (where visible) worn/billboard 3D models for all accessories (6 slots × 13 tiers = 78) and ammunition (9 types × 13 tiers = 117). Accessories are the build-glue keepsakes (capes, amulets, rings, charms, belts, trophies). Ammunition is stackable ammo consumed by ranged weapons. The OSRS read: a cape icon is always a cape, an arrow icon is always a fletched arrow, and the tier/band changes the trim and material.

## Accessory slots (6) — accessory band palette

| Slot | Base name | Silhouette read | Worn? |
|------|-----------|----------------|-------|
| Cape | Cape | Back-cloth | Yes (back) |
| Amulet | Amulet | Neck chain + pendant | Yes (neck) |
| Ring | Ring | Finger band | No (too small) |
| Charm | Charm | Pocket token | No (pocket) |
| Belt | Belt | Waist strap + pouches | Yes (waist) |
| Trophy | Trophy | Badge/medallion | Yes (chest badge) |

## Ammunition types (9) — follows head material

| Ammo | Silhouette read | Stackable |
|------|----------------|-----------|
| Arrows | Fletched arrow | Yes |
| War Arrows | Heavier fletched arrow | Yes |
| True Arrows | Fine fletched arrow | Yes |
| Bolts | Crossbow bolt | Yes |
| Quarrels | Heavy bolt | Yes |
| Barbs | Barbed arrow | Yes |
| Bodkins | Armour-piercing arrow | Yes |
| Broadheads | Broad-head arrow | Yes |
| Starheads | Meteor-metal arrow | Yes |

## Required architectural decisions

- **Accessory band palette** (Cobbled, Threadbare, Waxed, Bellstruck, Blacksealed, Warden-Issued, Greenwold, Gravebound, Blueglass, Carmine, Argent, Crown, Starfall) drives `cloth`/`metal`/`seal`/`accent` regions. Accessories use their own 13-band ladder per `docs/items/accessories/00-index.md`.
- **Visible accessories (Cape, Amulet, Belt, Trophy)** get worn 3D models: cape on the back, amulet at the neck, belt at the waist, trophy as a chest badge. Ring and Charm are too small to read in-world and are icon-only (no worn mesh) — exactly like OSRS rings.
- **Ammunition is icon + billboard only.** Ammo has no wielded model (it is consumed from the ammo slot); in flight it renders as a small projectile billboard (E41-S09). The icon is the primary identity.
- **Ammo tier naming follows the head material** per `docs/ranged-tiers.md`: bow-tier arrows use ranged palette (Lathwood Arrows, Bellhorn Barbs), metal-head ammo uses melee metal palette (Pennywrought Bolts, Wardensteel Bodkins, Starfall Starheads).
- **Stackable ammo icons** show a small bundle (2–3 arrows/bolts) rather than a single projectile, so the stack reads as ammunition at a glance — OSRS convention.
- **Cape reads from behind** — the back-cloth is the most visible accessory in-world, so the cape silhouette and tier trim must be readable from the camera's usual behind-the-player view.

## Implementation checklist

- [X] Create 6 accessory + 9 ammo SVG silhouettes under `assets/items/silhouettes/accessory/` and `ammo/`.
- [X] Register all 78 accessory + 117 ammo icons in `assets/items/manifest.json`.
- [X] Create procedural geometry factories for the 4 visible accessories (cape, amulet, belt, trophy) under `apps/client/src/game/scene/models/accessory/`.
- [X] Register accessory factories + 13 accessory-band materials with `RenderResourceRegistry`.
- [X] Implement cape (back), amulet (neck), belt (waist), trophy (chest) attachments in `ActorRenderer`.
- [X] Run `bun run items:build-assets` to rasterize + pack accessory + ammo icons.
- [X] Update `content/items/starter-misc.json` (and any ammo/accessory JSON) so every item's `icon`/`model` resolve.
- [X] Write test: every accessory + ammo item ID has a resolvable `icon`.
- [X] Write test: visible accessories have a resolvable `model`; rings/charms do not require a worn model.
- [X] Write test: ammo icons use the correct palette set (bow-tier vs metal-head) per `docs/ranged-tiers.md`.

## Acceptance criteria

- [X] All 78 accessories + 117 ammo have flat icons in inventory/bank/equipment.
- [X] Cape, amulet, belt, and trophy have worn 3D models; ring and charm are icon-only.
- [X] Cape is readable from behind (tier trim visible).
- [X] Ammo icons read as bundles, not single projectiles.
- [X] Every accessory + ammo `icon` resolves; visible-accessory `model` resolves.
- [X] Accessory bands and ammo tier palettes match the docs.

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
