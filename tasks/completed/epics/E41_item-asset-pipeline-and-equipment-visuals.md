# E41 — Item Asset Pipeline and Equipment Visuals

## Dependency chain

- Depends on: E39 (Equipment Appearance System), E33 (Render Resource Registry), E02 (item content/schemas)
- Unlocks: future content-audio epic, UI polish epics

## Spec references

- `POC_SPEC.md` §16 (Items, inventory, equipment)
- `POC_SPEC.md` §13 (Combat — weapon styles, attack speed, reach)
- `POC_SPEC.md` §14 (UI & HUD — inventory, bank, equipment panels)
- `POC_SPEC.md` §23.3 (Originality — no OSRS/Jagex assets)
- `docs/items/00-index.md` — item system index, tier table, slot map
- `docs/items/weapons/00-index.md` — weapon families
- `docs/items/armour/00-index.md` — armour slots
- `docs/items/accessories/00-index.md` — accessory slots
- `docs/technical/asset-baking-and-instancing.md` — render resource contract
- `packages/shared/src/content-schemas/item.ts` — `icon` + `model` AssetId fields
- `packages/shared/src/content/content-ids.ts` — `AssetId` conventions

## Epic goal

Old Town defines ~1,400 equippable items across weapons, armour, accessories, and ammunition, but every `icon` and `model` AssetId in `content/items/*.json` is currently a dangling string with no backing art. The inventory panel renders item **names as text**. Equipment appearance has no per-item geometry. This epic creates the full OSRS-style visual asset pipeline: **flat 2D sprite icons** for inventory/bank/equipment (the "flat equivalents"), **low-poly 3D wielded/worn models** for the world renderer, and **ground-item billboards** — all original, all content-driven, all generated from a silhouette + tier-palette system so the 13-tier cultural identity stays readable at a glance.

The design goal is the OSRS feel: a player can look at an inventory icon or a worn silhouette and instantly read the tier and family ("that's a Bellmetal Fellaxe", "that's full Warden"). Flat icons are the primary identity surface; worn 3D models are the secondary social signal.

## Approach summary

1. **Silhouette + tier palette.** Every item family (Shortblade, Fellaxe, Helm, Coif, Wand, Cape, Arrows, …) owns one canonical SVG silhouette path. Every tier owns a palette (base color, accent color, grip/material color, trim color) derived from the tier's `visualIdentity`. An icon is the family silhouette filled with the tier palette. This makes ~1,400 icons consistent, diff-friendly, and authorable without per-item hand drawing.
2. **SVG source → PNG raster → sprite atlas.** Icons are authored as SVG (vector, reviewable in PRs), rasterized to a fixed cell size at build time, and packed into one or more sprite atlases served to the client. The client resolves `icon` AssetId → atlas UV.
3. **Procedural low-poly 3D models per family.** Each weapon/armour family owns a `BufferGeometry` factory registered with `RenderResourceRegistry`. Tier modifies material color via the material registry (one shared `MeshToonMaterial`/`MeshLambertMaterial` per tier, per the asset-baking contract §12). No custom shaders.
4. **Equipment appearance wiring.** The existing appearance system (E28-S01/E39-S01) gains per-slot geometry attachment: weapon → hand bone proxy, helm → head, chest → torso, etc. Mixed sets must compose (a Wardensteel Helm + Bellmetal Harness renders both).
5. **Ground-item billboards.** Ground items reuse the flat icon texture as an atlas-backed billboard, per asset-baking contract §1 (ground items = InstancedMesh or atlas-backed billboard).
6. **Originality.** No OSRS cache sprites, models, names, or proportions. Silhouettes are Old Town's own. The visual language is lo-fi toon-shaded 3D, not pixel art.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E41/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E41-S01` — [Asset directory, manifest schema, and build pipeline](stories/E41/E41-S01_asset-directory-manifest-and-build-pipeline.md)
- [X] `E41-S02` — [Flat icon rendering in inventory, bank, and equipment UI](stories/E41/E41-S02_flat-icon-rendering-inventory-bank-equipment-ui.md)
- [X] `E41-S03` — [Melee weapon icons and wielded models](stories/E41/E41-S03_melee-weapon-icons-and-wielded-models.md)
- [X] `E41-S04` — [Ranged and thrown weapon icons and models](stories/E41/E41-S04_ranged-and-thrown-weapon-icons-and-models.md)
- [X] `E41-S05` — [Magic weapon icons and models](stories/E41/E41-S05_magic-weapon-icons-and-models.md)
- [X] `E41-S06` — [Melee armour icons and worn models](stories/E41/E41-S06_melee-armour-icons-and-worn-models.md)
- [X] `E41-S07` — [Ranged and magic armour icons and worn models](stories/E41/E41-S07_ranged-and-magic-armour-icons-and-worn-models.md)
- [X] `E41-S08` — [Accessory and ammunition icons and models](stories/E41/E41-S08_accessory-and-ammunition-icons-and-models.md)
- [X] `E41-S09` — [Equipment appearance wiring, ground item billboards, and final validation](stories/E41/E41-S09_equipment-appearance-wiring-ground-item-billboards-final-validation.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] Every item definition in `content/items/*.json` has a resolvable `icon` asset and, for equippables, a resolvable `model` asset.
- [X] Inventory, bank, and equipment panels render flat sprite icons instead of item-name text.
- [X] Equipped items appear on the player and other humanoids as low-poly 3D attachments that compose across mixed tiers.
- [X] Ground items render as atlas-backed billboards using the flat icon.
- [X] The implementation still preserves server authority, integer tile truth, 600ms tick semantics, content-driven definitions, original-only assets, and client-only presentation.
- [X] No later epic has been implemented in a way that bypasses this epic's contracts.
