# E41-S02 — Flat icon rendering in inventory, bank, and equipment UI

## Epic

E41 — Item Asset Pipeline and Equipment Visuals

## Dependency chain

- Depends on: E41-S01
- Blocks: E41-S09 (and is the rendering target for E41-S03…E41-S08 icons)

## Spec references

- `POC_SPEC.md` §14 (UI & HUD — inventory, bank, equipment panels)
- `POC_SPEC.md` §16 (Items, inventory, equipment)
- `apps/client/src/game/ui/UIManager.ts` — current text-based inventory/equipment rendering
- `apps/client/src/game/ui/ContentClient.ts` — item definition lookup
- `docs/technical/asset-baking-and-instancing.md` §1 (UI overlays = DOM/canvas, never Three scene graph)

## objective

Replace the text-based inventory, bank, and equipment rendering with OSRS-style flat sprite icons. The client loads the sprite atlas(s) emitted by E41-S01, resolves each item's `icon` AssetId to an atlas cell, and renders the sprite into the slot. This is the "flat equivalent" surface for every item — the primary identity players see in their inventory and bank.

## Required architectural decisions

- **UI overlays stay DOM/canvas** (asset-baking contract §1). Icons render as `<img>`/`background-image` from the atlas PNG, or as canvas-drawn sprites. No Three.js scene-graph icons in the UI.
- **Icon atlas client loader:** `apps/client/src/game/ui/IconAtlas.ts` fetches the atlas PNG + atlas index JSON at startup (alongside `ContentClient.load`), exposes `resolveIcon(assetId): { atlasUrl, uv } | null`.
- **Inventory cell rendering:** `_renderInventory` draws the icon sprite into each occupied cell, with the item quantity badge overlaid (bottom-right) for stackables, exactly like OSRS inventory. Empty cells render the slot background only.
- **Equipment panel rendering:** `_renderEquipment` renders the icon sprite for each equipped slot in the OSRS equipment-layout grid (head, cape, amulet, weapon, body, shield, legs, hands, feet, ring, ammo) instead of a label/value row.
- **Bank rendering:** `_renderBank` renders icons in the bank grid with quantity badges.
- **Tooltip/examine on hover:** the item name + examine text appears on hover (title attribute or custom tooltip), preserving the current information density.
- **Fallback:** an item with an unresolved icon falls back to a clearly-visible placeholder (magenta "missing" sprite) so dangling assets are caught immediately, not silently.
- **No gameplay logic changes.** This is presentation only; server authority and the existing item-command callbacks are untouched.

## Implementation checklist

- [X] Create `apps/client/src/game/ui/IconAtlas.ts` with `load(serverUrl)` and `resolveIcon(assetId)`.
- [X] Fetch atlas PNG + index JSON from the server static path served by E41-S01's build output.
- [X] Refactor `UIManager._renderInventory` to render icon sprites + quantity badges.
- [X] Refactor `UIManager._renderEquipment` to render an OSRS-style equipment slot grid with icons.
- [X] Refactor `UIManager._renderBank` to render icon sprites + quantity badges.
- [X] Add a missing-icon placeholder sprite so unresolved AssetIds are visually obvious.
- [X] Preserve hover tooltips (name + examine) on all icon cells.
- [X] Wire `IconAtlas` into `GameEngine` startup alongside `ContentClient.load`.
- [X] Write test: `IconAtlas.resolveIcon` returns correct UV for a known AssetId.
- [X] Write test: `IconAtlas.resolveIcon` returns null/placeholder for an unknown AssetId.
- [X] Write test: inventory render produces an `<img>`/canvas sprite for an occupied slot (DOM snapshot or render spy).

## Acceptance criteria

- [X] Inventory, bank, and equipment panels render flat sprite icons instead of item-name text.
- [X] Stackable items show a quantity badge.
- [X] Equipment panel uses the OSRS slot grid layout with icons.
- [X] Missing icons render a visible placeholder, not blank.
- [X] Hover tooltips still show name + examine.
- [X] No gameplay/server-authority changes.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E41/` only after all criteria pass.
- [ ] Update the parent epic checklist if this story completes an ordered item.
