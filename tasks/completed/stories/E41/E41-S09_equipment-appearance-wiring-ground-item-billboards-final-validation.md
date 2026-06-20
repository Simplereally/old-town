# E41-S09 — Equipment appearance wiring, ground item billboards, and final validation

## Epic

E41 — Item Asset Pipeline and Equipment Visuals

## Dependency chain

- Depends on: E41-S01, E41-S02, E41-S03, E41-S04, E41-S05, E41-S06, E41-S07, E41-S08
- Blocks: (none — epic terminator)

## Spec references

- `docs/technical/asset-baking-and-instancing.md` §1 (ground items = InstancedMesh or atlas-backed billboard), §12 (materials)
- `apps/client/src/game/scene/ActorRenderer.ts` — humanoid pool, attachment points
- `apps/server/src/systems/appearance-system.ts` (E28-S01 / E39-S01) — equipment → appearance mapping
- `POC_SPEC.md` §13 (Combat — projectiles), §16 (Items, ground items)
- `docs/items/00-index.md` — full item count summary

## Objective

Wire every asset from E41-S03…E41-S08 into the equipment appearance system so equipped items compose on the humanoid, implement ground-item billboards that reuse the flat icon atlas, implement in-flight projectile billboards for thrown/ammo, and run the final epic-wide validation pass. This is the story that makes the whole pipeline visible in-world and proves no item is missing art.

## Required architectural decisions

- **Appearance composition:** the appearance system (E28-S01/E39-S01) already maps equipment slot → appearance overrides. This story populates that mapping with the per-family geometry + per-tier material registered in E41-S03…E41-S08. A player wearing Wardensteel Helm + Bellmetal Harness + Pennywrought Shortblade renders all three correctly together.
- **Slot priority and conflicts:** chest has three families (Harness/Hauberk/Platecoat) — only one chest item is equipped at a time (server-enforced); the renderer renders whichever the server says is equipped. Head has Helm vs Greathelm similarly. No client-side conflict resolution.
- **2H weapon stance:** when a 2H weapon is equipped, the left-hand shield/charmward/buckler attachment is hidden (server already blocks the shield slot). The renderer trusts the server equipment state.
- **Ground-item billboards:** ground items render as atlas-backed billboards using the flat icon texture (asset-baking contract §1). A `GroundItemLayer` acquires an instance per ground item, sets the billboard texture from `IconAtlas.resolveIcon`, and writes the transform. No new `Mesh`/`Texture` in the hot path — the atlas texture is preloaded.
- **Projectile billboards:** arrows/bolts/thrown in flight render as small billboards using the ammo/weapon icon, pooled via `RenderObjectPool` (asset-baking contract §6). No per-frame allocation.
- **Appearance update on equip/unequip:** the existing appearance packet broadcast (E28-S01) drives re-attachment. Equip → attach family geometry + tier material; unequip → detach and revert to base humanoid mesh for that slot.
- **No gameplay changes.** All of this is presentational. Server authority, integer tile truth, and 600ms tick semantics are untouched.

## Implementation checklist

- [X] Wire the appearance system to resolve `model` AssetId → registered geometry factory + tier material.
- [X] Implement per-slot attach/detach in `ActorRenderer` for: weapon, head, chest, legs, feet, hands, shield, cape, amulet, belt, trophy, off-hand.
- [X] Implement 2H-stance left-hand hide when the server reports a 2H weapon equipped.
- [X] Create `GroundItemLayer` using `InstancedMesh`/atlas billboards with the preloaded icon atlas.
- [X] Create projectile billboard rendering via `RenderObjectPool` for arrows/bolts/thrown.
- [X] Verify equip → appearance packet → re-attach works end-to-end.
- [X] Verify unequip → revert to base humanoid mesh.
- [X] Run full `bun run items:build-assets` and confirm the atlas contains every item icon.
- [X] Run `bun run items:validate-assets` and confirm zero dangling `icon`/`model` references across all `content/items/*.json`.
- [X] Write test: a full same-tier set composes on the humanoid (all slots attach).
- [X] Write test: a mixed-tier set composes without slot conflicts.
- [X] Write test: 2H weapon hides the left-hand shield attachment.
- [X] Write test: ground item billboard uses the correct icon UV.
- [X] Write test: every item in every `content/items/*.json` file has a resolvable `icon` and (if equippable) `model`.

## Acceptance criteria

- [X] Equipped items appear on the local player and other humanoids as 3D attachments that compose across mixed tiers and slots.
- [X] Equip/unequip updates appearance in real time via the existing appearance packet.
- [X] 2H weapons hide the off-hand attachment.
- [X] Ground items render as atlas-backed billboards using the flat icon.
- [X] Projectiles render as pooled billboards.
- [X] `bun run items:validate-assets` reports zero dangling asset references across the entire item content set.
- [X] The full atlas builds deterministically and contains every item icon.
- [X] No gameplay/server-authority/tick changes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run items:build-assets`
- [X] `bun run items:validate-assets`
- [X] `bun run content:validate`
- [X] `bun run tasks:status`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E41/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
