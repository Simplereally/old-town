export const meta = {
  name: "uc-migration-sweep",
  description:
    "Run a codebase-wide migration as a no-barrier pipeline: each file streams through transform → typecheck/compile → behavior-verify independently, in its own worktree, with a fixer loop, so a 500-file change never stalls on the slowest file.",
  whenToUse:
    'Framework swaps, API deprecations, codemods, or language-idiom migrations that touch many files where each file migrates independently and must compile + keep behavior. Pass args {rule, root, include, verifyCmd}. rule is the migration spec in plain English (REQUIRED); root defaults to "src"; include is an optional glob; verifyCmd is the typecheck/build/test command per file. Files migrate in parallel worktrees; only files needing cross-file context are flagged for manual review.',
  phases: [
    { title: "Plan", detail: "enumerate target files and a precise migration contract" },
    { title: "Migrate", detail: "pipeline: transform -> verify -> fix, per file, no barrier" },
    { title: "Review", detail: "summarize results and flag manual-attention files" },
  ],
};

const rule = (args && args.rule) || "Apply the migration described in the prompt";
const root = (args && args.root) || "src";
const include = (args && args.include) || "";
const verifyCmd = (args && args.verifyCmd) || "the project typecheck/build command";

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    contract: {
      type: "string",
      description: "crisp before/after rules every file agent must follow identically",
    },
    files: { type: "array", items: { type: "string" }, description: "files that need migrating" },
  },
  required: ["contract", "files"],
};

const TRANSFORM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    file: { type: "string" },
    changed: { type: "boolean" },
    needsManual: {
      type: "boolean",
      description: "true if the change depends on other files or is ambiguous",
    },
    note: { type: "string" },
  },
  required: ["file", "changed", "needsManual", "note"],
};

const VERIFY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    file: { type: "string" },
    passed: { type: "boolean", description: "typecheck/compile/test passed after the change" },
    behaviorPreserved: { type: "boolean", description: "no behavioral regression vs the original" },
    detail: { type: "string" },
  },
  required: ["file", "passed", "behaviorPreserved", "detail"],
};

// 1. Plan --------------------------------------------------------------
phase("Plan");
const plan = await agent(
  `We are migrating code under \`${root}\`${include ? ` (matching ${include})` : ""}. Migration rule:\n"${rule}"\n\n` +
    `Produce a precise migration CONTRACT — exact before→after rules so every file is transformed identically — and enumerate the files that actually need changing ` +
    `(grep for the old pattern; skip files that don't match). Exclude tests of the migration itself, generated, and vendored code.`,
  { phase: "Plan", schema: PLAN_SCHEMA, agentType: "general-purpose" },
);
const contract = (plan && plan.contract) || rule;
const files = (plan && plan.files) || [];
log(`Migrating ${files.length} files under contract`);
if (!files.length) return { summary: 'No files match the migration pattern.', results: [] }

// 2. Migrate — PIPELINE: each file flows transform -> verify -> fix on its
//    own, no barrier between stages, each agent in an isolated worktree.
phase("Migrate");
const results = await pipeline(
  files,

  // Stage A: transform
  (file) =>
    agent(
      `Apply this migration CONTRACT to exactly one file, \`${file}\`:\n${contract}\n\n` +
        `Edit only \`${file}\`. If the correct change depends on other files or is ambiguous, make the safe local change and set needsManual=true with a note. Do not touch anything outside this file.`,
      {
        label: `migrate:${file}`,
        phase: "Migrate",
        schema: TRANSFORM_SCHEMA,
        agentType: "general-purpose",
        isolation: "worktree",
      },
    ),

  // Stage B: verify (receives stage A result + original item)
  (prev, file) => {
    if (!prev || !prev.changed)
      return { file, passed: true, behaviorPreserved: true, detail: "no change needed" };
    return agent(
      `Verify the migration of \`${file}\`. Run \`${verifyCmd}\` scoped to it and check the diff preserves behavior under the contract:\n${contract}\n\n` +
        `Report pass/fail and whether behavior is preserved. ${prev.needsManual ? "NOTE: the migrator flagged this needsManual — be extra critical." : ""}`,
      {
        label: `verify:${file}`,
        phase: "Migrate",
        schema: VERIFY_SCHEMA,
        agentType: "general-purpose",
        isolation: "worktree",
      },
    );
  },

  // Stage C: fixer loop (only if verify failed)
  (verifyResult, file) => {
    if (!verifyResult || (verifyResult.passed && verifyResult.behaviorPreserved)) {
      return { file, status: "ok", detail: verifyResult ? verifyResult.detail : "unchanged" };
    }
    return agent(
      `The migration of \`${file}\` failed verification: ${verifyResult.detail}. ` +
        `Fix it so \`${verifyCmd}\` passes and behavior is preserved under the contract:\n${contract}\n\n` +
        `Edit only \`${file}\`, re-run the check, and iterate up to a few times. If it still can't pass without cross-file changes, leave the file as-is and report status "manual".`,
      {
        label: `fix:${file}`,
        phase: "Migrate",
        agentType: "general-purpose",
        isolation: "worktree",
      },
    ).then((text) => ({ file, status: "fixed-or-manual", detail: text }));
  },
);

// 3. Review — barrier here is legitimate: we need the whole result set
phase("Review");
const clean = results.filter(Boolean);
const review = await agent(
  `Summarize this migration run in Markdown:\n${JSON.stringify(clean, null, 2)}\n\n` +
    `Give counts (migrated clean / fixed / needs-manual), then a "🛠 Needs manual review" list with the file and why, ` +
    `then suggested next steps (e.g. run the full suite, open the PR). Output only markdown.`,
  { phase: "Review" },
);

return { review, total: files.length, results: clean }
