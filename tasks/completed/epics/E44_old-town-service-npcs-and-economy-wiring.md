# E44 — Old Town Service NPCs and Economy Wiring

## Dependency chain

- Depends on: E43 (Buildings, Collision, and World Topology), E21 (NPC Dialogue and Quest Engine), E22 (Economy Runtime), E36 (Economy Runtime: Bank, Shop, and Death), E37 (Crafting and Content Interaction Expansion)
- Unlocks: E45 (Core Gameplay Loop), E46 (Smoke Over Old Town Quest)

## Spec references

- `POC_SPEC.md` §14 (NPC system)
- `POC_SPEC.md` §16 (Items, inventory, equipment)
- `POC_SPEC.md` §18 (Quest engine — dialogue graph, varbits)
- `POC_SPEC.md` §22 (UI system — inventory, equipment, skills, minimap, quest journal, dialogue box)
- `docs/world/districts-and-routes.md` — district NPCs and services
- `docs/world/starter-economy-loops.md` — first-hour economy loops
- `content/npcs/` — NPC definitions
- `content/dialogue/` — dialogue graphs
- `content/shops/` — shop definitions
- `content/banks/` — bank definitions

## Epic goal

Old Town currently has 14 service NPCs placed on the map, but they are decorative. This epic makes them functional. The baker, bank clerk, forge master, woodwarden, tailor, beadworker, guard captain, shrine keeper, and others must offer dialogue, shops, banks, skill stations, and the first quest hook. The player should be able to walk into the Counting House, talk to Tomas Tally, and open the bank; walk to Foundry Row, talk to Osric Penny, and trade or use the anvil; walk to the Market Bell and read the noticeboard.

This epic also wires the economy UI (bank, shop, inventory) to the server runtime so the first-hour loop of earning, spending, storing, and crafting works.

## Approach summary

1. **Service NPC content pack.** Create/complete dialogue graphs for the 14 starter NPCs in `content/dialogue/`. Each NPC has a default greeting, district-appropriate lore, and a functional option (bank, shop, station, contract, quest).
2. **Bank wiring.** Implement the "Bank" interaction on Tomas Tally (and other bank NPCs). Opening the bank sends the player's bank inventory to the client and opens the bank panel. Deposits and withdrawals are server-authoritative and audited.
3. **Shop wiring.** Implement shops for Osric Penny, Letha Lath, Nell Patch, Mother Tallow, and other vendors. The shop panel shows stock, prices, and buy/sell options. Transactions go through the server shop runtime.
4. **Skill station NPCs.** Wire the forge furnace/anvil, bow bench, tanning frame, dye vat, bead kiln, bead loom, kitchen range, and map table to their respective crafting/gathering interactions. These stations are objects with options; the NPCs nearby explain and sometimes sell related goods.
5. **Warden board and shrine.** Add the Warden Board at Warden Steps with starter contracts (kill cellar rats, gather ore) and the Shrine Hearth with favour offerings. These are the first non-quest directed activities.
6. **Right-click menu population.** Ensure every NPC and object shows the correct options in the right-click menu: "Talk-to", "Bank", "Trade", "Use", "Examine", etc.

## Completion checklist

- [X] Complete the stories below in exact order.
- [X] Run all validation commands listed by completed stories.
- [X] Confirm no unchecked acceptance criteria remain in this epic's stories.
- [X] Move completed story files into `tasks/completed/stories/E44/`.
- [X] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [X] `E44-S01` — [Service NPC dialogue and option content pack](../stories/E44/E44-S01_service-npc-dialogue-and-option-content-pack.md)
- [X] `E44-S02` — [Bank NPC and bank panel wiring](../stories/E44/E44-S02_bank-npc-and-bank-panel-wiring.md)
- [X] `E44-S03` — [Shop NPCs and shop transaction UI](../stories/E44/E44-S03_shop-npcs-and-shop-transaction-ui.md)
- [X] `E44-S04` — [Skill station objects and recipe routing](../stories/E44/E44-S04_skill-station-objects-and-recipe-routing.md)
- [X] `E44-S05` — [Warden board and shrine starter activities](../stories/E44/E44-S05_warden-board-and-shrine-starter-activities.md)

## Epic acceptance criteria

- [X] All listed story files are complete and moved to the completed folder.
- [X] All 14 starter NPCs have functional dialogue and at least one interactive option.
- [X] Bank, shop, and inventory panels are wired to the server economy runtime.
- [X] Skill stations open the correct recipe/usage UI and route actions to the server.
- [X] The Warden Board offers starter contracts; the Shrine Hearth offers favour offerings.
- [X] Right-click menus show correct options for NPCs and objects.
- [X] All transactions are server-authoritative and item-audited.
