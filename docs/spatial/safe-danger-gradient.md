---
doc_type: authority
canonical_path: docs/spatial/safe-danger-gradient.md
parent_index: docs/spatial/00-index.md
root_index: docs/00-index.md
---

Parent: [`Spatial Index`](00-index.md)

Authority references:
- `docs/map/collision-and-route-rules.md`
- `docs/map/creature-spawn-placement.md`
- `docs/map/old-town-starter-region.md`
- `docs/spatial/spatial-system.md`

# Safe-Danger Gradient

Old Town's emotional landscape is defined by a gradient from safe civic space to wild danger. The gradient is not just about creature presence. It is about how the space feels, what the player expects, and whether danger is readable before it arrives.

## Core Rule

**Danger should be readable before it damages the player.**

A player should never feel cheated by danger. Every threat must be preceded by a visible, audible, or spatial cue that a cautious player could notice.

## Zone Safety Table

| Zone | Feel | Districts | Danger Rule |
|------|------|-----------|-------------|
| **Safe Civic** | Calm, social, no threat | Market Bell, Counting House | No hostile spawns. Event pests only. |
| **Safe Craft** | Busy, productive, light life | Foundry Row, Lath Yard, Patch Lane, Chalkhouse Court | No aggressive creatures in district core. Edge spawns only. |
| **Soft Wild** | Open, atmospheric, optional | River Stoop, Oldroad Gate, Shrine Hearth | Passive or defensive edge spawns. Player chooses engagement. |
| **Local Trouble** | Tight, watchful, contained | Sootcellar entrance, Warden Steps alley | Light hostile density. Contained to rooms or alleys. |
| **Threshold Danger** | Gated, visible, escalated | Gravegate gate, Sootcellar deep, North Quarry Road face | Clear threshold before danger. Gate, stairs, or ground shift. |
| **Future Wild** | Unknown, expansion, tease | Beyond region boundaries | Not yet playable. Silhouettes and smoke hints only. |

## Readable Danger Markers

| Marker | How It Reads | Example |
|--------|--------------|---------|
| **Ground colour shift** | Bellstone to grave soil. You are entering different space. | Gravegate approach |
| **Broken fences** | Civilisation is failing here. Beyond is less safe. | Patch Lane south edge |
| **Warning signs** | Literal text or symbols. NPC or Warden notice. | Warden Steps board near Gravegate |
| **NPC barks** | Dialogue triggered on approach. "Mind the gate, traveller." | Warden near Gravegate threshold |
| **Lighting change** | Darker, redder, or flickering. Atmosphere shift. | Sootcellar descent |
| **Sound cue** | New ambient audio. Rat squeaks, bat wings, goblin chatter. | Sootcellar, Warden Steps roof |
| **Skeleton / ashes / gnawed props** | Something died here. Something lives here. | Gravegate crypt mounds, Sootcellar corners |
| **Warden notice** | Official warning posted on board or gate. | Warden Steps near danger zones |
| **Shrine boundary** | Candles, stones, or offerings mark a spiritual edge. | Shrine Hearth near Grave Wisps |
| **Gate silhouette** | Physical barrier that must be opened or walked around. | Gravegate iron gate |

## Gradient Design Principles

1. **Safe zones are social anchors.** Players relax, trade, and plan in safe civic space. Safe space is not boring. It is the contrast that makes danger meaningful.
2. **Soft wild is where players learn.** River Stoop and Oldroad Gate teach that not everything outside the walls is hostile. The player learns to read edge behaviour.
3. **Threshold danger is the teachable moment.** The gate, the stairs, the ground shift. The player chooses to cross. If they die, they knew the risk.
4. **Future wild creates longing.** Smoke on the horizon, a blocked road, a silhouette beyond the cliff. The player should want to go there.

## See also

- [`docs/map/collision-and-route-rules.md`](../map/collision-and-route-rules.md) — Route safety and collision
- [`docs/map/creature-spawn-placement.md`](../map/creature-spawn-placement.md) — Spawn zone coordinates
- [`docs/spatial/spatial-system.md`](spatial-system.md) — The 6 spatial layers

---

*Last updated: 2026-05-31*
