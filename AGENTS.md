# Old Town — Agent Context

> Browser-first, lo-fi 3D MMO inspired by 2006/2007 OSRS-era primitives. Built in Three.js + Bun/Node.

**Maintenance rule:** Keep this file tight as the repo evolves. Delete noise, add signal, and never let it drift from reality. When a section goes stale, rewrite it in place rather than tacking on corrections.

## Source of truth hierarchy

1. `POC_SPEC.md` — authoritative spec for all engine behavior, data formats, and acceptance tests. Use § references in story files to jump to relevant sections rather than reading the whole document.
2. `tasks/` tree — ordered work items. Epic files describe story groups; story files describe single implementation increments.
3. `POC_SPEC.md` wins if any task file seems under-specified or contradicts it.

## Task system

- The repo contains a linear epic/story task tree in `tasks/`.
- [`TASK_MANIFEST.json`](tasks/TASK_MANIFEST.json) is the machine-readable index.
- `tasks/README.md` defines execution rules: work by epic number, then by story number.
- Start at the lowest-numbered remaining epic (run `bun run tasks:status` to identify it). Do not skip ahead.
- Within an epic, complete stories in numeric order.
- When a story is complete, mark its checkboxes `[X]`, move it to `tasks/completed/stories/E##/`, and update the parent epic checklist.
- When an epic is complete, move it to `tasks/completed/epics/`.

## Engineering invariants (never violate)

- 🔒 **Server is authoritative.** Client sends intents only (MoveIntent, ObjectIntent, NpcIntent, ItemIntent, SpellIntent). The server decides all truth.
- 🔒 **Integer world, float renderer.** Gameplay truth is integer tiles, planes, ticks, IDs, masks. Three.js positions are presentational only and must never drive gameplay.
- 🔒 **600ms tick.** No `await sleep`, `setTimeout`, or animation-complete callbacks for gameplay. Use tick queues and action delays.
- 🔒 **Tile bitmask collision.** No physics engine. Movement blocking is directional bitmask flags.
- 🔒 **Content-driven.** Items, NPCs, objects, quests, skills, spells are JSON definitions loaded into registries. Do not hardcode specific content behavior.
- 🔒 **Original assets only.** Do not import OSRS cache, assets, protocol, names, maps, or copied quests.

## Default stack

- **Client:** Vite + TypeScript + raw Three.js (no R3F unless explicitly chosen).
- **Server:** Bun or Node + TypeScript + raw `ws` WebSocket.
- **Shared:** `packages/shared` for protocol types, math, content schemas.
- **Tests:** Vitest.
- **Package manager:** Bun workspace (`bun install`, `bun run test`).
- **Content:** JSON definitions in `content/`, validated with Zod schemas.

## Validation discipline

- Every story lists validation commands. Run them before marking complete.
- Typical validation: `bun run test`, `bun run lint`, `bun run typecheck`, `bun run content:validate`.
- Never leave broken builds between completed stories.
- Add or improve tests for any deterministic logic a story creates.

## Task workflow conventions

- Mark completed checkboxes as `[X]` in the story file.
- Move completed story files to `tasks/completed/stories/E##/` preserving filename.
- Move completed epic files to `tasks/completed/epics/`.
- Do not ask for product clarification. Use `POC_SPEC.md` and the current story's explicit requirements. Make the smallest technically correct decision that preserves the invariants above.
- Do not add time estimates or unrelated polish.

## Quick architecture map (from `POC_SPEC.md` §25)

```
apps/
  client/   — Vite + Three.js renderer, input, net, UI
  server/   — tick loop, ECS, systems, net, persistence
packages/
  shared/   — protocol, types, math, content schemas
content/    — JSON definitions (items, NPCs, objects, skills, spells, quests, maps, drops, dialogue)
scripts/
  — task helpers and CI scripts
tools/
  world-editor/      — tile/object/NPC placement, export
  content-validator/ — CLI to validate JSON against schemas
```

## Important notes

- `POC_SPEC.md` is a large engine spec. Use the § references in epic/story files to read the relevant sections, not the whole document each time.
- `adrs/` has ADRs for specific architectural areas. Consult the relevant one when making changes in that area. Create ADRs only when a story explicitly requires it.
- `docs/content/00-index.md` is the authoritative bridge between design docs and runtime content JSON. When a story requires content generation, start there.
