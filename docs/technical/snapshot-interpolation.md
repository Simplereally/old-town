# Snapshot Interpolation Contract

> **Authority:** This document is the exact contract for client snapshot buffering, playout timing, interpolation, hold/freeze/snap behaviour, and local-player feedback. E32-E35 may not change these rules without amending this document.

## 1. Three Clocks

Old Town uses three independent clocks. No clock may be derived from another.

| Clock | Name | Owner | Resolution | Purpose |
|-------|------|-------|------------|---------|
| 1 | Server tick clock | Server | `GAME_TICK_MS` (600 ms) | Advances gameplay state, runs physics, combat, and AI. |
| 2 | Client snapshot/playout clock | `SnapshotBuffer` | 1 tick | Determines which two snapshots bracket the current render time. |
| 3 | Browser RAF clock | `RenderClock` | 1 frame (~16 ms at 60 Hz) | Drives the display loop, capped by `requestAnimationFrame`. |

**Ban:** The client must never run an authoritative catch-up loop. If the RAF clock accumulates enough delta for two or more ticks, gameplay state does not advance on the client. The client simply renders the next interpolated frame from the same snapshot pair until the server sends a newer tick. This is a pure viewer, not a simulator.

## 2. Playout Timing

Remote entities render at `estimatedServerTimeMs - interpolationDelayMs`.

- `estimatedServerTimeMs` is maintained by the client using the last accepted snapshot's `serverTimeMs`, plus the elapsed wall time since that snapshot was accepted.
- `interpolationDelayMs` is the time the client stays behind the estimated server time to smooth over network jitter.
- Default `interpolationDelayMs` is `GAME_TICK_MS` (600 ms) until E35 metrics justify a different value.
- Minimum usable interpolation buffer is **two accepted snapshots**. The client must not begin interpolation until it has received and accepted at least two snapshots.

**Ban:** `interpolationDelayMs` must never be negative, zero, or derived from packet arrival time.

## 3. Packet Ordering and Acceptance

Packet ordering is determined by primary key `tick` and secondary key `sequence`.

Until the wire protocol carries `snapshotSequence`, `ClientPacketIngestor` must set `sequence = tick` and document that this is sufficient for one authoritative delta per server tick.

### Late Packet Policy

Late packets with `tick <= latestAcceptedTick` are **ignored** unless they are an explicit full-state reset.

A full-state reset packet:
- carries a flag `fullState: true`
- replaces the entire snapshot buffer
- evicts all older snapshots
- resets `latestAcceptedTick` to the packet's tick
- clears all interpolation state

**Ban:** Packet arrival timestamps (`performance.now()` at socket receipt) are **diagnostics only**. They may be recorded in debug histograms, but they must never produce render alpha, drive interpolation weight, or influence gameplay state.

## 4. Data Shapes

### 4.1 RenderSnapshot

```
RenderSnapshot {
  tick:             number   // server tick this snapshot represents
  sequence:         number   // monotonic sequence within this tick
  serverTimeMs:     number   // server wall time when this tick was computed
  entities:         RenderEntitySnapshot[]
  events:           RenderEvent[]
  regionLoads:      RegionLoad[]
  regionUnloads:    RegionUnload[]
  debug:            DebugSnapshot?
}
```

### 4.2 RenderEntitySnapshot

```
RenderEntitySnapshot {
  entityId:          number
  kind:              'player' | 'npc' | 'creature' | 'projectile' | 'object' | 'groundItem'
  tile:              { x: number, y: number, z: number }
  previousTile:      { x: number, y: number, z: number } | null
  moveSpeed:         'walk' | 'run' | 'idle' | 'teleport'
  facing:            number   // degrees, 0 = north, 90 = east, etc.
  appearance:        AppearanceKey
  healthBar:         HealthBarSnapshot | null
  defId:             string   // canonical content definition ID
  presentationFlags: number?   // bitmask; optional; only present if non-zero
}
```

### 4.3 PresentationSample

```
PresentationSample {
  renderServerTimeMs: number   // the estimated server time we are rendering
  olderTick:          number   // tick of the older snapshot
  newerTick:          number   // tick of the newer snapshot
  alpha:              number   // 0.0 = fully older, 1.0 = fully newer
  mode:               PresentationMode
  snapReason:         string?   // human-readable reason when mode is 'snap'
}
```

### 4.4 PresentationMode

```
PresentationMode = 'interpolate' | 'hold_latest' | 'freeze' | 'snap' | 'empty'
```

| Mode | Meaning |
|------|---------|
| `interpolate` | Normal operation: two snapshots exist, `alpha` is valid, entity floats between `previousTile` and `tile`. |
| `hold_latest` | Only one snapshot exists; entity is rendered at the latest known tile with no movement. |
| `freeze` | Gap exceeded acceptable threshold; entity freezes at last known tile until recovery. |
| `snap` | Explicit teleport or recovery after freeze; entity snaps to authoritative tile without interpolation. |
| `empty` | No snapshots exist; entity is not rendered. |

## 5. Interpolation Policies

### 5.1 Walk

Walk interpolation is tile-center to tile-center over one tick.

- `previousTile` is the tile at tick `N-1`.
- `tile` is the tile at tick `N`.
- The entity is rendered at a fraction between the two tile-centres using `alpha`.
- The visual speed is exactly one tile per 600 ms unless the tick rate changes.

### 5.2 Run

Run interpolation is two tile steps per server tick when server data supports run.

Until the server sends `moveSpeed: 'run'` with tiles that are two steps apart, the client treats `moveSpeed: 'run'` as **visual-only** with no extra authoritative tile movement. The entity still interpolates between `previousTile` and `tile`; the visual difference may be two tiles but the server must still authorise both tiles.

### 5.3 Teleport

Teleport is **no interpolation**.

When `moveSpeed: 'teleport'` or the entity has no `previousTile`:
- Optional: hide, fade, or flash effect.
- Then snap to the authoritative `tile`.
- The `PresentationSample.mode` is `snap`.

### 5.4 Combat Lunge

Combat lunge is a **visual-only offset** that returns to the authoritative tile before the next authoritative sample.

- The lunge is a render offset (e.g., 0.3 tiles toward the target) applied during the attack frame window.
- It does not affect `previousTile` or `tile`.
- It is not stored in the snapshot buffer.
- It is authored by the render presentation layer, not the simulation.

### 5.5 Projectile Timing

Projectile timing is derived from `startTick` and `hitTick` in the snapshot, not from `performance.now()` at packet arrival.

- `startTick` is the tick the projectile was launched.
- `hitTick` is the tick the projectile is scheduled to hit.
- The render layer computes `alpha = (renderServerTimeMs - startTickMs) / (hitTickMs - startTickMs)`.
- Projectile position is interpolated along the arc or line from source tile to target tile using this alpha.

**Ban:** Projectile render position must never use packet arrival time.

### 5.6 Gap Handling

| Gap Length | Behaviour | Mode |
|-----------|-----------|------|
| 0-1 missing ticks | Hold latest snapshot; entity stays at last known tile. | `hold_latest` |
| 2-5 missing ticks | Freeze remote entity; stop interpolating. | `freeze` |
| 6+ missing ticks or full recovery | Snap to authoritative tile on next valid snapshot with visual cue. | `snap` |

A gap is measured in missing ticks between the newest accepted snapshot and the next received snapshot. If the client has not received a snapshot for `2 * interpolationDelayMs` (1200 ms default), it enters `freeze` for all remote entities.

## 6. Local Player Feedback

Local player feedback may show **click markers** and **planned path hints** immediately on input, but the local player's position remains **server-authoritative**.

- Click markers: appear on the ground tile the player clicked, drawn immediately by the UI layer.
- Path hints: a dotted or shaded line showing the planned path, drawn immediately by the UI layer.
- Local player avatar: rendered using the same snapshot interpolation as every other entity. No client-side prediction of position is permitted.

**Ban:** The local player must never be rendered at a client-predicted tile that differs from the last authoritative snapshot.

## 7. Encoding Decision

All snapshot packets for this graph are **JSON**.

Binary encoding is deferred until E35 metrics prove decode/ingest is the bottleneck. No module may assume binary framing, fixed-length records, or schema-versioned byte layouts.

## 8. Tick Delta to Render Snapshot

Tick deltas (the wire-format change list) become `RenderSnapshot` instances through a pure reduction function.

1. `ClientPacketIngestor` receives the delta packet.
2. It validates the tick, sequence, and checksum.
3. It applies the delta to a copy of the previous tick's entity map.
4. It produces a new `RenderSnapshot` with the full entity list.
5. It writes the snapshot to `SnapshotBuffer`.
6. At no point does this process mutate Three objects, scene graph, or camera state.

## 9. Test Requirements for E32

The following tests must be written in E32:

| Test | Scenario |
|------|----------|
| Out-of-order packets | A packet with `tick = 5` arrives after `tick = 6` is accepted; packet 5 is ignored. |
| Duplicate ticks | A packet with `tick = 5` and `sequence = 5` arrives twice; the second is ignored. |
| Missing successor | The client has ticks 1 and 2, but tick 3 never arrives; client holds tick 2 (`hold_latest`). |
| Background-tab long RAF pause | `requestAnimationFrame` pauses for 5 seconds; on resume, client does not catch up. It resumes from the latest snapshot pair. |
| Teleport | Entity moves from tile (10,10) to (50,50) in one tick; rendered as snap, no interpolation. |
| Local click marker | Player clicks tile (20,20); marker appears immediately, but avatar moves only when server snapshot confirms. |
| Projectile duration | Projectile `startTick = 10`, `hitTick = 14`; render alpha computed from snapshot times, not packet arrival. |

---

*Last updated: 2026-06-04*
