import type { ContentRegistries } from "@old-town/shared";

/**
 * Build a {@link ContentRegistries} for tests, defaulting every content kind to
 * an empty map. Override only the registries a test actually cares about.
 *
 * Keeping the full shape in one place means adding a new content kind to the
 * model touches this helper alone, rather than every test that builds a
 * registry literal.
 */
export function makeRegistries(overrides: Partial<ContentRegistries> = {}): ContentRegistries {
  return {
    item: new Map(),
    npc: new Map(),
    object: new Map(),
    processingRecipe: new Map(),
    skill: new Map(),
    resourceNode: new Map(),
    spell: new Map(),
    dropTable: new Map(),
    quest: new Map(),
    dialogue: new Map(),
    regionMap: new Map(),
    material: new Map(),
    animation: new Map(),
    shop: new Map(),
    bank: new Map(),
    serviceFee: new Map(),
    statusEffect: new Map(),
    contract: new Map(),
    property: new Map(),
    ...overrides,
  };
}
