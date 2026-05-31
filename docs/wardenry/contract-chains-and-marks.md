---
doc_type: authority
canonical_path: docs/wardenry/contract-chains-and-marks.md
parent_index: docs/wardenry/00-index.md
root_index: docs/00-index.md
---

Parent: [Wardenry Index](00-index.md)

Authority refs: `docs/wardenry/wardenry-system.md`, `docs/wardenry/wardens-and-boards.md`, `docs/wardenry/contracts-and-task-generation.md`, `docs/wardenry/cancel-skip-block-extend.md`, `docs/wardenry/warden-locker-rewards.md`, `docs/wardenry/wardenry-balance-rules.md`, `docs/economy/reward-calibration.md`

# Contract Chains and Marks

This document defines Warden Marks, the currency of the Wardenry system, and Contract Chains, the long-term progression structure that rewards consistent contract completion. Marks are earned by finishing contracts and spent on quality-of-life actions and locker rewards. Chains reward loyalty without punishing breaks.

## Warden Marks

Warden Marks are the internal currency of the Wardenry. They are earned by completing contracts and spent on actions like Reposting, Widening, Refusing, Pinning, and unlocking Warden Locker rewards.

Marks are not coins. They are not XP. They are not reputation. They cannot be traded, sold, or converted into any other currency. They exist only inside the Wardenry system and serve as a sink that keeps players engaged with contracts without distorting the wider economy.

## Base Marks by Source

| Source | Base Marks | Notes |
| Warden Holt | 1–3 | Low rewards for safe starter tasks |
| First-ring Wardens | 3–6 | Medium rewards for travel tasks |
| Sootstairs / risk Warden | 5–8 | Higher danger, higher payout |
| Carmine / Argent | 8–12 | High-level, dangerous tasks |
| Named Warrant | boss-specific | Varies by boss difficulty |
| Posted Contract | +1–2 bonus | Fixed location bonus |
| Risk Warrant | +2–3 bonus | Danger bonus |

## Contract Chain

A Contract Chain is the running count of consecutive contracts a player has completed without breaking the chain. Each completed contract adds one to the chain. The chain exists per player and is not tied to any specific Warden or contract family.

The chain builds naturally as the player finishes contracts. It breaks only when the player uses Tear Up to cancel a contract. Reposting, Refusing, Widening, and Pinning do not affect the chain.

## Chain Milestone Bonuses

| Chain milestone | Bonus | Example (Warden Holt base 2) |
| 10 | 5x base | 10 marks |
| 50 | 15x base | 30 marks |
| 100 | 25x base | 50 marks |

## Chain Rules

1. First 3 starter contracts give 0 marks. They teach the loop.
2. Marks begin after the player proves completion.
3. Every 10th contract gives a milestone bonus.
4. Every 50th gives a larger bonus.
5. Every 100th gives the maximum bonus.
6. Tearing Up a contract breaks the chain.
7. Reposting a contract preserves the chain.
8. Refusing a contract does not break the chain.
9. No daily cap.
10. No streak FOMO.

## Mark Economy

Marks are a sink. Players spend marks on Warden Locker rewards, Refuse slots, Widen contracts, Repost contracts, and Pin preferences. Marks are not convertible to coins. Marks do not decay.

## Related Systems

- [Wardenry System](wardenry-system.md) — overview of the Wardenry
- [Wardens and Boards](wardens-and-boards.md) — where contracts are posted
- [Contracts and Task Generation](contracts-and-task-generation.md) — how contracts are created
- [Cancel, Skip, Block, and Extend](cancel-skip-block-extend.md) — actions that cost marks
- [Warden Locker Rewards](warden-locker-rewards.md) — what marks are spent on
- [Wardenry Balance Rules](wardenry-balance-rules.md) — tuning and anti-abuse
- [Reward Calibration](../economy/reward-calibration.md) — how mark rewards fit the wider economy
