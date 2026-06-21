---
doc_type: authority
canonical_path: docs/tools-and-intermediates/tool-system.md
parent_index: docs/tools-and-intermediates/00-index.md
root_index: docs/00-index.md
---

Parent: [`Skill Utility Substrate Index`](00-index.md)

Authority references:
- `docs/items/tools/00-index.md`
- `docs/skills/skill-system.md`
- `docs/skills/skill-interlocks.md`

# Tool System

Tools turn skill actions into physical economy. A skill should not feel like a menu verb. It should feel like a player brought the right object to the right place and used it on the right target.

## Tool Roles

| Role | Description | Examples |
|------|-------------|----------|
| Action tool | Required to start a skill action | Pickaxe, rod, trowel, lockpick |
| Processing tool | Required to transform materials | Hammer, knife, needle, mortar |
| Precision tool | Improves quality, yield, or recipe access | Survey kit, bead loom, gem clamp |
| Identity tool | Memorable profession item with status | Warden Contract Book, Starfall Astrolabe |

## Design Rules

1. Tools are non-stackable unless explicitly defined as charges or consumable components.
2. Starter tools should be cheap, plain, and easy to replace.
3. Midgame tools should connect to named Old Town materials and places.
4. Endgame tools should be aspirational, rare, and culturally sticky.
5. Tool upgrades may improve speed, access, durability, yield, or action reliability.
6. Tool upgrades must not let the client decide gameplay truth. The server validates the item, skill, target, tick delay, and output.
7. Tools should be content definitions, not hardcoded behavior.
8. If a tool enables a new action family, the action should name the required station or target.
9. If a tool is also equipable, its combat role must stay secondary unless documented in weapon docs.
10. Tool names must use Old Town culture terms, not generic fantasy replacements.

## Minimum Skill Contract

For every non-combat skill, define:

| Field | Purpose |
|-------|---------|
| Tool family | The broad object class, such as axe, rod, or survey kit |
| Starter item | First usable tool |
| Midgame item | Memorable progression tool |
| Endgame item | Status tool or mastery target |
| Primary station | Where advanced processing happens |
| Main intermediate | The common product that links the skill to other skills |

