# ADR-002: Closed World API

## Status

Accepted

## Context

The ECS `World` was exposing `world.stores` and `world.entities` as public properties. Every system, network layer, test, and loader directly accessed `world.stores.position.get(entityId)` or `world.stores.combatant.set(entityId, component)`. This is the accidental API — it leaks the internal `Map` storage, makes future schema changes impossible without touching 25+ files, and prevents adding validation or instrumentation at the component boundary.

## Decision

1. **No public `stores` or `entities`.** The `World` interface exposes only:
   - `createEntity()`, `destroyEntity(id)`, `isAlive(id)`
   - `aliveEntityIds()`, `aliveEntityCount()`
   - `getComponent(entityId, kind)`, `setComponent(entityId, kind, component)`
   - `removeComponent(entityId, kind)`, `hasComponent(entityId, kind)`
   - `componentCount(kind)`, `entityIdsWith(kind)`, `componentEntries(kind)`

2. **Components stay plain data.** No methods on components. The `World` is the only place with behavior.

3. **Fixed typed component keys.** `WorldComponentKind` is a union of known keys (`position`, `movement`, `actor`, `player`, `npc`, `object`, `groundItem`, `inventory`, `equipment`, `skills`, `combatant`, `resourceNode`, `questVars`). No dynamic ECS registry yet.

4. **Validation in `setComponent`.** `setComponent` rejects dead entities and rejects `component.entityId !== entityId`. This catches the most common bug: creating a component with the wrong entityId.

5. **Deterministic iteration.** `entityIdsWith`, `componentEntries`, and `aliveEntityIds` return ascending `EntityId` order. This makes tests stable and replay deterministic.

6. **No `query(["position", "movement"])` yet.** Multi-component queries are deferred until two or more systems genuinely need them. The current single-component accessors are sufficient.

7. **Tests use the real `World` interface.** No `as any` or internal access. Tests call `world.setComponent` and `world.getComponent` like production code.

## Consequences

- 25 files were updated to remove `world.stores.*` access. The blast radius was large but mechanical.
- Future component additions require updating `WorldComponentMap` in `world.ts` and adding the new component table in `createWorld`. This is a single-file change.
- Future instrumentation (metrics, logging, replication) can be added at the `getComponent`/`setComponent` boundary without touching any system.
- `destroyEntity` remains the single place that removes all components. No system can accidentally leave a component behind.

## Related

- `POC_SPEC.md` §25 (Minimal POC architecture)
- `apps/server/src/ecs/world.ts`
- `apps/server/src/ecs/world.test.ts`
