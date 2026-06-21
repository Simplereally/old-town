# Old Town World Editor

Local browser tool for inspecting and exporting `RegionMapDef` JSON. It loads the workspace
`content/` registries directly through Vite, so it does not require the game client or live
server.

```bash
bun run world-editor:dev
```

The editor opens the first loaded region map, renders the 64x64 region with region and chunk
grid overlays, and exports schema-validated region JSON through the download link or export
textarea.

Tile editing uses single-tile brushes for terrain materials, height, water/bridge/zone flags,
and static collision masks. Collision options are sourced from the shared `CollisionFlag`
definitions, and undo/redo snapshots are kept locally for the current region.

Placement editing uses content-backed palettes for objects, resource-backed objects, NPCs, and
items, plus trigger fields for IDs, tags, and dimensions. The viewport renders object/NPC
footprints and reach outlines from the same definition data the server uses.

Probe tools run production pathfinding, collision LoS, and interaction reach checks against the
open region without launching the game server. Probe results can be exported as compact JSON
fixtures for regression tests.
