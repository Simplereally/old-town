import { entityId } from "@old-town/shared";
import { loadContent } from "./content-loader";
import { createWorld } from "./ecs/world";
import { loadAllRegionMapsIntoWorld } from "./world/region-loader";
import { createRuntimeMap } from "./world/runtime-map";

async function main() {
  const content = await loadContent("content");
  if (!content.ok) {
    throw new Error(content.issues.map((issue) => issue.message).join("; "));
  }
  const world = createWorld();
  const map = createRuntimeMap();
  loadAllRegionMapsIntoWorld(world, map, content.registries);

  console.log("Entity 0 object:", world.getComponent(entityId(0), "object"));
  console.log("Entity 19 npc:", world.getComponent(entityId(19), "npc"));
  console.log("Entity 19 actor:", world.getComponent(entityId(19), "actor"));
  console.log("Entity 59 groundItem:", world.getComponent(entityId(59), "groundItem"));
  console.log("Entity 80 groundItem:", world.getComponent(entityId(80), "groundItem"));

  console.log("\nAll NPCs:");
  for (const [id, npc] of world.componentEntries("npc")) {
    console.log("  NPC", id, npc.npcId);
  }
  console.log("\nAll groundItems:");
  for (const [id, item] of world.componentEntries("groundItem")) {
    console.log("  Item", id, item.itemId);
  }
}

main();
