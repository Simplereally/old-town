# Item Assets (E41)

Original art pipeline for item icons, wielded/worn 3D models, and ground-item
billboards. Everything here is Old Town's own — no OSRS/Jagex assets.

## Layout

```
assets/items/
  manifest.json        # AssetId → entry registry (source of truth for art refs)
  silhouettes/         # SVG silhouettes, one per family, recolourable data-region attrs
  palettes/            # Tier palettes, 5 ladders × 13 tiers
    melee/             # weapons + armour metal ladder
    ranged/            # bows, crossbows, thrown, ammo
    magic/             # wands, staves, rods, foci, grimoires, cloth armour
    ranged-armour/     # hide armour ladder
    accessory/         # cape/amulet/belt/ring/charm/trophy bands
  models/              # procedural model specs (family geometry parameters)
  atlases/             # build output (gitignored) — atlas-0.svg + atlas-index.json
```

## Pipeline

- **Silhouette + tier palette.** An icon = family silhouette SVG + tier palette,
  composed by `composeIconSilhouette` (recolors `data-region` attributes).
- **Deterministic atlas.** Icons are sorted by AssetId and packed into a sprite
  sheet by `packIconAtlas`. Same input → same atlas → stable diffs.
- **DOM/canvas only.** Icons render as SVG in the DOM (asset-baking §1), never
  in the Three.js scene graph.

## Scripts

```
bun run items:build-assets     # compose + pack → assets/items/atlases/
bun run items:validate-assets  # cross-ref content items vs manifest, fail on dangling
```

## Adding an icon

1. Author `silhouettes/<family>.svg` with `data-region="blade"` etc. (no `fill`).
2. Add a manifest entry: `{ id, kind: "icon", silhouette, palette }`.
3. Run `bun run items:build-assets`.
