---
doc_type: authority
canonical_path: docs/wardenry/warden-locker-rewards.md
parent_index: docs/wardenry/00-index.md
root_index: docs/00-index.md
---

Parent: [Wardenry Index](00-index.md)

Authority refs: [Wardenry System](wardenry-system.md), [Contract Chains and Marks](contract-chains-and-marks.md), [Cancel, Skip, Block, Extend](cancel-skip-block-extend.md), [Wardenry Balance Rules](wardenry-balance-rules.md), [Reward Calibration](../economy/reward-calibration.md), [Trophies](../items/accessories/trophies.md), [Gathering Tools](../items/tools/gathering.md)

# Warden Locker Rewards

The Warden Locker is the reward shop for Warden Marks. It holds unlocks, tools, cosmetics, and utility items.

## Reward Categories

| Category | Description | Examples |
| **Task tools** | Tools that help with specific contracts | bell whistle, grave tongs, soot mask |
| **Protective gear** | Low-tier protection for specific areas | ash scarf, rot gloves, ear muff |
| **Unlocks** | New task families or boss warrants | allow new contract family, allow boss warrants |
| **Extensions** | Widen specific contract families | widen rats, bats, grave mites, goblins |
| **Blocks** | Refuse task family slots | refuse task family |
| **Storage** | Proof storage and contract book upgrades | proof pouch, contract book upgrade |
| **Cosmetics** | Warden identity items | Warden badge trim, road ribbon, warrant stamp |
| **Utility** | Task management items | task check item, route note, proof counter |

## Reward Examples

| reward_id | display name | category | cost (marks) | effect |
| `warden_whistle` | Warden Whistle | Utility | 50 | check current contract status |
| `proof_pouch` | Proof Pouch | Storage | 75 | stores proof drops while on task |
| `grave_tongs` | Grave Tongs | Task tool | 100 | safely handle grave proof items |
| `soot_mask` | Soot Mask | Protective gear | 150 | reduces Sootstairs nuisance effects |
| `bell_lure` | Bell Lure | Task tool | 200 | improves Bell Bat contract assignments |
| `warrant_stamp` | Warrant Stamp | Cosmetic | 250 | cosmetic contract book mark |
| `contract_book_upgrade` | Contract Book Upgrade | Storage | 300 | stores more active contract notes |
| `ash_scarf` | Ash Scarf | Protective gear | 100 | small kiln/ash protection |
| `rot_gloves` | Rot Gloves | Protective gear | 125 | Lowgrave task helper, reduces rot pressure |

## Anti-Power-Creep Rules

1. No universal damage boost.
2. No best-in-slot combat item.
3. No huge coin rewards.
4. No universal slayer helmet clone too early.
5. Protective gear is narrow and area-specific.
6. Task tools are convenience, not power.
7. Cosmetics are identity, not stats.
8. If a Warden Mask or Marked Cowl exists later, it is narrow, named differently, and delayed to midgame.

## Unlock Progression

| Unlock | Cost | Requirement | Effect |
| Allow boss warrants | 500 | Combat level 30 | Wardens can assign boss tasks |
| Allow Posted Contracts | 300 | Combat level 25 | Wardens can assign location-specific tasks |
| Allow Risk Warrants | 400 | Combat level 40 | Wardens can assign high-danger tasks |
| First Refuse slot | 100 | Combat level 20 | Block one task family |
| Second Refuse slot | 200 | Combat level 40 | Block second task family |
| Third Refuse slot | 400 | Combat level 60 | Block third task family |
| Widen rats | 150 | Combat level 20 | Widen Cellar Rat and Soot Rat contracts |
| Widen bats | 150 | Combat level 25 | Widen Bell Bat contracts |

## Related Systems

- [Wardenry System](wardenry-system.md)
- [Contract Chains and Marks](contract-chains-and-marks.md)
- [Cancel, Skip, Block, Extend](cancel-skip-block-extend.md)
- [Wardenry Balance Rules](wardenry-balance-rules.md)
- [Reward Calibration](../economy/reward-calibration.md)
- [Trophies](../items/accessories/trophies.md)
- [Gathering Tools](../items/tools/gathering.md)
