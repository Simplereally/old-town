# Quest Items Index

> **Entry point for all quest item documentation in Old Town.** This is the canonical index for quest items. Navigate to the specific quest you need.

## Quest Item Categories

| Category | Doc | Count | Status | What is inside |
|----------|-----|-------|--------|----------------|
| **Smoke Over Old Town** | [`smoke-over-old-town.md`](smoke-over-old-town.md) | 5 | Complete | POC quest items |

## Quest Item System Overview

Quest items are the story objects. They are the keys, the evidence, the tokens, the rewards.

**Key principles:**
- **Quest items are temporary.** Obtained during a quest and consumed or kept as a reward.
- **Quest items are unique.** They have unique IDs and names.
- **Quest items are non-tradeable.** Cannot be sold or traded.
- **Quest items are non-stackable.** Each is unique.
- **Quest items have purpose.** They are needed to complete the quest.

## Quest Item Naming Convention

Quest items use the quest slug as a prefix:

```
{quest_slug}_{item_descriptor}
```

Examples:
- `smoke_over_old_town_baker_key`
- `smoke_over_old_town_dry_log`
- `smoke_over_old_town_cellar_rat_tail`

## Design Rules

1. **Quest items are non-tradeable.**
2. **Quest items are non-stackable.**
3. **Quest items use the quest slug as prefix.**
4. **Quest items have purpose.**
5. **Quest items are temporary.**
6. **Quest rewards are permanent.**
7. **Quest items are not random.**
8. **Quest items can be examined.**
9. **Quest items are not lost on death.**
10. **Quest items are not bankable.**

## Related Documents

- [`smoke-over-old-town.md`](smoke-over-old-town.md) — POC quest items
- [`POC_SPEC.md`](../../POC_SPEC.md) §18 (Quest engine)

---

*Total quest items defined: 5*
*Total quest items planned: TBD (per-quest)*
