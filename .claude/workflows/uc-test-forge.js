export const meta = {
  name: "uc-test-forge",
  description:
    "Find the most under-tested code, generate a test suite for each unit in parallel (isolated git worktrees), then run a judge panel to keep only tests that actually run and meaningfully assert behavior.",
  whenToUse:
    'Raising real test coverage on a module or service. Identifies coverage gaps, writes tests per unit in parallel, and quality-gates each generated file before keeping it. Pass args {root, framework, runner, target}. root defaults to "src"; framework e.g. "vitest"|"jest"|"pytest"|"go test"; runner is the shell command to run tests (e.g. "npm test"); target optionally narrows to a path. Agents write files, so they run in worktree isolation.',
  phases: [
    { title: "Triage", detail: "rank units by coverage gap × importance" },
    { title: "Generate", detail: "one agent per unit writes a test file (worktree)" },
    { title: "Judge", detail: "panel scores each suite: runs? asserts? meaningful?" },
    { title: "Land", detail: "keep passing suites and write the coverage plan" },
  ],
};

const root = (args && args.root) || "src";
const framework = (args && args.framework) || "the project test framework";
const runner = (args && args.runner) || "the project test command";
const target = (args && args.target) || root;

const UNITS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    units: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          file: { type: "string" },
          unit: { type: "string", description: "function/class/module to cover" },
          gap: { type: "string", enum: ["none", "partial", "untested"] },
          importance: { type: "string", enum: ["critical", "high", "medium", "low"] },
          why: { type: "string", description: "why this unit matters / what is risky about it" },
        },
        required: ["file", "unit", "gap", "importance", "why"],
      },
    },
  },
  required: ["units"],
};

const GEN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    testFile: { type: "string", description: "path of the test file written" },
    casesAdded: { type: "integer" },
    ran: { type: "boolean", description: "did you run the suite and did it pass" },
    summary: { type: "string" },
  },
  required: ["testFile", "casesAdded", "ran", "summary"],
};

const JUDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    runs: { type: "boolean", description: "suite executes green" },
    meaningful: {
      type: "boolean",
      description: "assertions test real behavior, not tautologies or mirrored implementation",
    },
    coversEdges: {
      type: "boolean",
      description: "includes error/edge/boundary cases, not just the happy path",
    },
    score: { type: "integer", description: "0-10 overall quality" },
    verdict: { type: "string", description: "keep | revise | drop, with one-line reason" },
  },
  required: ["runs", "meaningful", "coversEdges", "score", "verdict"],
};

// 1. Triage ------------------------------------------------------------
phase("Triage");
const triage = await agent(
  `Inspect \`${target}\` and find the units (functions/classes/modules) with the worst ratio of importance to test coverage. ` +
    `Use any existing coverage report if present, otherwise infer from test files vs source. ` +
    `Return the top ~12 highest-leverage units to add tests for, with the gap level and why each matters.`,
  { phase: "Triage", schema: UNITS_SCHEMA, agentType: "general-purpose" },
);
const units = ((triage && triage.units) || [])
  .filter((u) => u.gap !== "none")
  .sort(
    (a, b) =>
      ({ critical: 3, high: 2, medium: 1, low: 0 })[b.importance] -
      { critical: 3, high: 2, medium: 1, low: 0 }[a.importance],
  );
log(`Forging tests for ${units.length} units`);
if (!units.length) return { summary: 'Coverage already strong on the targeted units.', kept: [] }

// 2. Generate — agents write files, so isolate each in its own worktree
phase("Generate");
const generated = (
  await parallel(
    units.map(
      (u) => () =>
        agent(
          `Write a focused test suite for \`${u.unit}\` in \`${u.file}\` using ${framework}. Risk to cover: ${u.why}. ` +
            `Include happy path, error paths, and boundary/edge cases. Put it in the conventional test location for this repo. ` +
            `Then RUN the suite with \`${runner}\` and iterate until it passes. Do not weaken assertions to force a pass. Report what you added.`,
          {
            label: `gen:${u.unit}`,
            phase: "Generate",
            schema: GEN_SCHEMA,
            agentType: "general-purpose",
            isolation: "worktree",
          },
        ),
    ),
  )
).filter(Boolean);

// 3. Judge panel — 2 independent judges per generated suite ------------
phase("Judge");
const judged = await parallel(
  generated.map(
    (g) => () =>
      parallel(
        [0, 1].map(
          (n) => () =>
            agent(
              `Judge the test file \`${g.testFile}\` (judge #${n + 1}). Read it and the unit under test. ` +
                `Run \`${runner}\` for it. Score quality 0-10: tests must execute green, assert real behavior (not tautologies or a mirror of the implementation), and cover edges. ` +
                `Give a keep/revise/drop verdict.`,
              {
                label: `judge:${g.testFile}`,
                phase: "Judge",
                schema: JUDGE_SCHEMA,
                agentType: "general-purpose",
              },
            ),
        ),
      ).then((votes) => {
        const v = votes.filter(Boolean);
        const avg = v.reduce((s, x) => s + x.score, 0) / (v.length || 1);
        const ok = v.length > 0 && v.every((x) => x.runs) && avg >= 6;
        return {
          gen: g,
          avg: Math.round(avg * 10) / 10,
          keep: ok,
          verdicts: v.map((x) => x.verdict),
        };
      }),
  ),
);
const kept = judged.filter((j) => j.keep);
const dropped = judged.filter((j) => !j.keep);
log(`Judge panel kept ${kept.length}/${generated.length} suites`);

// 4. Land --------------------------------------------------------------
phase("Land");
const plan = await agent(
  `Write a short coverage report in Markdown. Kept suites (merge these): ${JSON.stringify(
    kept.map((k) => ({ file: k.gen.testFile, cases: k.gen.casesAdded, score: k.avg })),
    null,
    2,
  )}. ` +
    `Dropped/needs-work: ${JSON.stringify(
      dropped.map((d) => ({ file: d.gen.testFile, score: d.avg, why: d.verdicts })),
      null,
      2,
    )}. ` +
    `List the kept test files with case counts, then the units still needing manual attention and why. Output only markdown.`,
  { phase: "Land" },
);

return { plan, generated: generated.length, kept: kept.map((k) => k.gen.testFile), dropped: dropped.map((d) => d.gen.testFile) }
