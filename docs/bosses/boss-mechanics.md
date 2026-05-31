---
doc_type: authority
canonical_path: docs/bosses/boss-mechanics.md
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
- `docs/combat/signature-mechanics.md`
- `docs/combat/mechanics-implementation.md`
- `docs/activities/activity-system.md`

# Boss Mechanics

This document defines the OSRS-style mechanic primitives used in Old Town boss design. Boss mechanics are simple, readable, and teachable. They are not complex MMO raid rotations. A mechanic should be describable in one sentence and readable through low-fi sprites.

## Mechanic Primitives

| Mechanic | Meaning | Example |
|----------|---------|---------|
| **Add spawn** | The boss summons smaller enemies. | The Cellar King summons cellar rats. |
| **Safe tile** | The player must move to a specific tile to avoid damage. | Ashling in the Kiln's heat tiles. |
| **Interrupt** | The player must stop a boss action. | The Cellar King chews ledgers to heal. |
| **Shield phase** | The boss gains a shield that must be broken with a specific style or item. | Mudhook Grib's scrap shield. |
| **Enrage** | The boss becomes stronger if the player does the wrong thing. | The Wrong Flower enrages if fire is overused. |
| **Prep item** | A specific item (candle, bait, salve, bead, tool) helps the fight. | Tide beads for Ashling in the Kiln. |
| **Hazard pulse** | A timed floor or area danger that the player must avoid. | The Cut Bell's rolling crush. |
| **Style swap** | The boss encourages switching weapons or spells. | The Bell Bat Mother alternates roost and swoop. |
| **Resource object** | The boss interacts with an object in the room. | The Cut Bell's jam mechanism. |
| **Kill proof** | The boss drops a trophy or proof item. | The Cellar King's whisker. |

## Mechanic Rules

### Add Spawn

- Adds are smaller enemies that the boss summons.
- Adds must be manageable. The player can clear them or ignore them depending on the boss.
- Adds must not overwhelm. The number of adds is limited, and they are weaker than the boss.
- Adds must have a clear spawn trigger. The player knows when adds will appear.

### Safe Tile

- A safe tile is a specific tile or area where the player is safe from damage.
- Safe tiles must be visible. The player can see the safe area before the danger hits.
- Safe tiles must be reachable. The player can move to the safe tile in time.
- Safe tiles must not be random. The safe tile pattern is predictable.

### Interrupt

- An interrupt is a boss action that the player must stop.
- Interrupts must be visible. The player sees the boss preparing the action.
- Interrupts must be stoppable. The player has a window to stop the action.
- Interrupts must have a consequence. If the interrupt fails, the boss gains a benefit.

### Shield Phase

- A shield phase is a period where the boss is immune to most damage.
- The shield must have a specific weakness. A specific weapon, spell, or item breaks the shield.
- The shield must have a visible indicator. The player knows the shield is active.
- The shield must not last forever. The shield breaks after the weakness is applied or after a timer.

### Enrage

- Enrage is a state where the boss becomes stronger.
- Enrage must have a clear trigger. The player knows what caused the enrage.
- Enrage must be avoidable. The player can avoid the trigger.
- Enrage must be recoverable. The player can calm the boss or wait for the enrage to end.

### Prep Item

- A prep item is a specific item that helps the fight.
- Prep items must be accessible. The player can obtain the item before the fight.
- Prep items must be optional. The fight is possible without the item, but harder.
- Prep items must have a clear effect. The player knows what the item does.

### Hazard Pulse

- A hazard pulse is a timed danger that repeats.
- The pulse must have a warning. The player knows the pulse is coming.
- The pulse must be avoidable. The player can move to a safe tile or use a prep item.
- The pulse must not be instant. The player has time to react.

### Style Swap

- Style swap is a mechanic that encourages switching combat styles.
- The swap must have a clear trigger. The boss changes phase or position, and the player must adapt.
- The swap must be rewarding. The correct style deals more damage or avoids a penalty.
- The swap must not be mandatory. The fight is possible with one style, but harder.

### Resource Object

- A resource object is an object in the lair that the player or boss interacts with.
- The object must be visible. The player sees the object and knows its purpose.
- The object must be interactive. The player can click, use, or move the object.
- The object must have a clear effect. The player knows what the object does.

### Kill Proof

- A kill proof is a trophy or item that drops after defeating the boss.
- The proof must be unique. Only this boss drops this item.
- The proof must be memorable. The player remembers earning it.
- The proof must be narrow. It is not a best-in-slot item.

## Mechanic by Boss

| Boss | Primary Mechanic | Secondary Mechanic | Tertiary Mechanic |
|------|------------------|--------------------|-------------------|
| The Cellar King | Add spawn | Interrupt (heal) | Weakness (shortblade/cudgel) |
| Mudhook Grib | Shield phase | Movement debuff (mud) | Weakness (javelin/maul) |
| Ashling in the Kiln | Hazard pulse (heat) | Safe tile | Prep item (Tide beads) |
| The Bell Bat Mother | Style swap (roost/swoop) | Add spawn | Interrupt (sound pulse) |
| Old Snapper | Prep item (bait) | Safe tile | Style choice (melee/ranged/magic) |
| The Wrong Flower | Prep item (candles) | Enrage (fire) | Add spawn (mites) |
| Crowpost Jack | Add spawn (crows) | Interrupt (whistle) | Weakness (ranged) |
| Aunt Bracken's Stump | Shield phase (bark) | Movement debuff (roots) | Weakness (axe) |
| The Cut Bell | Hazard pulse (roll) | Resource object (jam) | Tool damage |
| Hidepeg Horror | Resistance (hide) | Prep item (trap) | Weakness (piercing/fire) |
| The Ferry Eel | Hazard pulse (electric) | Prep item (Tide beads) | Style choice (ranged/magic) |
| Gravekeeper's Wrong Son | Shield phase (lantern) | Prep item (cleanse) | Weakness (cleanse/fire) |
| Kiln-Worm Noll Saw | Hazard pulse (heat) | Resource object (segments) | Prep item (cold/Tide) |
| The Door That Bites | Shield phase (bite) | Prep item (Sleight) | Weakness (piercing/fire) |

## Mechanic Complexity Rules

1. **A mechanic must be describable in one sentence.** If it takes a paragraph, it is too complex.
2. **A mechanic must be readable through low-fi sprites.** The player sees the mechanic without reading a tooltip.
3. **A boss should have one primary mechanic.** Secondary mechanics are optional. Tertiary mechanics are rare.
4. **A mechanic must teach one thing.** The player learns a combat style, a skill, or a movement pattern.
5. **A mechanic must not require external knowledge.** The player discovers the mechanic in the fight.
6. **A mechanic must be avoidable or manageable.** The player can survive the mechanic with skill.
7. **A mechanic must not be a random one-shot.** The player must be able to predict and react.

## Banned Mechanics

| Banned Mechanic | Why It Is Banned | What To Use Instead |
|-----------------|------------------|---------------------|
| **Random one-shot** | Kills the player instantly with no warning. | Hazard pulse with a warning. |
| **Complex rotation** | Requires the player to memorize a long sequence. | One primary mechanic with a clear trigger. |
| **Multi-phase health bar** | The boss changes form at health thresholds. | One form with mechanics that escalate. |
| **Group-required mechanic** | Requires multiple players to execute. | Solo-viable mechanic. |
| **Invisible mechanic** | The player cannot see or predict the mechanic. | Visible mechanic with a warning. |
| **Permanent debuff** | The player is permanently weakened after the fight. | Temporary debuff that ends after the fight. |
| **Maze mechanic** | The player must navigate a maze during the fight. | Safe tile or hazard pulse. |
| **Time limit** | The player must kill the boss before a timer expires. | No time limit. The fight is about survival. |
| **DPS check** | The boss enrages if not killed fast enough. | No DPS check. The fight is about mechanics, not damage output. |
| **Inventory check** | The boss requires a specific inventory setup. | Prep item that is optional but helpful. |

## Related Systems

- [`docs/combat/signature-mechanics.md`](../combat/signature-mechanics.md) — how combat mechanics work
- [`docs/combat/mechanics-implementation.md`](../combat/mechanics-implementation.md) — how mechanics are implemented
- [`docs/activities/activity-system.md`](../activities/activity-system.md) — how activity mechanics overlap with boss mechanics
- [`docs/bosses/boss-balance-rules.md`](boss-balance-rules.md) — how mechanics are balanced
- [`docs/bosses/unique-drops-and-trophies.md`](unique-drops-and-trophies.md) — how mechanics connect to drops
