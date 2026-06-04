/**
 * Content registry types.
 *
 * Extracted to a separate file to break circular dependency between
 * content-registry.ts and content-references.ts.
 */

import type { AnimationDef } from "../content-schemas/animation";
import type { BankDef } from "../content-schemas/bank";
import type { CharterDef } from "../content-schemas/charter";
import type { ContractDef } from "../content-schemas/contract";
import type { DialogueDef } from "../content-schemas/dialogue";
import type { DropTableDef } from "../content-schemas/drop-table";
import type { ItemDef } from "../content-schemas/item";
import type { MaterialDef } from "../content-schemas/material";
import type { NpcDef } from "../content-schemas/npc";
import type { ObjectDef } from "../content-schemas/object";
import type { ProcessingRecipeDef } from "../content-schemas/processing-recipe";
import type { PropertyDef } from "../content-schemas/property";
import type { QuestDef } from "../content-schemas/quest";
import type { RegionMapDef } from "../content-schemas/region-map";
import type { ResourceNodeDef } from "../content-schemas/resource-node";
import type { ServiceFeeDef } from "../content-schemas/service-fee";
import type { ShopDef } from "../content-schemas/shop";
import type { SkillDef } from "../content-schemas/skill";
import type { SpellDef } from "../content-schemas/spell";
import type { StatusEffectDef } from "../content-schemas/status-effect";

/** Typed per-kind registries keyed by content id (region maps keyed by `rx:ry:plane`). */
export interface ContentRegistries {
  readonly item: ReadonlyMap<string, ItemDef>;
  readonly npc: ReadonlyMap<string, NpcDef>;
  readonly object: ReadonlyMap<string, ObjectDef>;
  readonly processingRecipe: ReadonlyMap<string, ProcessingRecipeDef>;
  readonly skill: ReadonlyMap<string, SkillDef>;
  readonly resourceNode: ReadonlyMap<string, ResourceNodeDef>;
  readonly spell: ReadonlyMap<string, SpellDef>;
  readonly dropTable: ReadonlyMap<string, DropTableDef>;
  readonly quest: ReadonlyMap<string, QuestDef>;
  readonly dialogue: ReadonlyMap<string, DialogueDef>;
  readonly regionMap: ReadonlyMap<string, RegionMapDef>;
  readonly material: ReadonlyMap<string, MaterialDef>;
  readonly animation: ReadonlyMap<string, AnimationDef>;
  readonly shop: ReadonlyMap<string, ShopDef>;
  readonly bank: ReadonlyMap<string, BankDef>;
  readonly serviceFee: ReadonlyMap<string, ServiceFeeDef>;
  readonly statusEffect: ReadonlyMap<string, StatusEffectDef>;
  readonly contract: ReadonlyMap<string, ContractDef>;
  readonly property: ReadonlyMap<string, PropertyDef>;
  readonly charter: ReadonlyMap<string, CharterDef>;
}
