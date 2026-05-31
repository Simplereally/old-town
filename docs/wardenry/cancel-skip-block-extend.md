---
doc_type: authority
canonical_path: docs/wardenry/cancel-skip-block-extend.md
parent_index: docs/wardenry/00-index.md
root_index: docs/00-index.md
---

Parent: [Wardenry Index](00-index.md)

Authority refs: `docs/wardenry/wardenry-system.md`, `docs/wardenry/contract-chains-and-marks.md`, `docs/wardenry/warden-locker-rewards.md`, `docs/wardenry/wardenry-balance-rules.md`

# Cancel, Skip, Block, and Extend

This document defines the five player actions that modify or control contract assignment. All costs are paid in Warden Marks. None of these actions use coins, items, or cooldowns. They exist to give experienced players agency without letting new players skip the learning loop.

## Action Summary Table

| Action | Old Town term | Cost | Meaning | Chain effect |
| Cancel current task | Tear Up | low marks | removes current contract | breaks chain |
| Skip current task | Repost | medium marks | new contract from same Warden | preserves chain |
| Block family | Refuse | high marks | prevents future task family | no effect |
| Extend task | Widen | mark cost | increases count and reward | no effect |
| Prefer task | Pin | high marks | slightly higher chance of family | no effect |

## Tear Up

Tear Up cancels the player's current contract. It costs 5 marks. The chain breaks. The player can immediately request a new contract from any Warden. There is no additional penalty beyond the chain break.

Tear Up is not available for the first 3 starter contracts. Those contracts teach the loop and must be completed or allowed to expire.

## Repost

Repost gives the player a new contract from the same Warden while preserving the current chain. It costs 10 marks. It cannot be used more than once per contract. It cannot guarantee a specific target or family, only a fresh roll from the same source.

Repost exists for players who get a contract they genuinely do not want, not for rerolling until a favourite appears. The cost should discourage spam.

## Refuse

Refuse blocks a task family from future assignment. It costs 50 marks per slot. Slots unlock slowly as the player gains combat levels: 1 slot at level 20, 2 at 40, 3 at 60, 4 at 80, with a maximum of 5 slots.

Blocked families can be unblocked later for the same cost. Starter families, specifically Cellar Rats and Road Crows, cannot be blocked. Those families are part of the core teaching loop.

## Widen

Widen increases the kill count of a contract by 50% and increases the mark reward by 50%. It costs 15 marks. It can only be used once per contract. It cannot be used on Named Warrants.

Widen is meant for favourite tasks, not mandatory optimisation. A player who enjoys a particular family can stretch it for more marks, but the cost keeps it from becoming a required grind step.

## Pin

Pin slightly increases the chance of being assigned a specific task family. It costs 100 marks per family. The effect is mild and not deterministic. Only one Pin can be active at a time. Moving a Pin to a different family costs half the original price. Named Warrants cannot be Pinned.

Pin must feel like a gentle nudge, not a guarantee. The player should not feel entitled to the pinned family on every roll.

## Action Rules

1. Starter players should not need these actions.
2. All costs are in Warden Marks.
3. No coin cost.
4. No item cost.
5. No cooldown.
6. Reposting should not be optimal abuse. The cost should discourage spam.
7. Widening should be good for favourite tasks but not mandatory.
8. Pinning must be mild. The player should not feel entitled to the pinned task.

## Related Systems

- [Wardenry System](wardenry-system.md) — overview of the Wardenry
- [Contract Chains and Marks](contract-chains-and-marks.md) — how marks are earned and spent
- [Warden Locker Rewards](warden-locker-rewards.md) — other mark sinks
- [Wardenry Balance Rules](wardenry-balance-rules.md) — tuning and anti-abuse
