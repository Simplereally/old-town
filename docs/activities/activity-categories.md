---
doc_type: authority
canonical_path: docs/activities/activity-categories.md
parent_index: docs/activities/00-index.md
root_index: docs/00-index.md
---

Parent: [Activities Index](00-index.md)

Authority references:
- `docs/activities/activity-system.md`
- `docs/activities/starter-activities.md`
- `docs/activities/first-ring-activities.md`
- `docs/activities/skilling-bosses.md`
- `docs/activities/activity-rewards.md`
- `docs/activities/activity-balance-rules.md`

# Activity Categories

This document defines the eight activity categories used in Old Town. Every activity belongs to exactly one primary category. The category determines the loop structure, the risk level, the reward identity, and the player expectation.

## Category Definitions

| Category | Definition | Loop Structure | Risk Level | Reward Identity |
|----------|------------|----------------|------------|-----------------|
| **Skilling Activity** | Repeatable non-combat training method with a structured twist. | Skill actions in a specific sequence or with specific constraints. | Safe or risky. | XP, materials, tokens. |
| **Production Activity** | Turns inputs into outputs through a timed or staged process. | Gather inputs, process them at a station, collect outputs. | Safe. | XP, processed materials, tokens. |
| **Skilling Boss** | Dangerous repeatable encounter where primary actions are skill actions. | Skill actions under time pressure, with environmental hazards and failure states. | Dangerous. | XP, tokens, rare materials, cosmetics. |
| **Course** | Movement and route training loop with obstacles or timing. | Travel a route, use shortcuts, avoid obstacles, return to start. | Safe or risky. | XP, tokens, route familiarity, cosmetics. |
| **Public Work** | Shared town job where multiple players contribute to a common goal. | Simple actions that fill a shared progress bar or complete a shared task. | Safe. | Small coins, tokens, modest XP. |
| **Combat-lite Activity** | Low-risk combat with objectives that are not pure combat. | Fight weak creatures, protect objects, or clear areas while doing other tasks. | Risky. | XP, tokens, minor combat rewards. |
| **Risk Activity** | Better rewards with explicit failure or death risk. | Skill actions with a chance of failure, resource loss, or environmental damage. | Dangerous. | XP, tokens, rare materials, cosmetics. |
| **Puzzle Activity** | Repeatable object or logic challenge with a skill component. | Solve a puzzle, manipulate objects, or navigate a maze to reach a reward. | Safe or risky. | XP, tokens, puzzle-specific rewards. |

## Category Rules

### Skilling Activity

- Must train at least one non-combat skill.
- Must have a loop describable in three sentences.
- Must not require combat unless the activity is explicitly hybrid.
- Must not be a pure gathering loop. There must be a twist: a sequence, a constraint, or a choice.
- Examples: Graveflower Round, Bellwood Replant, River Basket, Patchfield Drive.

### Production Activity

- Must consume inputs and produce outputs.
- Must have a station or tool requirement.
- Must have a processing time or stage requirement.
- Must not be instant. The player must wait or take actions during processing.
- Must not be a pure crafting recipe. The activity is a loop, not a single craft.
- Examples: Foundry Shift, Kilnwatch Primer, Quarry Shift.

### Skilling Boss

- Must be dangerous. Failure has a cost: lost inputs, damaged tools, or death.
- Must use skill actions as the primary mechanic. Combat is secondary or absent.
- Must have environmental hazards that are avoidable with skill.
- Must have a failure state that ends the encounter.
- Must not require a group. Solo players must be able to complete the encounter.
- Must not drop combat gear. Rewards are materials, tokens, and cosmetics.
- Examples: Old Kiln Watch, Wardenbrook Tide, Lowgrave Vigil.

### Course

- Must be a route or movement loop.
- Must have obstacles, shortcuts, or timing elements.
- Must return to the start or end at a designated point.
- Must not be a simple walk. There must be a challenge: speed, precision, or avoidance.
- Must not be a teleport network. Courses are physical routes.
- Examples: Bell Run, Crowmile Relay.

### Public Work

- Must be a shared task that multiple players can contribute to.
- Must have modest rewards. Public work is not a primary income source.
- Must not have a failure state that punishes all participants.
- Must not require coordination. Players can contribute independently.
- Must be in a town or populated area.
- Examples: Market Rush, Ledger Sort, Soot Sweep.

### Combat-lite Activity

- Must have combat as a secondary mechanic.
- Must have a primary objective that is not killing creatures.
- Must be low-risk. Creatures are weak or avoidable.
- Must not be a combat training ground. Combat yards are separate.
- Must not drop combat gear. Rewards are skill-related.
- Examples: Soot Sweep.

### Risk Activity

- Must have explicit failure risk.
- Must offer better rewards than safe alternatives.
- Must have a failure state that costs time or resources, not permanent loss.
- Must not be a death trap. Failure is recoverable.
- Must not be the only source of a material. The material must be available elsewhere.
- Examples: Quarry Shift.

### Puzzle Activity

- Must have a logic or object manipulation component.
- Must be repeatable. The puzzle must reset or change between runs.
- Must have a skill component. Pure logic puzzles are not activities.
- Must not be a quest. The puzzle has no story completion state.
- Must not require external knowledge. The solution is discoverable in the game.
- Examples: Sootstairs Lockroom, Ledger Sort.

## Category Overlap

An activity can have secondary elements from other categories, but its primary category is the one that answers the question "what is the player doing most of the time?"

- **Soot Sweep** is primarily a Public Work (shared town cleaning) with Combat-lite elements (Grave Mites). Primary category: Public Work.
- **Ledger Sort** is primarily a Puzzle Activity (matching ledgers) with Skilling elements (Sleight, Cartography). Primary category: Puzzle Activity.
- **Quarry Shift** is a Risk Activity that uses production actions (ore cart delivery and smelting) under cave-in risk. Primary category: Risk Activity.
- **Sootstairs Lockroom** is primarily a Puzzle Activity (lockpicking) with Course elements (hidden routes). Primary category: Puzzle Activity.

## Category by Area

| Area | Skilling Activity | Production Activity | Skilling Boss | Course | Public Work | Combat-lite | Risk Activity | Puzzle Activity |
|------|-------------------|---------------------|---------------|--------|-------------|-------------|---------------|-----------------|
| Old Town | Graveflower Round, River Basket | Foundry Shift, Kilnwatch Primer | — | Bell Run | Market Rush, Ledger Sort, Soot Sweep | Soot Sweep | — | Ledger Sort |
| Foundry Row / Tinstone Cut | — | Quarry Shift | — | — | — | — | Quarry Shift | — |
| Bellwood Copse | Bellwood Replant | — | — | — | — | — | — | — |
| Patchfield | Patchfield Drive | — | — | — | — | — | — | — |
| Wardenbrook | — | — | Wardenbrook Tide | — | — | — | — | — |
| Lowgrave | — | — | Lowgrave Vigil | — | — | — | — | — |
| The Old Kiln | — | — | Old Kiln Watch | — | — | — | — | — |
| Sootstairs | — | — | — | — | — | — | — | Sootstairs Lockroom |
| Crowmile Road | — | — | — | Crowmile Relay | — | — | — | — |

## Banned Category Combinations

Some category combinations are banned because they create design problems:

| Combination | Why it is banned | What to use instead |
|-------------|------------------|---------------------|
| **Skilling Boss + Public Work** | A dangerous encounter with shared progress is unfair to solo players. | Make the skilling boss solo, or make the public work safe. |
| **Risk Activity + Course** | A route with death risk is frustrating, not challenging. | Make the course safe, or make the risk activity a skilling boss. |
| **Production Activity + Puzzle Activity** | Processing and puzzle-solving are incompatible loops. | Separate the production from the puzzle, or make one primary and the other a minor element. |
| **Combat-lite + Skilling Boss** | Combat-lite implies low risk. Skilling boss implies high risk. | Make the activity one or the other. |
| **Public Work + Risk Activity** | Shared tasks should not punish all participants for one player's failure. | Make the public work safe, or make the risk activity solo. |

## Category Quick Reference

| If the player... | Then the category is... |
|-------------------|------------------------|
| ...repeats skill actions with a twist. | Skilling Activity |
| ...processes inputs at a station. | Production Activity |
| ...faces dangerous hazards with skill actions. | Skilling Boss |
| ...runs a route with obstacles. | Course |
| ...contributes to a shared town task. | Public Work |
| ...fights weak creatures while doing other tasks. | Combat-lite Activity |
| ...takes risk for better rewards. | Risk Activity |
| ...solves a repeatable puzzle. | Puzzle Activity |
