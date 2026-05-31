---
doc_type: authority
canonical_path: docs/activities/activity-system.md
parent_index: docs/activities/00-index.md
root_index: docs/00-index.md
---

Parent: [Activities Index](00-index.md)

Authority references:
- `docs/activities/activity-categories.md`
- `docs/activities/starter-activities.md`
- `docs/activities/first-ring-activities.md`
- `docs/activities/skilling-bosses.md`
- `docs/activities/activity-rewards.md`
- `docs/activities/activity-currencies.md`
- `docs/activities/activity-quest-hooks.md`
- `docs/activities/activity-balance-rules.md`
- `docs/skills/skill-system.md`
- `docs/quests/quest-system.md`
- `docs/guilds/guild-system.md`

# Activity System

This document is the authority for what an activity is, what it is not, and how it fits into Old Town. An activity is a repeatable gameplay loop. It is defined by what the player does, not by what the player earns. Rewards exist, but they are secondary. The loop itself is the point.

## Activity Definition

An activity is a location or method that makes a specific skill or set of skills more engaging, more structured, or more social than open-world training. It is defined by what you do there, not by who you are. There is no activity membership, no activity chat, no activity leaderboard, and no activity leader. The word "activity" is a player shorthand for "a repeatable thing I can do for XP and stuff."

An activity is not a quest. Quests have beginnings, middles, and ends. Activities have loops. A player can enter an activity, do the loop, leave, and return indefinitely. There is no story completion state.

An activity is not a minigame in the arcade sense. There is no score, no high score table, no timer counting down from 60 seconds. The loop is measured in actions, not in points.

An activity is not a guild. Guilds are places with permanent resources and NPCs. Activities are events, loops, or methods that happen at a place. A guild might host an activity, but the activity is not the guild.

## What an Activity Is

- **A place to train.** Activities give XP in one or more skills. The rate is calibrated in the balance rules.
- **A place to gather.** Activities produce resources, materials, or tokens that can be used elsewhere.
- **A place to socialise.** Groupable activities let multiple players work the same loop without requiring coordination.
- **A place to take risk.** Risk activities offer better rewards but include failure states that cost time or resources.
- **A place to master.** Some activities have high skill ceilings. The best players earn cosmetic rewards, not combat power.

## What an Activity Is Not

| Bad idea | Why it is bad | What to use instead |
|----------|---------------|---------------------|
| **Daily task** | Creates obligation. Players feel punished for skipping a day. | A repeatable loop with no reset. Players do it when they want. |
| **Battle pass** | Time-gated participation. Creates FOMO. | A steady reward shop with no expiration. |
| **Reputation grind** | Locks reward behind a hidden meter. | A level requirement or quest completion. |
| **Mandatory group** | Excludes solo players. | A groupable activity where solo players receive full rewards. |
| **Universal BiS reward** | Collapses gear progression into one activity. | A cosmetic or narrow utility item. |
| **Scoreboard** | Encourages speedrunning over mastery. | A personal best tracker, not a public leaderboard. |
| **Time-limited event** | Disappears and leaves no trace. | A permanent activity that players can revisit. |
| **Activity-exclusive skill** | Locks content behind one choice. | Every skill must be trainable in the open world. |
| **Activity-only recipe** | Forces players to grind one activity for a recipe. | Recipes are discoverable in the open world. Activities give materials or hints. |
| **"Complete 10 today"** | Turns fun into a checklist. | No counters. No streaks. No daily completion bonuses. |

## Activity Identity

Every activity in Old Town must answer these questions before it is written:

1. **What skill or combat loop does it train?** If the answer is "none," it is not an activity.
2. **Where is it located?** Every activity needs a place. The place gives the activity its personality.
3. **Is it solo, groupable, or public?** Solo means one player at a time. Groupable means multiple players can participate. Public means anyone can join without invitation.
4. **Is it safe, risky, or dangerous?** Safe means no failure cost beyond lost time or basic materials. Risky means failure costs time or inputs that require effort to replace. Dangerous means failure can damage gear or consume resources.
5. **What does the player actually do moment-to-moment?** The loop must be describable in three sentences. If it takes a paragraph, the activity is too complex.
6. **What inputs does it consume?** Tools, materials, or consumables that the player must bring or gather.
7. **What outputs or rewards does it produce?** XP, resources, tokens, or items.
8. **Why would players repeat it?** If the only answer is "for the reward," the activity is a chore. The loop itself must be satisfying.
9. **What does it not replace?** Open-world skilling, questing, or combat must remain viable.
10. **What is the player shorthand?** Players do not say "I am going to the repeatable woodcutting production activity." They say "I am going to the replant."

## Activity Categories

Activities fall into one of eight categories. The category tells you what kind of loop the activity offers. See [`activity-categories`](activity-categories.md) for full definitions.

| Category | Core Loop | Example |
|----------|-----------|---------|
| **Skilling Activity** | Repeatable skill actions with a twist | Graveflower Round |
| **Production Activity** | Turn inputs into outputs through timed process | Foundry Shift |
| **Skilling Boss** | Dangerous skill-led encounter with failure states | Old Kiln Watch |
| **Course** | Movement and route training loop | Bell Run |
| **Public Work** | Shared town job with modest rewards | Market Rush |
| **Combat-lite Activity** | Low-risk combat with objectives | Soot Sweep |
| **Risk Activity** | Better rewards with failure or death risk | Quarry Shift |
| **Puzzle Activity** | Repeatable object or logic challenge | Sootstairs Lockroom |

## Activity and Guild Relationship

Activities and guilds are separate systems that can overlap. A guild might host an activity, but the activity does not require guild membership. Conversely, an activity might happen in a place with no guild at all.

- Foundry Row (guild) hosts Foundry Shift (activity).
- Wardenbrook Fishery (guild) hosts Wardenbrook Tide (activity).
- The Market Bell (no guild) hosts Market Rush (activity).
- The Sootstairs (no guild) hosts Sootstairs Lockroom (activity).

A player can do an activity at a guild without having unlocked the guild. The activity has its own entry requirement, independent of the guild's. For example, a player with low Fishing can still participate in Wardenbrook Tide if they meet the activity's entry requirement, even if they have not unlocked Wardenbrook Fishery.

## Activity and Quest Relationship

Activities and quests are separate systems that can overlap. A quest might introduce an activity, but the activity does not require quest completion. Conversely, an activity might have quest hooks that unlock new loops or rewards.

- The quest `A Penny for the Forge` introduces Foundry Shift.
- The activity Foundry Shift has quest hooks documented in [`activity-quest-hooks`](activity-quest-hooks.md).

See [`activity-quest-hooks`](activity-quest-hooks.md) for the full list of quest hooks tied to activities.

## Activity Access

Activities do not have standing requirements. Access is gated by one or more of the following:

- **Level requirement:** A minimum skill level to participate.
- **Item requirement:** A specific tool or material needed to start the loop.
- **Quest requirement:** A quest completion that unlocks the activity.
- **Area requirement:** Being in the right place.
- **Deed tier:** A civic permit that grants access to higher-tier activities.

No activity requires reputation, membership, or daily participation.

## Banned Activity Names

| Banned name | Why it is banned | What to use instead |
|-------------|------------------|---------------------|
| **Daily Challenge** | Implies daily reset and streak | `Bell Run`, `Ledger Sort` |
| **Minigame** | Implies score, leaderboard, arcade | `activity`, `loop`, `training method` |
| **Event** | Implies time-limited, disappears | `activity`, `work`, `training` |
| **Dungeon** | Implies combat-only, group-required | `skilling boss`, `course`, `risk activity` |
| **Raid** | Implies group-required, combat-heavy | `public work`, `skilling boss` |
| **Flashpoint** | Implies time-limited, competitive | `risk activity`, `skilling boss` |
| **Challenge** | Implies score comparison | `activity`, `loop`, `training method` |
| **Bounty** | Implies daily reset, kill quota | `contract board`, `public work` |

## Player Shorthand for Activities

| Shorthand | What players mean |
|-----------|-------------------|
| "the run" | Any course activity, usually Bell Run or Crowmile Relay |
| "the shift" | Any production activity, usually Foundry Shift or Quarry Shift |
| "the sweep" | Any combat-lite activity, usually Soot Sweep |
| "the lockroom" | Sootstairs Lockroom, or any puzzle activity |
| "the watch" | Old Kiln Watch, or any skilling boss |
| "the tide" | Wardenbrook Tide, or any dangerous skilling activity |
| "the vigil" | Lowgrave Vigil, or any night-time risk activity |
| "the replant" | Bellwood Replant, or any skilling activity with replanting |
| "the drive" | Patchfield Drive, or any trapping activity |
| "the round" | Graveflower Round, or any gardening activity |
| "tokens" | Activity currency in general, context-dependent |
| "I got my ribbon" | Completed a course and earned the cosmetic reward |
| "I got my apron" | Completed a production activity and earned the cosmetic reward |
| "the watch is up" | The skilling boss is currently active and dangerous |
| "safe to run" | The course or activity has no risk of failure or loss |

## Related Systems

- [`docs/skills/skill-system.md`](skill-system.md) — how skills are trained and levelled
- [`docs/quests/quest-system.md`](quest-system.md) — how quests interact with activities
- [`docs/guilds/guild-system.md`](guild-system.md) — how guilds host activities
- [`docs/economy/reward-calibration.md`](reward-calibration.md) — how rewards are calibrated
- [`docs/ledger/charters-and-permits.md`](charters-and-permits.md) — how deed tiers unlock activities
