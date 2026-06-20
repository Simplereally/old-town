# E41-S03 — Melee weapon icons and wielded models

## Epic

E41 — Item Asset Pipeline and Equipment Visuals

## Dependency chain

- Depends on: E41-S01, E41-S02
- Blocks: E41-S09

## Spec references

- `docs/items/weapons/melee.md` — 12 families × 13 tiers, full stat tables and item IDs
- `docs/items/00-index.md` — tier table (Cobbled → Starfall), visual identity
- `docs/melee-armour-tiers.md` — melee tier philosophy
- `POC_SPEC.md` §13 (Combat — attack speed, range, styles)
- `apps/client/src/game/scene/ActorRenderer.ts` — humanoid pool, equipment attachment points

## Objective

Create the flat icons and low-poly wielded 3D models for all 156 melee weapons (12 families × 13 tiers). Each family owns one SVG silhouette and one procedural `BufferGeometry`; each tier recolors via the melee tier palette. This is the OSRS pattern: a Shortblade icon is always a short sword silhouette, a Fellaxe icon is always a battleaxe silhouette, and the tier (Pennywrought → Starfall) changes the material color and accents.

## Melee weapon families (12)

| Family | Silhouette read | 2H | Reach | Notes |
|--------|----------------|----|-------|-------|
| Sticker | Small dagger, triangular blade | 1H | 1 | Fastest |
| Shortblade | Short sword, straight blade + crossguard | 1H | 1 | Starter |
| Longblade | Long sword, longer blade + crossguard | 1H | 1 | Balanced |
| Greatblade | Two-handed sword, big blade, long grip | 2H | 1 | No shield |
| Sabre | Curved single-edge blade | 1H | 1 | Slash |
| Handaxe | One-handed axe head + short haft | 1H | 1 | Tool hybrid |
| Fellaxe | Two-handed battleaxe, wide double head | 2H | 1 | No shield |
| Cudgel | Mace, round head + short shaft | 1H | 1 | Crush |
| Maul | Warhammer, big hammer head + long haft | 2H | 1 | Slowest |
| Spear | Spear, leaf tip + long shaft | 1H | 2 | Reach |
| Billhook | Halberd, hook + axe blade + long pole | 2H | 2 | Reach |
| Glaive | Heavy polearm, curved blade + long pole | 2H | 2 | Reach |

## Required architectural decisions

- **One SVG silhouette per family** in `assets/items/silhouettes/melee/{family}.svg` with recolorable regions: `blade` (or `head` for blunt/axe), `grip`, `accent`, `trim`. The silhouette encodes the family shape only; tier color comes from the palette.
- **Icon composition:** family silhouette + melee tier palette → 64×64 PNG icon. Item ID → icon AssetId mapping is already `icon_{tier}_{family}` (e.g. `icon_pennywrought_shortblade`). Cobbled tier uses the "joke" palette (rust grey, rough wood, chipped) per design rule 5.
- **One procedural `BufferGeometry` factory per family** in `apps/client/src/game/scene/models/melee/{family}.ts`. Each factory builds a low-poly mesh (blade box, crossguard, grip cylinder, pommel) sized to the humanoid hand. Reach weapons (Spear, Billhook, Glaive) use longer shafts.
- **Tier recolors the material, not the geometry.** One shared material per tier (`materialId: tier`) registered in `RenderResourceRegistry`. Starfall tier adds a subtle emissive fleck via `onBeforeCompile` or a toon gradient map — no custom `ShaderMaterial` (asset-baking contract §12).
- **Wielded attachment:** the weapon mesh attaches to the humanoid right-hand proxy (and left-hand for 2H stances). The existing `ActorRenderer` humanoid pool exposes attachment points; this story registers the melee model factories and the slot→attachment mapping for `weapon`.
- **Two-handed visual:** 2H families (Greatblade, Fellaxe, Maul, Billhook, Glaive) render with both hands on the grip; the shield slot is visually empty. This is presentational only — the server already enforces the 2H block on shields.
- **Reach weapons read longer in-world:** Spear/Billhook/Glaive models are visibly pole-length so other players can read the 2-tile reach advantage at a glance.

## Implementation checklist

- [X] Create 12 family SVG silhouettes under `assets/items/silhouettes/melee/`.
- [X] Register all 156 melee icons in `assets/items/manifest.json` (`icon_{tier}_{family}`).
- [X] Create 12 procedural geometry factories under `apps/client/src/game/scene/models/melee/`.
- [X] Register each factory with `RenderResourceRegistry` keyed by `model_{tier}_{family}`.
- [X] Register 13 shared melee tier materials (one per tier) in the material registry.
- [X] Implement the `weapon` slot → right-hand attachment in `ActorRenderer` (and 2H stance for 2H families).
- [X] Run `bun run items:build-assets` to rasterize + pack melee icons into the atlas.
- [X] Update `content/items/weapons.json` so every melee item's `icon` and `model` fields resolve to manifest entries (fill any gaps from E02-S04).
- [X] Write test: every melee item ID in `content/items/weapons.json` has a resolvable `icon` and `model` in the manifest.
- [X] Write test: each melee silhouette SVG has all required `data-region` attributes.
- [X] Write test: each melee geometry factory returns a non-empty `BufferGeometry` with finite bounds.

## Acceptance criteria

- [X] All 156 melee weapons have flat icons rendered in inventory/bank/equipment.
- [X] All 156 melee weapons have wielded 3D models that attach to the humanoid hand.
- [X] Tier is readable at a glance: Cobbled looks like junk, Bellmetal is golden, Wardensteel is blue-white, Starfall is mythic.
- [X] 2H weapons visually occupy both hands and show no shield.
- [X] Reach weapons are visibly pole-length.
- [X] Every melee `icon`/`model` AssetId resolves via the manifest.

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
