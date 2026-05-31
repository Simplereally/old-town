Below is a technical engine spec for **Old Town**, optimized for a **2006/2007 OSRS-feeling MMO** built in **Three.js**, without cloning RuneScape assets, maps, names, protocol, or content. The core bet: preserve the *rhythm and primitives* that make OSRS feel OSRS-like with the charming lofi style, but implement them as a modern, original, web-native engine.

---

# Old Town Engine Spec

## 0. Research distillation

The key technical primitives worth learning from 2006/2007 RuneScape / OSRS are not “graphics” first. They are:

1. **A slow authoritative server tick.** RuneScape’s public/community-documented tick is 0.6 seconds. Actions submitted during one tick generally take effect on the next tick, and attack speeds are integer multiples of that tick. ([RuneScape Wiki][1])
2. **Tile-first truth, animation-second presentation.** Walking covers 1 tile per tick and running covers 2 tiles per tick in community-documented mechanics; the true position changes on tick boundaries while the client animates between true states. ([RuneScape Wiki][2])
3. **A grid/chunk/region spatial model.** RuneLite exposes constants matching the classic structure: 8×8 chunks, 64×64 regions, and a 104×104 active scene. ([GitHub][3])
4. **Collision is not physics.** It is a tile bitmask system with directional movement blocks, full movement blocks, line-of-sight blocks, projectile blocks, entity occupancy, and special cases. RuneLite exposes collision flags; OSRS Docs describes player, NPC, projectile, and full-blocking entity collision flags. ([static.runelite.net][4])
5. **The world is content-data driven.** Items, NPCs, objects, animations, maps, quests, skills, spells, drops, and interfaces are definitions interpreted by the engine. OpenRS2’s archive exists because RuneScape/OSRS content is cache-driven across clients and builds. ([archive.openrs2.org][5])
6. **Entity updates are delta/mask based.** OSRS Docs describes update masks as transmitting changes such as transformations, overhead chat, animations, hits, movement speed, spot animations, and facing updates. ([osrs-docs.com][6])
7. **Action queues are central.** OSRS Docs describes a queue system used by players and NPCs for queued script execution, with queue types and interruption semantics. ([osrs-docs.com][7])
8. **Progression is slow, exponential, and unlock-driven.** RuneScape’s skills gain XP through associated actions, and higher levels unlock equipment, locations, quests, and activities. ([RuneScape][8])
9. **Combat is simple on the surface, deep in timing.** The classic feel comes from attack intervals, target selection, movement, safe-spotting, pathing, prayers/buffs, food timing, gear stats, and deterministic order-of-operations, not from animation complexity.
10. **Legal boundary:** use these as engineering primitives only. Jagex’s official site states Old School RuneScape content is copyright Jagex; Old Town should use original assets, item names, maps, quests, NPCs, lore, cache format, and protocol. ([Old School RuneScape][9])

---

## 1. Product target

**Old Town** is a browser-first, lo-fi 3D, tile-based MMO inspired by the *feel* of 2006/2007 RuneScape:

* fixed or semi-fixed isometric camera
* click-to-move
* tile-accurate movement
* tick-based combat
* rich skills
* long-tail leveling
* quest-driven world progression
* simple readable art
* content definitions over bespoke code
* server-authoritative state
* low CPU/GPU cost
* eventual MMO scale

The POC should prove the engine, not the whole game.

**Minimal POC fantasy:**

A player spawns in a small village, clicks to move, chops trees, mines rocks, fights goblins, casts a basic spell, equips a weapon, receives drops, levels a few skills, talks to an NPC, completes one quest, and sees other players moving/combatting in real time.

---

## 2. Hard design rules

### 2.1 Server is truth

The client never decides:

* true tile position
* inventory changes
* XP gains
* damage rolls
* drops
* quest state
* item spawns
* NPC pathing
* whether an interaction is valid

The client sends **intent commands** only:

```ts
MoveIntent { dest: TileCoord }
ObjectIntent { objectEntityId, actionId: "chop" | "mine" | "open" }
NpcIntent { npcEntityId, actionId: "attack" | "talk" }
ItemIntent { itemUid, actionId: "equip" | "eat" | "drop" }
SpellIntent { spellId, targetEntityId | targetTile }
```

The server responds with authoritative snapshots/deltas.

### 2.2 Integer world, float renderer

Engine truth uses integers:

```ts
type Tick = number;          // monotonically increasing integer
type TileX = number;         // integer
type TileY = number;         // integer
type Plane = 0 | 1 | 2 | 3;

type TileCoord = {
  x: TileX;
  y: TileY;
  plane: Plane;
};
```

Renderer uses floats only to interpolate between tick states.

Never let Three.js object positions become gameplay truth.

### 2.3 Tick is a feature, not lag

Use:

```ts
GAME_TICK_MS = 600
```

Client render loop runs at display refresh rate. Server simulation runs at 600ms. This preserves the readable rhythm and reduces server load. OSRS-like mechanics are built around this quantum, including attack speeds and movement speed. ([RuneScape Wiki][1])

### 2.4 Client feel must be immediate

Even with 600ms authoritative ticks, client UX must not feel dead:

* click marker appears instantly
* destination tile highlights instantly
* character begins a *predicted visual lean/turn* immediately
* true tile updates only when server confirms
* render interpolation hides snap
* invalid moves are corrected cleanly

The “truth” is ticked. The “juice” is immediate.

---

## 3. Recommended stack

### Client

* **Vite + TypeScript**
* **Three.js**
* optional: React for UI shell, but keep game renderer independent
* Zustand/TanStack Store for UI-only state
* no heavy physics engine
* no R3F dependency for the core engine unless you already strongly prefer it

Three.js is enough. Use raw Three for deterministic control, object pooling, instancing, and render-loop ownership.

Use **InstancedMesh** or batched meshes for repeated scenery, trees, rocks, grass tufts, fences, ore nodes, dropped items, and decorative props. Three.js documents `InstancedMesh` as a first-class object type; community guidance consistently points to instancing when rendering many repeated objects. ([Three.js][10])

### Server

Best POC path:

* **Bun or Node**
* **TypeScript**
* **Colyseus** for rooms/state sync during POC
* **uWebSockets transport** for production scaling path
* **PostgreSQL** for accounts, characters, persistence
* **Redis** later for world process coordination, chat fanout, login sessions

Colyseus is a good fast-start because it gives room/matchmaking abstractions and schema-based state synchronization where the server mutates state and clients listen for changes. ([Colyseus][11]) For production, Colyseus itself recommends uWebSockets.js transport as more capable and lower-resource than the default WebSocket transport. ([Colyseus][12])

### ECS / simulation core

Use one of:

1. **Custom data-oriented ECS** for full control.
2. **bitECS** for a small, performant TS ECS. bitECS is designed as a data-oriented ECS with zero dependencies, lightweight footprint, querying, serialization, and thread-friendly architecture. ([bitecs.dev][13])

Recommendation: start with a **small custom ECS** so you own every primitive. You can still copy the bitECS *style*.

---

## 4. Spatial model

Borrow the proven spatial hierarchy, but make it yours:

```ts
TILE_SIZE_WORLD_UNITS = 1
CHUNK_SIZE = 8          // 8x8 tiles
REGION_SIZE = 64        // 8x8 chunks
ACTIVE_SCENE_SIZE = 104 // 13x13 chunks, classic-inspired
PLANES = 4
```

RuneLite exposes these exact classic constants: chunk size 8, region size 64, scene size 104. ([GitHub][3])

### 4.1 Coordinate types

```ts
type WorldTile = {
  x: number;      // global tile x
  y: number;      // global tile y
  plane: number;  // 0..3
};

type ChunkCoord = {
  cx: number;     // floor(x / 8)
  cy: number;     // floor(y / 8)
  plane: number;
};

type RegionCoord = {
  rx: number;     // floor(x / 64)
  ry: number;     // floor(y / 64)
  plane: number;
};

type LocalSceneCoord = {
  sx: number;     // 0..103
  sy: number;     // 0..103
  plane: number;
};
```

### 4.2 Region ID

Use a clean namespaced ID, not OSRS’s exact ID packing unless you specifically want compatibility for tooling:

```ts
regionId = `${rx}:${ry}:${plane}`;
chunkId = `${cx}:${cy}:${plane}`;
tileKey = `${x}:${y}:${plane}`;
```

For engine speed, add packed integer IDs later:

```ts
packedTile = (plane << 28) | (x << 14) | y
```

Use 32-bit or 53-bit safe integers. Do **not** create legacy 16-bit ID ceilings. OSRS has reportedly had model/scenery ID pressure due to long-lived content growth; design Old Town with large typed IDs from day one. ([GamesRadar+][14])

---

## 5. World representation

### 5.1 Tile data

Each tile stores only gameplay-relevant data:

```ts
type Tile = {
  height: number;              // render elevation, integer or small fixed decimal
  underlayId: GroundMaterialId;
  overlayId?: GroundMaterialId;
  collision: CollisionMask;
  zoneId?: ZoneId;
  water?: boolean;
  bridge?: boolean;
};
```

### 5.2 Collision mask

Use bitmasks. Do not use physics colliders for core gameplay.

```ts
enum CollisionFlag {
  BLOCK_NORTH        = 1 << 0,
  BLOCK_EAST         = 1 << 1,
  BLOCK_SOUTH        = 1 << 2,
  BLOCK_WEST         = 1 << 3,

  BLOCK_FULL         = 1 << 4,
  BLOCK_FLOOR        = 1 << 5,
  BLOCK_DECORATION   = 1 << 6,

  BLOCK_LOS_NORTH    = 1 << 7,
  BLOCK_LOS_EAST     = 1 << 8,
  BLOCK_LOS_SOUTH    = 1 << 9,
  BLOCK_LOS_WEST     = 1 << 10,
  BLOCK_LOS_FULL     = 1 << 11,

  OCCUPIED_PLAYER    = 1 << 12,
  OCCUPIED_NPC       = 1 << 13,
  OCCUPIED_OBJECT    = 1 << 14,

  PROJECTILE_BLOCK   = 1 << 15,
}
```

This mirrors the important distinction seen in RuneLite collision flags and OSRS Docs: movement blocking, line-of-sight blocking, projectile blocking, full blocking, and entity occupancy are related but not identical. ([static.runelite.net][4])

### 5.3 Dynamic collision

Objects mutate collision:

* closed door: blocks movement east/west or north/south
* open door: moves collision to adjacent wall edge or removes it
* gate: similar but 2 tiles wide
* tree: does not block full tile unless designed so
* large NPC: adds dynamic occupancy footprint
* player: optional soft occupancy for PvP/body blocking zones

All dynamic collision changes must be deterministic and replayable.

---

## 6. Scene streaming

### 6.1 Server interest area

For each player, maintain:

```ts
interestScene = square around player, 104x104 tiles
interestChunks = chunks intersecting interestScene
interestRegions = regions intersecting interestScene
```

The client should only receive:

* terrain chunks
* objects in interest chunks
* NPCs in interest area
* players in interest area
* projectiles/graphics in interest area
* ground items in interest area

### 6.2 Client scene rebuild

When player crosses a chunk boundary:

1. server sends `ChunkUnload[]`
2. server sends `ChunkLoad[]`
3. client updates terrain/object pools
4. entities keep stable IDs and continue interpolating

Do not rebuild the entire Three.js scene per movement step. Pool everything.

---

## 7. Rendering model

### 7.1 Visual style

Target:

* low-poly geometry
* hand-painted or flat-shaded materials
* low-res icon inventory
* strong silhouettes
* low animation count
* readable tile grid
* chunky UI
* restrained effects

Avoid:

* photorealism
* skeletal over-complexity
* physics ragdolls
* high-frequency particles
* overly smooth action-game movement

### 7.2 Three.js world layers

```ts
SceneRoot
  TerrainLayer
  StaticObjectLayer
  DynamicObjectLayer
  NpcLayer
  PlayerLayer
  ProjectileLayer
  GroundItemLayer
  OverlayLayer
  DebugLayer
```

### 7.3 Renderer rules

* terrain chunks are merged or instanced per material
* repeated objects are instanced
* players/NPCs are pooled meshes
* equipment attachments are simple child meshes
* dropped items are billboard sprites or tiny meshes
* shadows are cheap: blob shadows first, real shadows later
* outlines/selection rings are flat decals or transparent planes
* animation is small clip state machines, not animation-heavy combat

### 7.4 True tile vs visual position

Each actor has:

```ts
serverTile: TileCoord;          // truth
previousServerTile: TileCoord;  // last tick
visualPosition: Vector3;        // interpolated
facingDirection: Direction;
animationState: "idle" | "walk" | "run" | "attack" | "cast" | "hit" | "die";
```

The actor’s true tile changes on tick. Visual position interpolates over the 600ms render window.

---

## 8. Networking model

### 8.1 Message types

Client → server:

```ts
C2S_MOVE_CLICK
C2S_NPC_OPTION
C2S_OBJECT_OPTION
C2S_GROUND_ITEM_OPTION
C2S_ITEM_OPTION
C2S_CAST_SPELL
C2S_CHAT
C2S_UI_ACTION
C2S_PING
```

Server → client:

```ts
S2C_FULL_STATE
S2C_TICK_DELTA
S2C_REGION_LOAD
S2C_REGION_UNLOAD
S2C_ENTITY_ADD
S2C_ENTITY_REMOVE
S2C_ENTITY_UPDATE_MASK
S2C_INVENTORY_DELTA
S2C_CHAT
S2C_HITSPLAT
S2C_XP_DROP
S2C_INTERFACE_OPEN
S2C_DEBUG_DATA
S2C_SOUND
```

### 8.2 Update masks

Use a typed update mask inspired by the classic pattern. OSRS Docs describes update masks as the mechanism for sending changes such as transformations, overhead chat, hits, movement speed, animations, spot animations, and facing. ([osrs-docs.com][6])

```ts
enum EntityUpdateMask {
  POSITION       = 1 << 0,
  FACING_TILE    = 1 << 1,
  FACING_ENTITY  = 1 << 2,
  ANIMATION      = 1 << 3,
  GRAPHIC        = 1 << 4,
  HITSPLAT       = 1 << 5,
  OVERHEAD_TEXT  = 1 << 6,
  APPEARANCE     = 1 << 7,
  EQUIPMENT      = 1 << 8,
  HEALTH_BAR     = 1 << 9,
  TRANSFORM      = 1 << 10,
  MOVE_SPEED     = 1 << 11,
}
```

### 8.3 Delta packet

```ts
type TickDelta = {
  tick: number;
  serverTime: number;
  entityAdds: EntitySpawnPacket[];
  entityRemoves: EntityId[];
  entityUpdates: EntityUpdatePacket[];
  hitsplats?: HitsplatPacket[];
  inventoryDelta?: InventoryDelta;
  skillDelta?: SkillDelta;
  varbitDelta?: VarbitDelta;
  chat?: ChatPacket[];
  interfaceOpens?: InterfaceOpenPacket[];
  debug?: DebugData;
};
```

### 8.4 Snapshot/delta spine

The server maps ECS entities to spawn packets through a pure `EntitySpawnProjector` module:
- player → `kind: "player"`, optional `appearance` and `healthBar`
- npc → `kind: "npc"`, optional `appearance` and `healthBar`
- object → `kind: "object"`, `defId`
- ground item → `kind: "ground_item"`, `defId`, `quantity`
- Missing `position` component → skipped and reported (never silently dropped)

The client applies all S2C packets through a single `ClientPacketApplier` module:
- `applyFullState(packet)` performs an authoritative reset: clears all scene layers before spawning entities
- `applyTickDelta(packet, currentTick)` handles incremental updates: region unloads/loads, entity adds/removes, actor updates, hitsplats, UI deltas, chat, interface opens, debug overlays
- `recordClickTile(tile, tick)` stores the last click for move-rejection tracking
- `GameEngine` only routes socket packets into the applier; no packet-application logic lives in the orchestrator

### 8.5 Patch cadence

For OSRS-like purity:

* gameplay snapshots: every 600ms
* chat: immediate but timestamped
* ping/pong: immediate
* login/bootstrap: immediate
* asset/region streaming: async

For smoother players in a modern web client, you may optionally send small visual-only position deltas at 300ms, but keep gameplay truth at 600ms. I would **not** do this in the POC. Preserve the tick.

---

## 9. Server tick loop

The tick loop is owned by a `SimulationKernel` — the closed public API for server simulation. The kernel connects sessions, routes commands, runs ticks, and broadcasts deltas. No internals escape.

Core loop:

```ts
setInterval(runGameTick, 600);

function runGameTick() {
  tick++;

  ingestNetworkCommands();
  validateAndNormalizeIntents();

  processInterruptions();
  processActionQueues();

  processMovement();
  processNpcBrains();
  processCombat();
  processProjectilesAndDelayedHits();
  processSkillingActions();

  processDeaths();
  processDrops();
  processRespawns();
  processRegeneration();
  processQuestTriggers();

  buildInterestDeltas();
  sendTickDeltas();

  persistDirtyStateAsync();
}
```

### 9.1 Deterministic phase order

Use a strict order. This matters for combat feel.

Recommended order:

1. **Input close:** commands received before tick boundary are eligible.
2. **Interruptions:** movement/object/item clicks cancel weak actions.
3. **Action queue timers:** decrement queued script timers.
4. **Movement:** advance true tile by 1 or 2 tiles.
5. **Target validation:** check range, LoS, reachability.
6. **NPC AI:** acquire targets, flee/return, attack decisions.
7. **Combat start events:** attack animations, cast animations.
8. **Damage resolution events:** apply delayed melee/ranged/magic hits.
9. **Food/potion/prayer/stat changes:** define exact priority.
10. **Death resolution:** zero HP, loot rights, respawn timers.
11. **Skilling progress:** gather rolls, depletion, XP, item rewards.
12. **Quest triggers/varbits:** after inventory/XP changes.
13. **Snapshot/delta build.**

The “alpha” is that most OSRS-like weirdness comes from order-of-operations. Make it explicit now.

---

## 10. Action queue system

OSRS Docs describes a central queue system used by players and NPCs, with scripts processed in order and queue types with interruption semantics. ([osrs-docs.com][7])

The server owns one `ActionRuntime` (created by the `SimulationKernel`), which wraps a single `ActionQueue`. Systems do not create their own queues. The `ActionRuntime` is advanced during the `ActionQueueTimers` tick phase.

```ts
type ActionQueueEntry = {
  id: ActionId;
  owner: EntityId;
  type: "weak" | "normal" | "strong" | "soft";
  delayTicks: number;
  repeat?: {
    intervalTicks: number;
    maxRepeats?: number;
  };
  interruptGroup: "movement" | "combat" | "skilling" | "dialogue" | "interface";
  payload: unknown;
};
```

### 10.1 Queue types

Use:

* **weak:** cancelled by movement, item interaction, interface changes, new object/NPC click
* **normal:** skipped/paused by blocking modal interface
* **strong:** clears weak actions, closes modal interface, executes when timer expires
* **soft:** cannot be interrupted, used for guaranteed delayed effects, area triggers, delayed damage, respawn events

### 10.2 Intent-to-action spine

All consumed intents pass through `IntentDispatcher` (not a raw switch inside the kernel). The dispatcher:

1. Cancels weak actions for the owner before movement, item, UI, object, NPC, or spell intents.
2. Routes move intents to `movement-system`.
3. Routes item intents to `item-actions`.
4. Routes chat intents to `chat-system`.
5. Routes UI unequip intents to `item-actions`.
6. Emits explicit system feedback for unimplemented object/NPC/spell intents (never silently swallows).
7. Ignores ping intents.

### 10.3 Examples

Woodcutting:

```ts
Weak action:
  every 4 ticks:
    if still adjacent to tree
    if axe requirement met
    roll success
    if success: add log, xp
    if deplete: transform tree stump, enqueue respawn
```

Combat swing:

```ts
Soft/normal combat timer:
  every weaponSpeed ticks:
    if target valid
    face target
    play attack animation
    enqueue delayed hit
```

Home teleport:

```ts
Weak action:
  delay 17 ticks
  cancelled by combat or movement
  on complete: teleport
```

---

## 11. Movement and pathfinding

### 11.1 Movement model

Adopt:

```ts
walk = 1 tile per tick
run = 2 tiles per tick
```

This is community-documented for RuneScape/OSRS-like movement. ([RuneScape Wiki][2])

Movement state:

```ts
type MovementComponent = {
  mode: "walk" | "run";
  path: TileCoord[];
  destination?: TileCoord;
  lastStepDirection?: Direction;
  blockedUntilTick?: Tick;
};
```

### 11.2 Input

Client sends destination tile. Server:

1. validates destination in range
2. computes path from current true tile
3. stores path queue
4. starts movement next tick

### 11.3 Pathfinding algorithm

For POC:

* A* on grid
* Chebyshev heuristic for 8-way movement
* collision bitmask checks
* max path length cap, e.g. 64 tiles
* if destination unreachable, path to nearest reachable adjacent tile

For OSRS feel:

* prefer straight cardinal/diagonal simplification
* avoid “smart” modern navmesh behavior
* allow clicking interactable object/NPC to path to nearest interaction tile
* large entities occupy rectangular footprints
* diagonal movement requires both relevant edge checks

### 11.4 True tile semantics

On each tick:

```ts
steps = mode === "run" ? 2 : 1;

for i in 0..steps:
  next = path.shift()
  if canStep(current, next):
    current = next
  else:
    clearPath()
    break
```

For “run skips middle true tile” behavior, model two-tile running as two validated substeps but expose only the final true tile for hazard checks unless the hazard explicitly checks traversed tiles. This preserves the OSRS-like distinction where some hazards care about true tile and some special hazards care about crossed tiles.

### 11.5 Path debug overlay

Build these debug toggles early:

* current true tile
* visual interpolated position
* queued path
* collision flags
* LoS ray
* NPC footprint
* interaction reach tiles

This will save weeks.

---

## 12. Interaction model

Every clickable thing has options.

```ts
type Interactable = {
  options: InteractionOption[];
};

/** Durable vocabulary:
 *  - label:    human-facing text (e.g. "Chop", "Mine", "Talk-to", "Attack")
 *  - actionId: engine/wire token, lowercase snake (e.g. "chop", "mine", "talk", "attack")
 *  - option:   a content/menu row containing label, actionId, priority, distance rules
 */
type InteractionOption = {
  label: string;          // "Chop", "Mine", "Talk-to", "Attack"
  priority: number;
  actionId: ActionId;     // "chop", "mine", "talk", "attack"
  requiredDistance: number;
  requiresLineOfSight?: boolean;
  faceTarget?: boolean;
};
```

### 12.1 Click resolution

Client sends:

```ts
{ entityId, actionId }
```

Server resolves:

1. entity exists
2. actionId exists in entity's options
3. player can interact
4. path to interaction tile if out of range
5. once in range, enqueue action

### 12.2 Interaction distance

Examples:

* talk: 1 tile
* melee attack: 1 tile, adjusted for footprints
* ranged attack: weapon range
* magic: spell range + LoS
* chop tree: adjacent
* mine rock: adjacent
* pick up item: same tile or adjacent depending design
* open door: adjacent

---

## 13. Combat system

### 13.1 Combat components

```ts
type CombatStats = {
  attack: number;
  strength: number;
  defence: number;
  ranged: number;
  magic: number;
  prayer: number;
  hitpoints: number;
};

type CombatBonuses = {
  stabAttack: number;
  slashAttack: number;
  crushAttack: number;
  magicAttack: number;
  rangedAttack: number;

  stabDefence: number;
  slashDefence: number;
  crushDefence: number;
  magicDefence: number;
  rangedDefence: number;

  meleeStrength: number;
  rangedStrength: number;
  magicDamage: number;
  prayer: number;
};

type Combatant = {
  currentHp: number;
  maxHp: number;
  target?: EntityId;
  autoRetaliate: boolean;
  attackCooldownTicks: number;
  lastAttackTick?: Tick;
  style: "stab" | "slash" | "crush" | "ranged" | "magic";
};
```

### 13.2 Weapon definition

```ts
type WeaponDef = {
  id: string;
  slot: "weapon";
  category: "melee" | "ranged" | "magic";
  family: string; // canonical family from docs/items/weapons/*
  tier?: string;
  tierOrder?: number;
  attackSpeedTicks: number;
  attackRangeTiles: number;
  allowedStyles: CombatStyle[];
  requiredSkill?: SkillRequirement[];
  bonuses: Partial<CombatBonuses>;
  projectileId?: string;
  specialAttackId?: string;
};
```

Attack speed should be an integer tick interval. OSRS attack speed is documented as hit intervals measured in 0.6s ticks. ([Old School RuneScape Wiki][15])

### 13.3 Combat level

Use OSRS-like formula as inspiration but rename/adjust for Old Town if desired.

Classic OSRS formula:

```ts
base = 0.25 * (defence + hitpoints + floor(prayer / 2))
melee = 0.325 * (attack + strength)
range = 0.325 * (floor(ranged / 2) + ranged)
mage = 0.325 * (floor(magic / 2) + magic)
combatLevel = floor(base + max(melee, range, mage))
```

This formula is documented by OSRS Wiki mirrors/community calculators. ([Old School RuneScape Wiki][16])

For Old Town, consider:

```ts
Guard = defence + vitality + floor(focus / 2)
MeleePower = accuracy + might
RangedPower = floor(marksmanship / 2) + marksmanship
MysticPower = floor(mystic / 2) + mystic
```

Same shape, original names.

### 13.4 Hit chance

Use an attack-roll vs defence-roll model:

```ts
attackRoll = effectiveAttackLevel * (attackBonus + 64)
defenceRoll = effectiveDefenceLevel * (defenceBonus + 64)
```

A common OSRS mechanics explanation uses this `E * (B + 64)` roll shape for attack/defence rolls. ([OSRS Tips and Tricks][17])

Then:

```ts
if attackRoll > defenceRoll:
  hitChance = 1 - (defenceRoll + 2) / (2 * (attackRoll + 1))
else:
  hitChance = attackRoll / (2 * (defenceRoll + 1))
```

This gives an OSRS-like curve.

### 13.5 Damage

For POC:

```ts
if random() < hitChance:
  damage = randomInt(0, maxHit)
else:
  damage = 0
```

Yes, allow successful hits to roll 0 unless you intentionally want modern readability. OSRS historically allows zero-damage hits as part of its feel.

### 13.6 Delayed hits

Melee:

* attack animation tick N
* damage tick N or N+1 depending weapon/content

Ranged/magic:

* attack/cast tick N
* projectile spawned
* damage applied after travel delay

```ts
type PendingHit = {
  source: EntityId;
  target: EntityId;
  applyTick: Tick;
  style: CombatStyle;
  maxHit: number;
  attackRoll: number;
  defenceRoll: number;
};
```

### 13.7 Combat loop

```ts
function processCombatant(eid: EntityId) {
  const c = Combatant[eid];
  if (!c.target) return;

  const target = getEntity(c.target);
  if (!target || target.dead) return clearTarget(eid);

  if (!canAttack(eid, target)) {
    maybePathTowardTarget(eid, target);
    return;
  }

  if (tick < c.nextAttackTick) return;

  faceEntity(eid, target.id);
  playAnimation(eid, getAttackAnimation(eid));

  const hitDelay = getHitDelay(eid, target);
  enqueuePendingHit(eid, target.id, tick + hitDelay);

  c.nextAttackTick = tick + getWeaponSpeed(eid);
}
```

### 13.8 Prayer / buffs

Model buffs as modifiers with expiry ticks:

```ts
type Modifier = {
  stat: "attack" | "strength" | "defence" | "ranged" | "magic";
  mode: "add" | "multiply";
  value: number;
  expiresAtTick?: Tick;
  source: "potion" | "prayer" | "equipment" | "quest" | "area";
};
```

Prayer drains every N ticks based on active prayers and prayer bonus.

### 13.9 Food and potions

Food is an item action:

```ts
EatFood:
  interrupts combat attack timer? configurable
  heals HP immediately on tick processed
  applies eat delay
  consumes item
```

Define exact priority against pending hits. This is where OSRS-like “tick eating” style behavior can emerge if you process healing before or after delayed hit application. Pick one and document it. Do not leave it accidental.

---

## 14. NPC system

### 14.1 NPC definition

```ts
type NpcDef = {
  id: string;
  name: string;
  size: 1 | 2 | 3 | 4;
  combatLevel?: number;
  stats?: CombatStats;
  bonuses?: CombatBonuses;
  attackSpeedTicks?: number;
  attackRangeTiles?: number;
  aggressiveRadius?: number;
  wanderRadius?: number;
  respawnTicks: number;
  drops: DropTableId;
  options: InteractionOption[];
  animations: AnimationSetId;
};
```

RuneLite’s NPC composition exposes useful concepts to mirror, including NPC size, combat level, minimap visibility, transforms, and follower status. ([static.runelite.net][18])

### 14.2 NPC AI states

```ts
enum NpcState {
  Idle,
  Wander,
  Aggro,
  Chase,
  Attack,
  ReturnHome,
  Dead,
  Respawning,
}
```

### 14.3 NPC rules

* spawn at home tile
* wander within radius
* aggressive NPC checks players every N ticks
* chase until leash distance exceeded
* if target invalid, return home
* block movement based on footprint
* on death: clear occupancy, roll drops, enqueue respawn

---

## 15. Skills and XP

### 15.1 Skill list for POC

Start with:

Combat:

* Attack
* Strength
* Defence
* Hitpoints
* Ranged
* Magic
* Prayer

Gathering:

* Woodcutting
* Mining
* Fishing

Processing:

* Cooking
* Smithing
* Crafting

Utility:

* Thieving or Agility later

Do not ship 20+ skills in the first POC. Build the skill engine so adding skills is data work.

### 15.2 XP curve

Use the RuneScape-style exponential table shape. Public tables show level 2 at 83 XP, level 3 at 174 XP, level 92 as roughly halfway to 99, and level 99 at 13,034,431 XP. ([Old School RuneScape Wiki][19])

Formula:

```ts
function xpForLevel(level: number): number {
  let points = 0;
  for (let lvl = 1; lvl < level; lvl++) {
    points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
  }
  return Math.floor(points / 4);
}
```

This formula is widely used in RuneScape private-server/community implementations. ([Rune-Server][20])

### 15.3 Skill definition

```ts
type SkillDef = {
  id: SkillId;
  name: string;
  maxLevel: number;
  xpTableId: "oldtown_default";
  unlocks: SkillUnlock[];
};
```

### 15.4 Skilling action definition

```ts
type ResourceNodeDef = {
  id: string;
  name: string;
  skill: "woodcutting" | "mining" | "fishing";
  requiredLevel: number;
  baseXp: number;
  actionTicks: number;
  depletionChance: number;
  respawnTicks: number;
  toolTags: string[];
  outputItemId: string;
};
```

### 15.5 Success formula

For POC:

```ts
successChance =
  clamp(
    baseChance
    + playerLevel * levelScale
    + toolPower * toolScale
    - nodeDifficulty,
    minChance,
    maxChance
  )
```

Example:

```ts
oak_tree:
  requiredLevel: 15
  actionTicks: 4
  baseXp: 37.5
  baseChance: 0.18
  levelScale: 0.006
  depletionChance: 0.125
```

### 15.6 Gathering loop

```ts
function processGathering(player, node) {
  if (!isAdjacent(player.tile, node.tile)) return stop();
  if (!hasRequiredTool(player, node)) return message("You need an axe.");
  if (skillLevel(player, node.skill) < node.requiredLevel) return message("You need level 15.");

  if (roll(successChance(player, node))) {
    addItem(player, node.outputItemId, 1);
    addXp(player, node.skill, node.baseXp);
    playAnimation(player, "chop_success");

    if (roll(node.depletionChance)) {
      depleteNode(node);
      enqueueRespawn(node, node.respawnTicks);
      stop();
    }
  } else {
    playAnimation(player, "chop_attempt");
  }

  requeueSameAction(node.actionTicks);
}
```

---

## 16. Items, inventory, equipment

### 16.1 Item definition

```ts
type ItemDef = {
  id: string;
  name: string;
  stackable: boolean;
  tradeable: boolean;
  examine: string;
  icon: AssetId;
  model?: AssetId;
  value: number;
  weight?: number;
  tier?: string;
  tierOrder?: number;
  family?: string;
  category?: "melee" | "ranged" | "magic";
  visualIdentity?: Record<string, string>;
  options: ItemOption[];
  equipment?: EquipmentDef;
  consumable?: ConsumableDef;
};
```

### 16.2 Inventory

Classic-inspired inventory:

```ts
INVENTORY_SIZE = 28
```

```ts
type InventorySlot = {
  itemId: string;
  quantity: number;
  uid?: string; // for unstackable unique items if needed
};
```

### 16.3 Equipment slots

```ts
enum EquipmentSlot {
  Head,
  Cape,
  Neck,
  Weapon,
  Body,
  Shield,
  Legs,
  Hands,
  Feet,
  Ring,
  Ammo,
}
```

### 16.4 Equipment stat aggregation

On equipment change:

```ts
player.combatBonuses = sum(base + all equipped item bonuses)
player.appearanceHash = hash(equipment + bodyStyle + colors)
markUpdate(APPEARANCE | EQUIPMENT)
```

Do not recalculate every tick.

---

## 17. Magic system

### 17.1 Spell definition

```ts
type SpellDef = {
  id: string;
  name: string;
  spellbook: "common" | "old_ways" | "wild" | "ritual";
  requiredMagic: number;
  beadCosts: ItemQuantity[];
  castXp: number;
  maxHit?: number;
  rangeTiles: number;
  targetType: "self" | "entity" | "tile" | "item";
  requiresLineOfSight: boolean;
  cooldownTicks?: number;
  effect: SpellEffect;
};
```

Old Town magic keeps the familiar combat/teleport/enchant/utility spell shape, but the consumable resource is **beads**, not runes. Bead names, pouch rules, and magic gear tiers are defined in `docs/magic-tiers.md` and `docs/items/misc/bead-pouches.md`.

### 17.2 Spell categories for POC

* strike spell: low damage projectile
* bind/snare: movement block for N ticks
* home teleport: delayed interruptible teleport
* item enchant: transforms item
* alchemy: converts item to coins

### 17.3 Bead costs

```ts
function canCast(player, spell) {
  return level >= spell.requiredMagic
    && inventoryHasAll(player, spell.beadCosts)
    && targetValid(player, spell);
}
```

---

## 18. Quest engine

### 18.1 Quest design rule

Quests are not hardcoded classes. They are:

* requirements
* variables
* dialogue graph
* objectives
* triggers
* rewards
* area/object/NPC hooks

RuneScape quests are task/story series with requirements and rewards such as money, unique items, access, quest points, and skill XP. ([Wikipedia][22])

### 18.2 Varbits / varps

Use a generic player variable system:

```ts
type PlayerVar = {
  key: string;
  value: number | boolean | string;
};
```

Examples:

```ts
quest.goblin_problem.stage = 0
quest.goblin_problem.spoke_to_mayor = false
quest.goblin_problem.goblin_ears = 0
```

### 18.3 Quest definition

```ts
type QuestDef = {
  id: string;
  name: string;
  questPoints: number;
  requirements: Requirement[];
  stages: QuestStage[];
  rewards: Reward[];
};
```

```ts
type QuestStage = {
  stage: number;
  journalText: string;
  objectives: Objective[];
  triggers: Trigger[];
};
```

### 18.4 Dialogue graph

```ts
type DialogueNode = {
  id: string;
  npcText?: string;
  playerOptions?: {
    text: string;
    next: string;
    requirements?: Requirement[];
    effects?: Effect[];
  }[];
  effects?: Effect[];
};
```

### 18.5 POC quest

**“Smoke Over Old Town”**

* Talk to baker.
* Gather 3 dry logs.
* Kill 2 cellar rats.
* Light the bakery oven.
* Receive bread, coins, Cooking XP, 1 Quest Point.
* Unlock bakery range.

This tests:

* dialogue
* inventory
* skilling
* combat kill counter
* object interaction
* quest var state
* rewards
* area unlock

---

## 19. Content system

### 19.1 File structure

```txt
content/
  items/
    weapons.json
    armour.json
    consumables.json
    resources.json
  npcs/
    townsfolk.json
    goblins.json
    animals.json
  objects/
    trees.json
    rocks.json
    doors.json
    crafting.json
  skills/
    xp-table.json
    woodcutting.json
    mining.json
  spells/
    common-spellbook.json
  quests/
    smoke-over-old-town.json
  drops/
    goblin-drops.json
  maps/
    regions/
      0_0_0.json
      0_1_0.json
  dialogue/
    baker.json
    guard.json
```

### 19.2 Runtime registries

```ts
ItemRegistry
NpcRegistry
ObjectRegistry
SkillRegistry
SpellRegistry
QuestRegistry
DropTableRegistry
AnimationRegistry
MapRegistry
```

Load content once on server boot. Validate with Zod.

```ts
const ItemDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  stackable: z.boolean(),
  tradeable: z.boolean(),
  options: z.array(ItemOptionSchema),
});
```

### 19.3 Hot reload for dev

Add content hot reload early:

```bash
bun dev:server --watch-content
```

On content reload:

* validate all definitions
* print dependency errors
* do not mutate live world if invalid
* allow admin command `/reload content`

---

## 20. Persistence

### 20.1 Database tables

```sql
accounts
characters
character_skills
character_inventory
character_equipment
character_quest_vars
character_unlocked_content
character_bank
world_ground_items
audit_item_transactions
```

### 20.2 Persistence rules

Persist immediately:

* item gain/loss
* trade
* bank
* quest completion
* level up
* death
* logout

Persist lazily:

* position every N seconds
* HP/prayer every N seconds
* transient buffs

Use an item transaction audit table from day one.

```sql
audit_item_transactions(
  id bigserial primary key,
  tick bigint not null,
  character_id uuid not null,
  item_id text not null,
  quantity integer not null,
  reason text not null,
  before_quantity integer,
  after_quantity integer,
  metadata jsonb
)
```

This catches dupes.

---

## 21. Economy and drops

### 21.1 Drop table

```ts
type DropTable = {
  id: string;
  rolls: number;
  entries: DropEntry[];
};

type DropEntry = {
  itemId: string;
  quantity: Range;
  weight: number;
  requirements?: Requirement[];
};
```

### 21.2 Drop ownership

For POC:

* killer gets private drop visibility for 60 ticks
* then public
* ironman modes later

### 21.3 Ground item entity

```ts
type GroundItem = {
  itemId: string;
  quantity: number;
  tile: TileCoord;
  ownerCharacterId?: string;
  privateUntilTick?: Tick;
  despawnAtTick: Tick;
};
```

---

## 22. UI system

### 22.1 Must-have POC panels

* inventory
* equipment
* skills
* spellbook
* prayer/buffs
* chat
* minimap
* quest journal
* dialogue box
* right-click menu
* XP drops
* hitsplats
* debug overlay

### 22.2 Right-click menu

Everything should support multiple options:

```ts
Walk here
Examine
Attack Goblin
Talk-to Baker
Chop Twisted Pine
Use Pennywrought axe -> Tree
Cast Ember Flick -> Goblin
```

Do not overmodernize this. The menu is part of the genre.

### 22.3 Minimap

POC minimap:

* top-down orthographic render texture or canvas draw
* player dot
* NPC dots
* object markers
* path destination
* cardinal direction
* click-to-move support

---

## 23. Asset pipeline

### 23.1 Formats

* models: `.glb`
* textures: small PNG/WebP
* icons: pixel-art PNG/WebP
* maps: JSON + optional binary packed tile data
* animations: embedded GLB clips or external JSON
* audio: OGG/WebM

### 23.2 Art constraints

* character model under 1,500 triangles
* NPC under 1,500 triangles
* common object under 500 triangles
* tree/rock variants instanced
* 64×64 or 128×128 item icons
* low-res textures with nearest or controlled filtering
* no photoreal PBR dependency

### 23.3 Originality rules

Do not import OSRS cache assets. OpenRS2 archives caches, clients, and keys for preservation/research, but the official OSRS site still identifies the game/site contents as Jagex copyright. ([archive.openrs2.org][5])

Acceptable:

* original low-poly models
* original item silhouettes
* original skill names or sufficiently distinct naming
* original map
* original NPCs
* original quests
* original UI art inspired by retro fantasy panels

Avoid:

* Lumbridge/Varrock/Falador analogues by name/layout
* rune scimitar / abyssal whip equivalents by name/look
* OSRS item icons
* OSRS cache formats as runtime dependency
* 317 protocol/client compatibility
* copied quest structures/dialogue

---

## 24. World editor

Build an editor sooner than expected.

### 24.1 Editor features

* tile paint
* height paint
* collision paint
* object placement
* NPC spawn placement
* region boundary view
* chunk boundary view
* path test
* LoS test
* quest trigger placement
* export region JSON

### 24.2 Editor data

```ts
type RegionMapDef = {
  region: { rx: number; ry: number; plane: number };
  tiles: PackedTileData;
  objects: PlacedObjectDef[];
  npcSpawns: NpcSpawnDef[];
  groundItemSpawns: GroundItemSpawnDef[];
  triggers: AreaTriggerDef[];
};
```

### 24.3 Do not hand-code maps

Hand-coded maps will kill this project. Make the editor good enough for fast content creation.

---

## 25. Minimal POC architecture

```txt
apps/
  client/
    src/
      main.ts
      game/
        renderer/
        scene/
        input/
        net/
        ui/
        assets/
        debug/
  server/
    src/
      index.ts
      net/
      world/
      simulation/
      ecs/
      systems/
      content/
      persistence/
packages/
  shared/
    src/
      protocol/
      types/
      math/
      content-schemas/
      content/
        content-registry.ts
        content-references.ts
content/
scripts/
tools/
  world-editor/
  content-validator/
```

### 25.1 Server systems

```txt
sim/
  simulation-kernel.ts
  tick-loop.ts
  command-buffer.ts
  delta-accumulator.ts
  action-queue.ts
  action-runtime.ts
  action-executor.ts
  intent-dispatcher.ts

net/
  interest-manager.ts
  delta-broadcaster.ts
  command-router.ts
  websocket-transport.ts
  dev-session.ts
  entity-spawn-projector.ts

ecs/
  world.ts
  components.ts
  entity.ts

systems/
  movement-system.ts
  chat-system.ts
  interaction-reach.ts
  consumable-system.ts
```

### 25.2 Client systems

```txt
renderer/
  ThreeRenderer.ts
  CameraController.ts
  TerrainRenderer.ts
  ObjectRenderer.ts
  ActorRenderer.ts
  ProjectileRenderer.ts
  GroundItemRenderer.ts

input/
  MousePicker.ts
  TilePicker.ts
  ContextMenu.ts
  InputInterpreter.ts

net/
  GameSocket.ts
  ClientCommandDispatcher.ts
  ClientPacketApplier.ts

ui/
  InventoryPanel.tsx
  EquipmentPanel.tsx
  SkillsPanel.tsx
  SpellbookPanel.tsx
  QuestJournal.tsx
  ChatBox.tsx
```

---

## 26. POC milestone plan

### Milestone 1: Offline scene

Goal: prove the visual target.

* Three.js scene
* orthographic camera
* 32×32 tile village
* terrain tiles
* few trees/rocks/buildings
* click tile highlight
* debug grid
* player model interpolating between tiles

Done when: you can click around and it feels like a low-fi MMO scene.

### Milestone 2: Authoritative movement server

* WebSocket connection
* server tick at 600ms
* client sends move intent
* server computes path
* server sends tick deltas
* client interpolates
* true tile debug overlay

Done when: two browser tabs see each other move correctly.

### Milestone 3: Collision and interactions

* collision map
* object definitions
* doors/trees/rocks
* object click options
* path to interaction tile
* action queue foundation

Done when: you can click a tree, walk to it, face it, and start a queued action.

### Milestone 4: Inventory and skilling

* 28-slot inventory
* item registry
* axe item
* tree resource node
* woodcutting action
* XP/levels
* resource depletion/respawn

Done when: chopping trees gives logs and XP over repeated tick actions.

### Milestone 5: Combat

* NPC goblin spawn
* attack option
* melee distance
* weapon speed
* attack/defence rolls
* hitsplats
* death/respawn
* drop table

Done when: player can kill goblin, take drop, gain combat XP.

### Milestone 6: Magic and ranged

* spellbook panel
* bead item costs
* projectile graphics
* delayed hit
* LoS check

Done when: player can cast a basic spell if beads/level/LoS are valid.

### Milestone 7: Quest

* dialogue graph
* quest vars
* quest journal
* rewards
* object/NPC/kill triggers

Done when: “Smoke Over Old Town” can be completed end-to-end.

### Milestone 8: Persistence

* accountless dev character first
* then real character save/load
* inventory/equipment/skills/quest vars
* item transaction audit

Done when: refresh/logout preserves progress.

---

## 27. Acceptance tests

### Movement tests

* cannot walk through full block
* cannot diagonally clip around blocked corner
* run moves 2 tiles/tick
* walk moves 1 tile/tick
* path cancels when new destination clicked
* object interaction paths to valid adjacent tile
* large NPC footprint blocks correctly
* bridge/plane rules work in at least one test area

### Combat tests

* attack speed intervals are exact
* cannot melee outside range
* ranged/magic require LoS if configured
* target death clears combat
* drops spawn on correct tile
* XP awarded once
* weapon swap updates attack speed/bonuses
* food consumes item and heals on defined tick phase

### Skilling tests

* wrong tool fails
* low level fails
* valid action repeats
* movement interrupts weak skilling action
* depleted node respawns
* inventory full stops reward

### Quest tests

* requirement blocks start
* dialogue choices set vars
* kill counter increments
* item hand-in removes items
* quest completion cannot double-reward
* quest journal updates by stage

### Networking tests

* malformed command rejected
* out-of-range interaction rejected
* client cannot grant item
* client cannot teleport
* client cannot attack dead NPC
* duplicate command id ignored

---

## 28. “Alpha” implementation notes

### 28.1 Build the debug tools before content

The game lives or dies by invisible state:

* true tile
* path queue
* collision
* LoS
* action queue
* combat timer
* pending hits
* NPC leash/home
* varbits

A beautiful scene without these overlays will become unmaintainable.

### 28.2 Avoid async gameplay scripts

Do not write:

```ts
await sleep(2400)
giveLog()
```

Write:

```ts
enqueueAction({ delayTicks: 4, effect: "woodcutting_roll" })
```

All gameplay time must be tick time.

### 28.3 Never let “animation complete” drive gameplay

Bad:

```ts
onAnimationEnd(() => applyDamage())
```

Good:

```ts
enqueuePendingHit({ applyTick: tick + hitDelay })
playAnimation("attack")
```

Animations visualize outcomes. They do not cause outcomes.

### 28.4 Use content scripts, but constrain them

Do not let arbitrary quest scripts mutate everything.

Use effects:

```ts
Effect =
  | AddItem
  | RemoveItem
  | AddXp
  | SetVar
  | StartQuest
  | CompleteQuest
  | Teleport
  | SpawnNpc
  | TransformObject
  | SendMessage
```

This keeps content powerful but inspectable.

### 28.5 Separate object ID from instance ID

Definition ID:

```ts
objectDefId = "twisted_pine"
```

Instance ID:

```ts
entityId = "obj_01HR..."
```

Placed object:

```ts
{
  entityId,
  objectDefId,
  tile,
  rotation,
  state
}
```

This avoids the classic trap where static content IDs, runtime entities, and save IDs blur together.

### 28.6 Build for sharding

Even in POC, design world processes as if later you will have:

```txt
login-server
world-router
world-1
world-2
chat-server
persistence-worker
```

For now, run one process. But keep boundaries clean.

---

## 29. Final POC scope

The smallest impressive POC:

**Map**

* 64×64 town outskirts
* 1 plane
* 8 chunks × 8 chunks
* 1 village square
* 1 forest patch
* 1 mine
* 1 cellar/cave

**Skills**

* Attack
* Strength
* Defence
* Hitpoints
* Magic
* Woodcutting
* Mining
* Cooking

**Items**

* 3 weapons
* 3 armours
* 2 foods
* 2 logs
* 2 ores
* 2 beads
* 1 spell staff
* coins

**NPCs**

* baker
* guard
* goblin
* rat
* miner
* woodsman

**Objects**

* trees
* rocks
* furnace/range
* doors
* chest
* quest oven

**Quest**

* one full quest

**Multiplayer**

* see other players
* chat
* movement
* combat visibility
* ground drops private/public

That is enough to prove the whole engine.

---

## 30. Build mantra

Old Town should not just be a “Three.js RuneScape.”, although we will be close to this.

It is more accurate to say instead that it should be:

> A server-authoritative, tile-based, tick-rhythm MMO engine with a retro low-poly client, content-defined world, deterministic queues, extensible skills, and quest scripting - a new, charming MMORPG in the same stylistic take as OSRS / Runescape.

The technical soul is:

```txt
integer tiles
600ms ticks
queued actions
bitmask collision
delta updates
content registries
server truth
client interpolation
```

## Resources
[1]: https://runescape.fandom.com/wiki/Game_tick?utm_source=chatgpt.com "Game tick | RuneScape Wiki | Fandom"
[2]: https://runescape.fandom.com/wiki/Game_tick/Ticks_per_action?utm_source=chatgpt.com "Game tick/Ticks per action | RuneScape Wiki | Fandom"
[3]: https://github.com/runelite/runelite/blob/master/runelite-api/src/main/java/net/runelite/api/Constants.java?utm_source=chatgpt.com "Constants.java"
[4]: https://static.runelite.net/runelite-api/apidocs/net/runelite/api/CollisionDataFlag.html "CollisionDataFlag (RuneLite API 1.12.27 API)"
[5]: https://archive.openrs2.org/ "OpenRS2 Archive"
[6]: https://osrs-docs.com/docs/packets/outgoing/updating/update-masks "Update Masks"
[7]: https://osrs-docs.com/docs/mechanics/queues/ "Queues"
[8]: https://www.runescape.com/game-guide/skills "Skills - RuneScape"
[9]: https://oldschool.runescape.com/ "Old School RuneScape - Play Old School RS"
[10]: https://threejs.org/docs/ "three.js docs"
[11]: https://docs.colyseus.io/state "State Synchronization – Colyseus"
[12]: https://docs.colyseus.io/server/transport/uwebsockets "uWebSockets.js – Colyseus"
[13]: https://bitecs.dev/ "bitECS - Flexible, Minimal, Data-Oriented ECS"
[14]: https://www.gamesradar.com/games/mmo/old-school-runescape-is-so-old-and-so-big-that-the-devs-are-about-to-run-out-of-a-key-tech-resource-and-have-to-do-a-bunch-of-work-to-stop-the-game-exploding-soon/?utm_source=chatgpt.com "Old School RuneScape is so old and so big that the devs are about \"to run out of\" a key tech resource and have to do \"a bunch of work to stop the game exploding soon\""
[15]: https://oldschoolrunescape.fandom.com/wiki/Attack_speed?utm_source=chatgpt.com "Attack speed | Old School RuneScape Wiki | Fandom"
[16]: https://oldschoolrunescape.fandom.com/wiki/Combat_level?utm_source=chatgpt.com "Combat level | Old School RuneScape Wiki - Fandom"
[17]: https://www.theoatrix.net/post/how-defence-works-in-osrs?utm_source=chatgpt.com "How Defence Works in OSRS"
[18]: https://static.runelite.net/runelite-api/apidocs/net/runelite/api/NPCComposition.html?utm_source=chatgpt.com "NPCComposition (RuneLite API 1.12.26.3 API)"
[19]: https://oldschoolrunescape.fandom.com/wiki/Experience?utm_source=chatgpt.com "Experience - Old School RuneScape Wiki - Fandom"
[20]: https://rune-server.org/threads/level-exp-formula.90065/?utm_source=chatgpt.com "Level EXP Formula"
[21]: https://oldschoolrunescape.fandom.com/wiki/Teleportation_spells?utm_source=chatgpt.com "Teleportation spells - Old School RuneScape Wiki - Fandom"
[22]: https://en.wikipedia.org/wiki/RuneScape?utm_source=chatgpt.com "RuneScape"
