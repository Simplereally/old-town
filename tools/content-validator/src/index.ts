/**
 * Content validator CLI. Loads the content directory, validates every definition against
 * its schema, checks cross-references and duplicate ids, and reports actionable authoring
 * context. Exits non-zero on errors so it can gate CI.
 *
 * Usage:
 *   bun run content:validate [contentDir]
 *   bun run content:list [contentDir] [kind]
 *   bun run content:graph [contentDir]
 */
import { resolve } from "node:path";
import {
  type ContentIssue,
  type ContentKind,
  type ContentRegistries,
  type Effect,
  type Requirement,
  validateContent,
} from "@old-town/shared";
import { loadContentDir } from "./loader";

export { loadContentDir } from "./loader";

type ContentCommand = "validate" | "list" | "graph";
type IssueSeverity = "error" | "warning";

interface ParsedArgs {
  readonly command: ContentCommand;
  readonly contentDir: string;
  readonly kind?: ContentKind;
}

interface ContentNotice extends ContentIssue {
  readonly severity: IssueSeverity;
}

interface DependencyEdge {
  readonly from: string;
  readonly to: string;
  readonly field: string;
}

interface CliResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

const COMMANDS = new Set<ContentCommand>(["validate", "list", "graph"]);

const REGISTRY_ORDER: readonly (keyof ContentRegistries & ContentKind)[] = [
  "item",
  "npc",
  "object",
  "processingRecipe",
  "skill",
  "resourceNode",
  "spell",
  "dropTable",
  "quest",
  "dialogue",
  "regionMap",
  "material",
  "animation",
];

async function main(): Promise<void> {
  const result = await runContentCli(process.argv.slice(2));
  if (result.stdout) {
    console.log(result.stdout);
  }
  if (result.stderr) {
    console.error(result.stderr);
  }
  process.exit(result.exitCode);
}

export async function runContentCli(args: readonly string[] = []): Promise<CliResult> {
  const parsed = parseArgs(args);
  const contentDir = resolve(process.cwd(), parsed.contentDir);
  const { files, issues: loadIssues } = await loadContentDir(contentDir);
  const validation = validateContent(files);
  const errors = [...loadIssues, ...validation.issues].map((issue) =>
    normalizeIssue(issue, "error"),
  );
  const warnings = buildUnusedWarnings(validation.registries, validation.sources);

  if (errors.length > 0 || !validation.ok) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: renderValidationFailure(errors, warnings),
    };
  }

  switch (parsed.command) {
    case "list":
      return {
        exitCode: 0,
        stdout: renderRegistryList(
          validation.registries,
          validation.sources,
          parsed.kind,
          warnings,
        ),
        stderr: "",
      };
    case "graph":
      return {
        exitCode: 0,
        stdout: renderDependencyGraph(validation.registries, warnings),
        stderr: "",
      };
    case "validate":
      return {
        exitCode: 0,
        stdout: renderValidationSuccess(files.length, validation.registries, warnings),
        stderr: "",
      };
  }
}

function parseArgs(args: readonly string[]): ParsedArgs {
  const [first, ...rest] = args;
  const command = isCommand(first) ? first : "validate";
  const positional = isCommand(first) ? rest : args;
  let contentDir = "content";
  let kind: ContentKind | undefined;

  for (let i = 0; i < positional.length; i += 1) {
    const arg = positional[i];
    if (arg === undefined) {
      continue;
    }
    if (arg === "--content-dir") {
      contentDir = positional[i + 1] ?? contentDir;
      i += 1;
      continue;
    }
    if (arg === "--kind") {
      kind = parseContentKind(positional[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      continue;
    }
    if (contentDir === "content") {
      contentDir = arg;
      continue;
    }
    kind = parseContentKind(arg);
  }

  return { command, contentDir, ...(kind ? { kind } : {}) };
}

function isCommand(value: string | undefined): value is ContentCommand {
  return value !== undefined && COMMANDS.has(value as ContentCommand);
}

function parseContentKind(value: string | undefined): ContentKind | undefined {
  return REGISTRY_ORDER.find((kind) => kind === value);
}

function renderValidationFailure(
  errors: readonly ContentNotice[],
  warnings: readonly ContentNotice[],
): string {
  const lines = [`ERROR Content validation failed - ${errors.length} issue(s).`];
  for (const issue of errors) {
    lines.push(...formatIssue(issue));
  }
  if (warnings.length > 0) {
    lines.push("", `Warnings - ${warnings.length} notice(s):`);
    for (const warning of warnings) {
      lines.push(...formatIssue(warning));
    }
  }
  return lines.join("\n");
}

function renderValidationSuccess(
  fileCount: number,
  registries: ContentRegistries,
  warnings: readonly ContentNotice[],
): string {
  const counts = registryCounts(registries);
  const lines = [
    `OK Content valid - ${fileCount} file(s)${
      counts ? `. Registries: ${counts}` : " (no content yet)"
    }`,
  ];
  if (warnings.length > 0) {
    lines.push(`Warnings - ${warnings.length} unused safe reference(s):`);
    for (const warning of warnings) {
      lines.push(...formatIssue(warning));
    }
  }
  return lines.join("\n");
}

function renderRegistryList(
  registries: ContentRegistries,
  sources: ReadonlyMap<string, string>,
  kindFilter: ContentKind | undefined,
  warnings: readonly ContentNotice[],
): string {
  const lines = ["Registries:"];
  for (const kind of REGISTRY_ORDER) {
    if (kindFilter && kind !== kindFilter) {
      continue;
    }
    const registry = registries[kind];
    lines.push(`${kind} count=${registry.size}`);
    for (const id of Array.from(registry.keys()).toSorted()) {
      lines.push(`  ${id} path=${sources.get(`${kind}:${id}`) ?? "(unknown file)"}`);
    }
  }
  if (warnings.length > 0) {
    lines.push("", `Warnings - ${warnings.length} unused safe reference(s):`);
    for (const warning of warnings) {
      lines.push(...formatIssue(warning));
    }
  }
  return lines.join("\n");
}

function renderDependencyGraph(
  registries: ContentRegistries,
  warnings: readonly ContentNotice[],
): string {
  const edges = buildDependencyEdges(registries);
  const lines = [`Dependency graph: ${edges.length} edge(s)`];
  for (const edge of edges) {
    lines.push(`${edge.from} -> ${edge.to} (${edge.field})`);
  }
  if (warnings.length > 0) {
    lines.push("", `Warnings - ${warnings.length} unused safe reference(s):`);
    for (const warning of warnings) {
      lines.push(...formatIssue(warning));
    }
  }
  return lines.join("\n");
}

export function formatIssue(issue: ContentNotice): string[] {
  const lines = [
    `  [${issue.severity}] path=${issue.path ?? "(unknown file)"} pointer=${
      issue.pointer ?? "/"
    } id=${issue.id ?? "(none)"} suggested_fix=${issue.suggestion ?? inferSuggestion(issue)}`,
    `      message: ${issue.message}`,
  ];
  if (issue.dependency && issue.dependency.length > 0) {
    lines.push(`      dependency: ${issue.dependency.join(" -> ")}`);
  }
  return lines;
}

function normalizeIssue(issue: ContentIssue, severity: IssueSeverity): ContentNotice {
  return {
    ...issue,
    severity,
    pointer: issue.pointer ?? "/",
    dependency: issue.dependency ?? (issue.id ? [issue.id] : []),
    suggestion: issue.suggestion ?? inferSuggestion(issue),
  };
}

function inferSuggestion(issue: ContentIssue): string {
  if (issue.message.startsWith("invalid JSON")) {
    return "fix_json";
  }
  if (issue.message.includes("known content directory")) {
    return "move_file_to_known_content_directory";
  }
  if (issue.message.includes("duplicate")) {
    return "rename_or_remove_duplicate_id";
  }
  if (issue.message.includes("missing")) {
    return "create_or_fix_missing_reference";
  }
  return "inspect_content_definition";
}

function registryCounts(registries: ContentRegistries): string {
  return REGISTRY_ORDER.filter((kind) => registries[kind].size > 0)
    .map((kind) => `${kind}=${registries[kind].size}`)
    .join(", ");
}

function buildUnusedWarnings(
  registries: ContentRegistries,
  sources: ReadonlyMap<string, string>,
): readonly ContentNotice[] {
  const incoming = new Map<ContentKind, Set<string>>();
  for (const kind of REGISTRY_ORDER) {
    incoming.set(kind, new Set());
  }
  for (const edge of buildDependencyEdges(registries)) {
    const [kind, id] = splitNode(edge.to);
    incoming.get(kind)?.add(id);
  }

  const safeKinds: readonly ContentKind[] = ["resourceNode", "dropTable", "dialogue"];
  const warnings: ContentNotice[] = [];
  for (const kind of safeKinds) {
    for (const id of registries[kind].keys()) {
      if (incoming.get(kind)?.has(id)) {
        continue;
      }
      warnings.push({
        severity: "warning",
        path: sources.get(`${kind}:${id}`),
        id,
        pointer: "/id",
        dependency: [`${kind}:${id}`],
        suggestion: "remove_or_reference_unused_id",
        message: `${kind} "${id}" is not referenced by any loaded content`,
      });
    }
  }
  return warnings;
}

function buildDependencyEdges(registries: ContentRegistries): readonly DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  const seen = new Set<string>();
  const add = (
    fromKind: ContentKind,
    fromId: string,
    toKind: ContentKind,
    toId: string,
    field: string,
  ): void => {
    const edge = { from: `${fromKind}:${fromId}`, to: `${toKind}:${toId}`, field };
    const key = `${edge.from}|${edge.to}|${edge.field}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    edges.push(edge);
  };
  const addEffectEdges = (
    effects: readonly Effect[],
    fromKind: ContentKind,
    fromId: string,
    field: string,
  ): void => {
    for (const effect of effects) {
      switch (effect.kind) {
        case "add_item":
        case "remove_item":
          add(fromKind, fromId, "item", effect.itemId, `${field}.itemId`);
          break;
        case "add_xp":
          add(fromKind, fromId, "skill", effect.skillId, `${field}.skillId`);
          break;
        case "start_quest":
        case "complete_quest":
          add(fromKind, fromId, "quest", effect.questId, `${field}.questId`);
          break;
        default:
          break;
      }
    }
  };
  const addRequirementEdges = (
    requirements: readonly Requirement[],
    fromKind: ContentKind,
    fromId: string,
    field: string,
  ): void => {
    for (const req of requirements) {
      if (req.kind === "skill") {
        add(fromKind, fromId, "skill", req.skillId, `${field}.skillId`);
      } else if (req.kind === "item") {
        add(fromKind, fromId, "item", req.itemId, `${field}.itemId`);
      } else if (req.kind === "quest_stage") {
        add(fromKind, fromId, "quest", req.questId, `${field}.questId`);
      } else if (req.kind === "kill_count") {
        add(fromKind, fromId, "quest", req.questId, `${field}.questId`);
        add(fromKind, fromId, "npc", req.npcId, `${field}.npcId`);
      }
    }
  };

  for (const [id, def] of registries.resourceNode) {
    add("resourceNode", id, "item", def.outputItemId, "outputItemId");
    add("resourceNode", id, "skill", def.skill, "skill");
  }
  for (const [id, def] of registries.spell) {
    for (const cost of def.beadCosts) {
      add("spell", id, "item", cost.itemId, "beadCosts.itemId");
    }
    if (def.effect.kind === "alchemy") {
      add("spell", id, "item", def.effect.coinItemId, "effect.coinItemId");
    } else if (def.effect.kind === "enchant") {
      add("spell", id, "item", def.effect.fromItemId, "effect.fromItemId");
      add("spell", id, "item", def.effect.toItemId, "effect.toItemId");
    }
  }
  for (const [id, def] of registries.npc) {
    if (def.drops !== undefined) {
      add("npc", id, "dropTable", def.drops, "drops");
    }
    if (def.dialogueId !== undefined) {
      add("npc", id, "dialogue", def.dialogueId, "dialogueId");
    }
  }
  for (const [id, def] of registries.object) {
    if (def.resourceNodeId !== undefined) {
      add("object", id, "resourceNode", def.resourceNodeId, "resourceNodeId");
    }
    if (def.dialogueId !== undefined) {
      add("object", id, "dialogue", def.dialogueId, "dialogueId");
    }
  }
  for (const [id, def] of registries.processingRecipe) {
    add("processingRecipe", id, "skill", def.skill, "skill");
    add("processingRecipe", id, "item", def.inputItemId, "inputItemId");
    add("processingRecipe", id, "item", def.successItemId, "successItemId");
    if (def.failureItemId !== undefined) {
      add("processingRecipe", id, "item", def.failureItemId, "failureItemId");
    }
    for (const objectId of def.stationObjectIds) {
      add("processingRecipe", id, "object", objectId, "stationObjectIds");
    }
  }
  for (const [id, def] of registries.dropTable) {
    for (const entry of def.entries) {
      add("dropTable", id, "item", entry.itemId, "entries.itemId");
    }
    for (const always of def.alwaysDrops) {
      add("dropTable", id, "item", always.itemId, "alwaysDrops.itemId");
    }
  }
  for (const [id, def] of registries.quest) {
    addRequirementEdges(def.requirements, "quest", id, "requirements");
    addEffectEdges(def.rewards, "quest", id, "rewards");
    for (const stage of def.stages) {
      for (const objective of stage.objectives) {
        if (objective.kind === "talk" || objective.kind === "kill") {
          add("quest", id, "npc", objective.npcId, `stage ${stage.stage}.objective.npcId`);
        } else if (objective.kind === "gather" || objective.kind === "have_item") {
          add("quest", id, "item", objective.itemId, `stage ${stage.stage}.objective.itemId`);
        } else if (objective.kind === "object") {
          add("quest", id, "object", objective.objectId, `stage ${stage.stage}.objective.objectId`);
        }
      }
      for (const trigger of stage.triggers) {
        addEffectEdges(trigger.effects, "quest", id, `stage ${stage.stage}.trigger`);
      }
    }
  }
  for (const [id, def] of registries.dialogue) {
    for (const node of def.nodes) {
      addRequirementEdges(node.requirements ?? [], "dialogue", id, `node ${node.id}`);
      addEffectEdges(node.effects, "dialogue", id, `node ${node.id}`);
      for (const option of node.playerOptions ?? []) {
        add("dialogue", id, "dialogue", id, `node ${node.id}.option.next:${option.next}`);
        addRequirementEdges(option.requirements, "dialogue", id, `node ${node.id}.option`);
        addEffectEdges(option.effects, "dialogue", id, `node ${node.id}.option`);
      }
    }
  }
  for (const [id, def] of registries.regionMap) {
    add("regionMap", id, "material", def.tiles.default.underlayId, "tiles.default.underlayId");
    for (const override of def.tiles.overrides) {
      if (override.underlayId !== undefined) {
        add("regionMap", id, "material", override.underlayId, "tiles.overrides.underlayId");
      }
      if (override.overlayId !== undefined) {
        add("regionMap", id, "material", override.overlayId, "tiles.overrides.overlayId");
      }
    }
    for (const placed of def.objects) {
      add("regionMap", id, "object", placed.objectId, "objects.objectId");
    }
    for (const spawn of def.npcSpawns) {
      add("regionMap", id, "npc", spawn.npcId, "npcSpawns.npcId");
    }
    for (const spawn of def.groundItemSpawns) {
      add("regionMap", id, "item", spawn.itemId, "groundItemSpawns.itemId");
    }
  }
  return edges.toSorted((a, b) =>
    `${a.from}|${a.to}|${a.field}`.localeCompare(`${b.from}|${b.to}|${b.field}`),
  );
}

function splitNode(node: string): [ContentKind, string] {
  const separator = node.indexOf(":");
  return [node.slice(0, separator) as ContentKind, node.slice(separator + 1)];
}

if (import.meta.main) {
  main();
}
