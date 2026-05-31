// Old Town shared package.
// Exposes protocol types, integer world primitives, deterministic math, and content schemas.

/** Package marker used by smoke tests to verify cross-package imports resolve. */
export const SHARED_PACKAGE = "@old-town/shared" as const;

export * from "./constants";
export * from "./content/action-id";
export * from "./content/content-ids";
export * from "./content/content-layout";
export * from "./content/content-registry";
export * from "./content-schemas";
export * from "./content-schemas";
export * from "./math/direction";
export * from "./math/numeric";
export * from "./math/rng";
export * from "./progression/xp-table";
export * from "./protocol/command-schemas";
export * from "./protocol/commands";
export * from "./protocol/entity-update";
export * from "./protocol/packets";
export * from "./protocol/parse-result";
export * from "./protocol/schema-primitives";
export * from "./protocol/transport";
export * from "./protocol/update-mask";
export * from "./types/coords";
export * from "./types/ids";
