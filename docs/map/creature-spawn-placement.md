---
doc_type: authority
canonical_path: docs/map/creature-spawn-placement.md
parent_index: docs/map/00-index.md
root_index: docs/00-index.md
---

Parent: [`Map Index`](00-index.md)

Authority references:
- `docs/creatures/starter-creatures.md`
- `docs/creatures/creature-ecology.md`
- `docs/map/district-boundaries.md`
- `docs/map/collision-and-route-rules.md`
- `docs/spatial/monster-movement-and-leashing.md`
- `docs/spatial/spawn-density-and-pressure.md`
- `docs/spatial/safe-danger-gradient.md`

# Creature Spawn Placement

Creature spawns are zones, not single points. A spawn zone defines a bounding box where creatures may appear on a timer. Frequency controls how often the zone repopulates after clearing.

## Spawn Zone Table

| Creature | District | Spawn Zone (x, y range) | Frequency | Notes |
|----------|----------|------------------------|-----------|-------|
| Cellar Rat | Sootcellar | (28, 28) to (36, 36) | Common | Central cellar rooms. First combat target. |
| Soot Rat | Sootcellar | (28, 24) to (36, 28) | Uncommon | Deeper south rooms. Disease hint. |
| Stray Dog | Oldroad Gate | (8, 40) to (24, 56) | Common | Alleys and gate approaches. Pursuit and flee logic. |
| Stray Dog | Market Bell alley | (36, 36) to (40, 40) | Rare | Alley between Market Bell and Patch Lane. |
| Mud Goblin | North Quarry Road | (44, 76) to (52, 84) | Common | Quarry face and road. First humanoid enemy. |
| Bell Bat | Warden Steps edge | (68, 56) to (72, 60) | Uncommon | Roof edge and tower approach. Ranged target. |
| Bell Bat | Lath Yard edge | (56, 56) to (60, 60) | Rare | Bell tower shadow. Magic target. |
| Bog Fox | Patch Lane edge | (40, 24) to (44, 28) | Uncommon | South fields. Trapping crossover. |
| Grave Mite | Gravegate | (60, 12) to (68, 20) | Common | Crypt mounds and gate path. Creepy intro. |
| Grave Wisp | Gravegate edge | (56, 8) to (60, 16) | Uncommon | Gate threshold. Magic-resistant teaching enemy. |
| Grave Wisp | Shrine Hearth edge | (24, 40) to (28, 44) | Rare | Shrine boundary. Cleansing hint. |
| Ash Drake Whelp | Foundry Row edge | (68, 40) to (72, 44) | Rare | Old kiln approach. First drake tease. |
| Ash Drake Whelp | Sootcellar corner | (24, 24) to (28, 28) | Very rare | Hidden corner. Event spawn hint. |
| Blacksealed Cutpurse | Sootcellar entrance | (32, 32) to (36, 36) | Uncommon | Near cellar stairs. Sleight theme. |
| Blacksealed Cutpurse | Market Bell alley | (40, 36) to (44, 40) | Rare | Back alley. Stolen coin pouch hint. |
| Road Crow | Oldroad Gate | (8, 40) to (24, 56) | Common | Overlaps with Stray Dog zone. Low ranged bird. |
| River Snapper | River Stoop | (60, 24) to (68, 28) | Uncommon | River bank. Fishing and combat crossover. |

## Starter Combat Placement Rule

Starter combat must not block starter skilling. It should pressure better nodes, shortcuts, quest spaces, and deeper routes.

| Pressure Target | Creature | How It Applies Pressure |
|-----------------|----------|------------------------|
| Better mining nodes | Mud Goblin | Goblin zone sits between Foundry Row and North Quarry Road. Players must pass or fight to reach Tinstone. |
| Shortcuts | Grave Mite | Gravegate path connects River Stoop to Patch Lane through danger. Safe route is longer. |
| Quest spaces | Cellar Rat | Rats occupy Sootcellar where the Rat-chewed Ledger quest object sits. |
| Deeper routes | Soot Rat | Deeper Sootcellar rooms hide better loot and blacksealed hints. |
| Edge skilling | Bog Fox | Foxes patrol the south edge of Patch Lane where Rabbit Snare Points are dense. |
| Rare spawns | Ash Drake Whelp | Rare whelp near old kiln teases future content without blocking the forge loop. |

## Safe Zone Enforcement

| Safe District | Enforcement |
|---------------|-------------|
| Market Bell | No hostile spawn zones overlap. Event pests only. |
| Counting House | No hostile spawn zones overlap. |
| Warden Steps | No hostile spawn zones overlap. |

---

*Last updated: 2026-05-31*
