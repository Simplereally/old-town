---
doc_type: authority
canonical_path: docs/bosses/lair-and-access-rules.md
parent_index: docs/bosses/00-index.md
root_index: docs/00-index.md
---

Parent: [Bosses Index](00-index.md)

Authority references:
- `docs/bosses/boss-system.md`
- `docs/bosses/boss-categories.md`
- `docs/bosses/starter-bosses.md`
- `docs/bosses/first-ring-bosses.md`
- `docs/bosses/second-ring-boss-seeds.md`
- `docs/areas/area-progression-system.md`
- `docs/areas/route-unlocks-and-gates.md`
- `docs/quests/quest-system.md`
- `docs/creatures/wardenry-contracts.md`

# Lair and Access Rules

This document defines how bosses are found, entered, and unlocked. Every boss has an access rule. The access rule tells the player how to reach the boss and what is required to fight it. The lair is the physical space where the boss lives. The access rule is the gate that opens the lair.

## Access Types

| Access Type | Description | Example |
|-------------|-------------|---------|
| **Open repeatable** | The boss is accessible after the first discovery. No quest or item required. | The Cellar King after 8 rat kills. |
| **Quest-unlocked** | A quest completion unlocks the boss. The boss may become repeatable after the quest. | Ashling in the Kiln after Smoke Over Old Town. |
| **Warden task boosted** | A Wardenry contract assigns the boss. The boss is accessible without the contract, but the contract adds drops. | Mudhook Grib. |
| **Skill-gated** | A minimum skill level is required to enter the lair or interact with the boss. | The Wrong Flower requires Favour 10. |
| **Item-gated** | A specific item is required to enter the lair or start the fight. | Candles for The Wrong Flower. |
| **Route-gated** | A mapped route to the area is required. The boss is in a remote area. | Lowgrave, Wardenbrook, Blackbar. |
| **Activity-linked** | Doing an activity improves access or adds a shortcut. | Old Kiln Watch improves Ashling access. |

## Access Rules

### Open Repeatable

- The boss is accessible after a simple condition: a number of kills, a discovery, or a first encounter.
- No quest or item is required after the first time.
- The boss is always available.
- Example: The Cellar King is accessible after 8 cellar rat kills or the quest Rats Under Tally's.

### Quest-Unlockable

- A quest completion unlocks the boss.
- The boss may become repeatable after the quest, or it may be a one-time fight.
- The quest is not mandatory for the boss if the boss is repeatable. The quest is the first unlock.
- Example: Ashling in the Kiln is unlocked by Smoke Over Old Town. The boss becomes repeatable after the quest.

### Warden Task Boosted

- A Wardenry contract assigns the boss.
- The boss is accessible without the contract. The contract adds drops, proof items, or boosted rewards.
- The contract does not change the boss mechanics.
- Example: Mudhook Grib is a Wardenry contract target. The boss is accessible without the contract.

### Skill-Gated

- A minimum skill level is required to enter the lair or interact with the boss.
- The skill is usually the skill that the boss teaches or connects to.
- The skill is not mandatory if the boss is accessible by another route (quest, item, etc.).
- Example: The Wrong Flower requires Favour 10. The skill is the connection to the boss.

### Item-Gated

- A specific item is required to enter the lair or start the fight.
- The item is usually a consumable, tool, or quest item.
- The item is consumed or used during the fight.
- Example: The Wrong Flower requires candles. The candles are used to weaken the boss.

### Route-Gated

- A mapped route to the area is required.
- The boss is in a remote area that is not accessible without the route.
- The route is unlocked by exploration, quest, or skill.
- Example: The Ferry Eel is in Wardenbrook, which requires the Wardenbrook route.

### Activity-Linked

- Doing an activity improves access or adds a shortcut.
- The activity is not mandatory for the boss. The activity helps.
- The activity may unlock a faster route, a better drop rate, or a reduced cost.
- Example: Old Kiln Watch improves Ashling in the Kiln access by unlocking a shortcut.

## Lair Rules

### Lair Definition

A lair is the physical space where the boss lives. It is a room, a cave, a clearing, or an arena. The lair has rules that define the encounter.

### Lair Rules

1. **Starter bosses must be recoverable and low punishment.** The lair is small and close to a safe area. The player can retreat easily.
2. **Area bosses should have nearby bank/shortcut friction, not instant farming.** The lair is in a remote area. The player must travel to reach it.
3. **Quest bosses may become repeatable if useful.** The lair is accessible after the quest. The boss is repeatable if the drop is useful.
4. **Wardenry can assign bosses but should not be mandatory.** The lair is accessible without Wardenry. The contract adds drops.
5. **Lairs must have visible thresholds.** The player knows they are entering the lair before the fight starts. The threshold is a door, a gate, a line, or a warning.
6. **Bosses should not wander into safe hubs.** The lair is in a dangerous area. The boss stays in the lair.

### Lair Types

| Lair Type | Description | Example |
|-----------|-------------|---------|
| **Room** | A small, enclosed space. The boss is in the center. | The Cellar King's ledger pile. |
| **Cave** | A natural underground space. The boss is in the back. | Kiln-Worm Noll Saw's tunnel. |
| **Clearing** | An open space in a forest or field. The boss is in the center. | Aunt Bracken's Stump. |
| **Arena** | A dedicated combat space with hazards and safe tiles. | The Cut Bell's quarry. |
| **Water edge** | A narrow strip of land next to water. The boss is in the water. | The Ferry Eel's dock. |
| **Tunnel** | A narrow passage with a boss at the end. | The Door That Bites' room. |
| **Rafters** | A high, open space with beams and ropes. | The Bell Bat Mother's nest. |

### Lair Thresholds

A threshold is the boundary between the safe area and the lair. The player knows they are crossing the threshold.

| Threshold Type | Description | Example |
|----------------|-------------|---------|
| **Door** | A physical door that opens into the lair. | The Door That Bites. |
| **Gate** | A gate or barrier that must be opened. | The Cut Bell's quarry gate. |
| **Line** | A visible line on the ground. | The Wrong Flower's candle line. |
| **Warning** | A sign or message that warns the player. | The Ferry Eel's dock warning. |
| **Sound** | A sound that indicates the boss is near. | The Cellar King's chewing. |
| **Light** | A change in lighting that indicates the lair. | The Bell Bat Mother's darkness. |

### Lair Shortcuts

Some lairs have shortcuts that unlock after the first visit or after a condition.

| Shortcut | Condition | Example |
|----------|-----------|---------|
| **Bank shortcut** | A faster route to the bank. | The Cut Bell's quarry elevator. |
| **Lair shortcut** | A faster route to the boss. | Old Kiln Watch unlocks Ashling shortcut. |
| **Escape route** | A faster escape from the lair. | The Wrong Flower's chapel tunnel. |
| **Rest point** | A safe spot inside the lair. | The Ferry Eel's dock rest point. |

## Boss Access Table

| Boss | Access Type | Primary Requirement | Secondary Requirement | Shortcut |
|------|-------------|---------------------|------------------------|----------|
| The Cellar King | Open repeatable | 8 rat kills or Rats Under Tally's | None | Sootcellar exit |
| Mudhook Grib | Quest + Warden | Mud on the North Road | Warden contract optional | North Quarry Road |
| Ashling in the Kiln | Quest + route | Smoke Over Old Town | Old Kiln route | Old Kiln Watch shortcut |
| The Bell Bat Mother | Quest + route | Bellwood Yard | Bellwood route | Lath Yard ladder |
| Old Snapper | Skill + route | Fishing 10 | Wardenbrook route | Fishery dock |
| The Wrong Flower | Quest + skill | Gravegate Flowers | Favour 10 | Lowgrave Chapel |
| Crowpost Jack | Route | Crowmile Road route | None | Road fork |
| Aunt Bracken's Stump | Skill | Woodcutting 20 | Bellwood quest | Woodcutting station |
| The Cut Bell | Skill + route | Mining 20 | Tinstone Cut route | Quarry elevator |
| Hidepeg Horror | Skill | Trapping 20 or Tailoring 20 | None | Tannery door |
| The Ferry Eel | Skill + route | Fishing 20 | Wardenbrook route | Ferry dock |
| Gravekeeper's Wrong Son | Quest + skill | Gravegate Flowers | Favour 20 | Grave Underways entrance |
| Kiln-Worm Noll Saw | Quest + skill | Smoke Over Old Town | Hearthcraft 20 | Old Kiln tunnel |
| The Door That Bites | Skill + quest | Sleight 20 | Keys That Open Nothing | Sootstairs door |

## Related Systems

- [`docs/areas/area-progression-system.md`](../areas/area-progression-system.md) — how area progression unlocks boss access
- [`docs/areas/route-unlocks-and-gates.md`](../areas/route-unlocks-and-gates.md) — how routes unlock boss areas
- [`docs/quests/quest-system.md`](../quests/quest-system.md) — how quests unlock bosses
- [`docs/creatures/wardenry-contracts.md`](../creatures/wardenry-contracts.md) — how Wardenry assigns bosses
- [`docs/ledger/charters-and-permits.md`](../ledger/charters-and-permits.md) — how deed tiers unlock boss access
