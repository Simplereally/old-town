# Old Town Final POC Report

Date: 2026-05-31

Scope: final compliance pass for `POC_SPEC.md` sections 26-30 and the E15 task tree.

## Summary

Old Town now has a coherent browser-playable POC: a Vite/Three.js client, an authoritative
Bun/Node WebSocket server, integer-tile gameplay, 600 ms tick simulation, bitmask collision,
content registries, multiplayer deltas, combat, skilling, magic, quest scripting, persistence
adapters, item audit logs, authoring tools, integration tests, and performance counters.

The implementation preserves the core invariants:

- Server authority: clients send intents; the server validates and mutates truth.
- Integer world truth: gameplay positions, ticks, IDs, masks, and content refs are authoritative.
- 600 ms tick cadence: gameplay uses tick phases and queued actions, not animation callbacks.
- Bitmask collision: movement, line of sight, projectile checks, and occupancy use tile masks.
- Content-driven definitions: runtime content is JSON validated through shared schemas.
- Original content: seed names, maps, quests, NPCs, objects, and items are Old Town-specific.

## Implemented Systems

- Local POC launcher: `bun run dev` starts the server and Vite client together.
- WebSocket networking: full-state bootstrap, tick deltas, command routing, interest filtering,
  session connect/disconnect, two-tab multiplayer visibility, and dev session auth.
- Movement: click-to-move, walk/run movement, pathfinding, diagonal clip prevention, object reach
  pathing, collision masks, and client interpolation.
- Rendering: Three.js orthographic scene, streamed terrain chunks, objects, actors, ground items,
  projectiles, hitsplats, overhead chat, click markers, grid/debug overlays, and resource disposal
  checks for chunk/entity removal.
- UI: inventory, equipment, spellbook, quest journal, chat, context menus, debug overlays, and
  client content loading.
- Items and stats: 28-slot inventory, equipment slots, bonuses, consumables, skill/XP state,
  combat-level calculation, item transactions, and audit persistence.
- Skilling: resource-node woodcutting/mining, processing/cooking, tool and level validation,
  action repeats, depletion, respawn, inventory rewards, and XP grants.
- NPC/combat: NPC placement, wander/leash/aggro AI, melee target validation, exact attack-speed
  intervals, weapon speed swaps, hit rolls, delayed hits, health bars, deaths, respawns, private
  drops, public-drop transition, and pickup rules.
- Magic: spellbook validation, bead costs, cooldowns, range/line-of-sight checks, projectiles,
  delayed damage, bind movement hooks, and interruptible home teleport.
- Dialogue and quests: dialogue graph runtime, player/quest vars, requirements, choices,
  quest objective triggers, rewards, completion safety, and an end-to-end `smoke_over_old_town`
  quest integration test.
- Persistence: disabled-by-default dev adapter, file and memory adapters, character core state,
  dirty-state save queue, disconnect/shutdown flushes, item audit log, and PostgreSQL schema files.
- Content tooling: content validator CLI, content graph/listing, reference checks, world editor,
  tile/collision/object/NPC/resource editing, and production path/LoS/reach probes.
- Performance tooling: client render counters, server `GET /debug/stats`, kernel stats, stress
  harness, and documented bottlenecks in `docs/performance.md`.

## Spec Compliance

`POC_SPEC.md` §26 milestone coverage:

- Offline scene: implemented in the Three.js client with terrain, objects, actors, picking, grid,
  and interpolation.
- Authoritative movement server: implemented through the simulation kernel, command router,
  WebSocket transport, movement systems, and multiplayer integration tests.
- Collision and interactions: implemented with tile bitmasks, object collision, reach checks,
  resource/quest/object routing, and authoring probes.
- Inventory and skilling: implemented through inventory/equipment, resource nodes, repeat actions,
  XP/level state, depletion, respawn, and processing recipes.
- Combat: implemented with NPC AI, target validation, weapon speeds, rolls, hits, XP, deaths,
  drops, ownership, and respawn.
- Magic and ranged-style projectile behavior: implemented for combat spells, bind hooks, and home
  teleport. Ranged weapon combat remains outside this POC's implemented combat path.
- Quest: `Smoke Over Old Town` is completable end to end through dialogue, variables, objectives,
  triggers, hand-ins, kills, and rewards.
- Persistence: implemented for accountless dev characters and item audit trails; file persistence
  is opt-in via environment variables.

`POC_SPEC.md` §27 acceptance coverage is represented by focused unit/integration tests across:

- movement/pathfinding/collision/interest/networking
- combat timing, target validation, death, drops, XP, equipment speed, and consumables
- skilling validation, repeat actions, depletion, respawn, and inventory capacity
- quest requirements, choices, vars, objectives, completion, rewards, and double-reward safety
- command schema rejection, duplicate command rejection, server-authoritative intent handling,
  malformed chat rejection, and no client-side item/XP grants

`POC_SPEC.md` §28-§30 compliance:

- Debug tooling exists for invisible state: true tile, paths, queues, cooldowns, pending hits,
  NPC leash, vars, render counters, server tick duration, delta size, and save queue size.
- Gameplay timing is tick-driven through `TickLoop`, `ActionRuntime`, pending hits, consumables,
  resource repeats, dialogue actions, quest events, spell delays, and persistence flush phases.
- Content is constrained through registries, Zod schemas, reference validation, ID conventions,
  and authored JSON files.
- The final POC scope is a four-region starter town slice with village, forest, mine/cellar areas,
  starter skills, items, NPCs, objects, quest content, multiplayer movement/chat/combat visibility,
  private/public ground drops, and persistence support.

## Commands

Development:

```sh
bun install
bun run dev
```

Open the client at `http://127.0.0.1:5173` or `http://localhost:5173`. The default server listens
on `http://localhost:8080` and `ws://localhost:8080/ws`.

Useful endpoints:

```txt
GET /health
GET /ready
GET /api/content
GET /debug/stats
GET /debug/item-audit?limit=50
```

Quality gates:

```sh
bun run format:check
bun run lint
bun run typecheck
bun run content:validate
bun run test
```

Performance harness:

```sh
PLAYERS=25 TICKS=100 bun run stress:sim
```

Latest local stress baseline is documented in `docs/performance.md`.

## Known Gaps

These are documented as post-POC or wider-game gaps, not incomplete E15 story work:

- Bank, shop/trade, smithing, bowcraft, trapping, fishing, favour offerings, ledger deeds,
  oldroad trails, contracts, and nooks are content-designed but not fully implemented as runtime
  loops.
- Generic `use-on` item targeting is not implemented; item `use` currently prompts for a target
  without mutating state.
- Alchemy/enchant spell effects are intentionally rejected as not implemented. Damage, bind, and
  home teleport are implemented.
- The renderer still uses one mesh per terrain tile. It now avoids obvious disposal leaks, but
  batching or instancing is the next performance improvement.
- Delta broadcasting currently filters and serializes per session each tick; fan-out cost grows
  with connected players.
- Persistence is suitable for dev and schema preparation, but production auth/account routing,
  save backpressure, migrations execution, and hosted database wiring are future work.
- The world editor edits JSON and runs production probes, but it is not yet a full visual content
  pipeline with model/texture import or collaborative editing.

## Task State

All epics E00-E15 are completed and moved to `tasks/completed/epics/`. All story files are moved
to `tasks/completed/stories/`. There are no active task files left under `tasks/epics/` or
`tasks/stories/`.
