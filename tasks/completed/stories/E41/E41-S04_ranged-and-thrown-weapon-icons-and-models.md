# E41-S04 — Ranged and thrown weapon icons and models

## Epic

E41 — Item Asset Pipeline and Equipment Visuals

## Dependency chain

- Depends on: E41-S01, E41-S02
- Blocks: E41-S09

## Spec references

- `docs/items/weapons/ranged.md` — 8 bows + 6 crossbows × 13 tiers
- `docs/items/weapons/knives.md`, `darts.md`, `javelins.md`, `throwing-axes.md` — 4 thrown families × 13 tiers
- `docs/ranged-tiers.md` — ranged tier ladder (Lathwood, Bogwood, Bellhorn, …), canonical tier sets
- `docs/items/weapons/00-index.md` — ranged/thrown family table
- `POC_SPEC.md` §13 (Combat — ranged attack, ammo)

## Objective

Create flat icons and wielded 3D models for all 234 ranged/thrown weapons: 8 bow families + 6 crossbow families + 4 thrown families, each across 13 tiers. Bows use organic tier language (Lathwood → Starbow); crossbows use metal tier language (Pennywrought → Starfall); thrown weapons follow their family's tier naming. The OSRS read: a bow icon is always a bow silhouette, a crossbow icon is always a crossbow silhouette, and the tier changes the wood/metal color.

## Ranged weapon families (18)

### Bows (8) — organic tier palettes
| Family | Silhouette read | Hands |
|--------|----------------|-------|
| Bentbow | Crude bent stick + twine string | 2H |
| Shortbow | Short recurve-less bow | 2H |
| Longbow | Tall longbow | 2H |
| Recurve | Recurved limbs, tips curl forward | 2H |
| Warbow | Heavy thick-limbed bow | 2H |
| Quickbow | Short light bow | 2H |
| Stillbow | Slim precision longbow | 2H |
| Starbow | Mythic bow, celestial stave | 2H |

### Crossbows (6) — metal tier palettes
| Family | Silhouette read | Hands |
|--------|----------------|-------|
| Latchbow | Light crossbow, simple tiller + latch | 2H |
| Crossbow | Standard crossbow, prod + stock | 2H |
| Arbalest | Heavy crossbow, steel prod | 2H |
| Crankbow | Repeating crossbow, crank + magazine | 2H |
| Handbow | Compact one-handed crossbow | 1H |
| Greatbow | Siege crossbow, massive prod | 2H |

### Thrown (4) — family-tier naming
| Family | Silhouette read | Hands | Range |
|--------|----------------|-------|-------|
| Knife | Thrown knife, leaf blade | 1H | 4 |
| Dart | Thrown dart, slim spike + fletch | 1H | 5 |
| Javelin | Heavy throwing spear | 1H | 6 |
| Throwing Axe | Hatchet with throwing grip | 1H | 5 |

## Required architectural decisions

- **Bow silhouettes** use regions `limb`, `string`, `grip`, `accent`. Crossbow silhouettes use `prod`, `stock`, `mechanism`, `accent`. Thrown silhouettes use `blade`/`head`, `shaft`, `fletch`, `grip`.
- **Two palette sets:** bows + thrown knives/darts use the **ranged** tier palette (Lathwood, Bogwood, Bellhorn, Warden Yew, …). Crossbows + thrown javelins/throwing axes use the **melee metal** tier palette (Pennywrought, Pig Iron, Bellmetal, …) per `docs/ranged-tiers.md` design rules 1–2.
- **Procedural geometry per family:** bows are a thin torus-arc limb + string line; crossbows are a prod + stock box + crank; thrown are small blade + shaft. All low-poly, sized to the hand.
- **Wielded attachment:** bows/crossbows attach to both hands (2H draw stance); Handbow attaches to one hand (1H, allows Buckler). Thrown weapons equip in the weapon slot and render a single blade/shaft in-hand; the thrown projectile in flight uses the same model as a small billboard (E41-S09).
- **String tension read:** the bow string is visible in-world so other players can read "that player is holding a bow, not a staff".
- **Ammo is separate** (E41-S08 covers arrows/bolts). This story is the launchers only.

## Implementation checklist

- [X] Create 18 family SVG silhouettes under `assets/items/silhouettes/ranged/` (8 bow, 6 crossbow, 4 thrown).
- [X] Register all 234 ranged/thrown icons in `assets/items/manifest.json`.
- [X] Create 18 procedural geometry factories under `apps/client/src/game/scene/models/ranged/`.
- [X] Register factories + tier materials (ranged palette for bows/knives/darts; melee metal palette for crossbows/javelins/throwing axes) with `RenderResourceRegistry`.
- [X] Implement 2H draw stance for bows/crossbows and 1H stance for Handbow + thrown.
- [X] Run `bun run items:build-assets` to rasterize + pack ranged icons.
- [X] Update `content/items/weapons.json` (and any ranged-specific JSON) so every ranged/thrown item's `icon`/`model` resolve.
- [X] Write test: every ranged/thrown item ID has resolvable `icon` + `model`.
- [X] Write test: bow silhouettes have `limb`/`string`/`grip` regions; crossbows have `prod`/`stock`/`mechanism`.
- [X] Write test: each ranged geometry factory returns finite-bounds geometry.

## Acceptance criteria

- [X] All 234 ranged/thrown weapons have flat icons in inventory/bank/equipment.
- [X] All 234 have wielded 3D models with correct 1H/2H stance.
- [X] Bows read as bows, crossbows as crossbows, thrown as thrown — at a glance.
- [X] Bow string is visible in-world.
- [X] Tier is readable (Lathwood = pale cheap wood, Bellhorn = warm horn, Starfall = celestial).
- [X] Every ranged/thrown `icon`/`model` resolves.

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
