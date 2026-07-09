# E53-S02 — Blender building generator and copy script

## Epic

E53 — Unique Building GLB Pipeline

## Dependency chain

- Depends on: E53-S01 (archetype ids fixed)
- Blocks: E53-S03

## Objective

Headless-Blender generator producing all 22 building GLBs per
`docs/world/starter-buildings-visual-spec.md`, plus the copy step into the client public dir.

## Implementation guidance

- **Read `scripts/generate-weapon-models.py` + `generate-weapon-models.sh` first** and mirror:
  bpy invocation, GLB export settings (compression, no materials), how vertex colours are
  written to `COLOR_0`, output naming. Keep the same Blender invocation pattern
  (`/Applications/Blender.app/Contents/MacOS/Blender --background --python ...` per the sh
  wrapper — parameterize the Blender path via env var like the weapon script does, or add it).
- **Structure the generator as data + builders:** a `PALETTE` dict (hexes from the visual spec,
  verbatim), an `ARCHETYPES` dict (footprint, height, builder fn), and small composable
  builders (`box`, `gable_roof(w,l,h,pitch)`, `hip_roof`, `pyramid_cap`, `cylinder8`,
  `chimney`, `stilts`, `crenellations`). Every archetype function is ≤ ~40 lines composing
  these. Bake face colours by material-region assignment → vertex colours (same mechanism as
  weapons).
- **Conventions (from the spec — enforce in code, not by care):** origin at footprint center,
  ground y=0, door faces −Y in Blender if the weapon pipeline's axis convention maps Blender −Y
  → Three.js −Z (VERIFY against the weapon script's export axis settings and one loaded weapon
  before assuming; write the verified mapping as a comment at the top of the generator).
  1 tile = 1.0 unit. Assert per-archetype tri budgets in the script (≤900 house / ≤2000
  landmark / ≤400 prop — fail the build over budget).
- **Gatehouse passage:** assert no geometry intersects the passage volume (center tile,
  y 0–2.5) — write it as an actual programmatic check in the generator.
- **Outputs:** `assets/buildings/models/<archetype>.glb` + `assets/buildings/models/manifest.json`
  (`{ "archetypes": [...] }`, the 22 ids). Write `assets/buildings/README.md` (regen command,
  conventions, budgets).
- **Copy script `scripts/copy-building-models.ts`:** mirror `copy-weapon-models.ts` →
  `apps/client/public/models/buildings/`; print tri counts and validate against manifest
  (missing/extra files fail).
- **npm scripts:** `buildings:generate`, `buildings:copy`, `buildings:build` (match the
  `weapons:*` naming style already in root `package.json`).

## Required work

- [X] Generator with palette/builders/assertions; all 22 GLBs generated.
- [X] Manifest + README committed alongside the GLBs.
- [X] Copy script + npm scripts.
- [X] Visual review: import 4–5 representative GLBs (bell tower, forge, house_a, fishmonger,
  crypt) into the running client via a temporary registry override or the S03 loader if
  already underway — otherwise open in any GLB viewer — and confirm silhouettes match the
  spec's "reads from the roofline" rule. Record which you reviewed.

## Acceptance criteria

- [X] `bun run buildings:build` is idempotent, produces 22 GLBs within budget, and fails loudly on budget/passage violations.
- [X] Vertex colours present (`COLOR_0`) and palette-correct; no materials/textures embedded.
- [X] Axis/origin convention verified against the weapon pipeline and documented in the script.

## Completion note (2026-07-04)

Delivered ahead of E53-S01 (archetype ids sourced directly from
`docs/world/starter-buildings-visual-spec.md`; S01's content defs must use these exact ids —
`assets/buildings/models/manifest.json` is authoritative). All 22 archetypes generated at
72–276 tris (budgets: prop 400 / house 900 / landmark 2000). Visual review was done via the
generator's `--previews` mode (headless Workbench renders, vertex colours, isometric camera)
across ALL 22 archetypes, not just 5. Four first-pass defects found and fixed by iterating on
renders: house_c X-brace rotated about the wrong axis, tannery mono-pitch floating above the
walls, house_b lean-to unsupported, crypt moss slab reading as a roof. Gatehouse passage
clearance and per-class tri budgets are asserted in the generator. Axis mapping verified by
parsing an exported GLB (POSITION y-min ≈ 0, footprint on x/z). Field notes recorded in
`.agents/skills/old-town-asset-craft/SKILL.md`.

## Validation commands

- `bun run buildings:build`
- `bun run test && bun run typecheck && bun run lint`
