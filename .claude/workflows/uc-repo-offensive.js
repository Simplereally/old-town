export const meta = {
  name: "uc-repo-offensive",
  description:
    "A reusable high-agency codebase offensive: map the repo, hunt defects in waves, verify with skeptics, implement safe fixes, and validate until clean or explicitly bounded.",
  whenToUse:
    "Run for repo-wide quality improvement, pre-release hardening, inherited-codebase cleanup, or after a large feature lands. Args: {focus?: string, implement?: boolean, maxWaves?: number, minSeverity?: 'P0'|'P1'|'P2'|'P3', allowHighRisk?: boolean}",
  phases: [
    {
      title: "0. Mission Framing",
      detail: "Lock scope, canonical commands, unsafe paths, and quality bar.",
    },
    {
      title: "1. Recon",
      detail: "Map architecture, commands, hotspots, generated files, and likely blast radius.",
    },
    {
      title: "2. Discovery Waves",
      detail: "Run repeated multi-lens defect hunts until the repo goes dry.",
    },
    {
      title: "3. Evidence Court",
      detail: "Deduplicate findings and force every claim through adversarial verification.",
    },
    {
      title: "4. Battle Plan",
      detail: "Convert verified issues into ordered, conflict-aware implementation slices.",
    },
    {
      title: "5. Surgical Fixes",
      detail: "Apply only confirmed safe fixes, parallelizing independent slices.",
    },
    {
      title: "6. Validation Gauntlet",
      detail: "Run real checks, repair regressions, and produce a final risk ledger.",
    },
  ],
};

const input = typeof args === "string" ? JSON.parse(args || "{}") : args || {};
const focus = input.focus || "the whole repository";
const implement = input.implement !== false;
const maxWaves = input.maxWaves || 4;
const minSeverity = input.minSeverity || "P1";
const allowHighRisk = input.allowHighRisk === true;

const severityRank = { P0: 0, P1: 1, P2: 2, P3: 3 };

const MISSION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    mission: { type: "string" },
    qualityBar: { type: "array", items: { type: "string" } },
    nonGoals: { type: "array", items: { type: "string" } },
    stopConditions: { type: "array", items: { type: "string" } },
  },
  required: ["mission", "qualityBar", "nonGoals", "stopConditions"],
};

const RECON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    stack: { type: "array", items: { type: "string" } },
    commands: {
      type: "object",
      additionalProperties: false,
      properties: {
        install: { type: "string" },
        dev: { type: "string" },
        build: { type: "string" },
        test: { type: "string" },
        lint: { type: "string" },
        typecheck: { type: "string" },
        formatCheck: { type: "string" },
      },
      required: ["install", "dev", "build", "test", "lint", "typecheck", "formatCheck"],
    },
    architectureMap: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          area: { type: "string" },
          paths: { type: "array", items: { type: "string" } },
          purpose: { type: "string" },
          risk: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["area", "paths", "purpose", "risk"],
      },
    },
    generatedOrUnsafePaths: { type: "array", items: { type: "string" } },
    likelyHotspots: { type: "array", items: { type: "string" } },
  },
  required: ["stack", "commands", "architectureMap", "generatedOrUnsafePaths", "likelyHotspots"],
};

const FINDING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          severity: { type: "string", enum: ["P0", "P1", "P2", "P3"] },
          category: { type: "string" },
          files: { type: "array", items: { type: "string" } },
          evidence: { type: "array", items: { type: "string" } },
          whyItMatters: { type: "string" },
          reproductionOrProof: { type: "string" },
          fixStrategy: { type: "string" },
          estimatedRisk: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: [
          "title",
          "severity",
          "category",
          "files",
          "evidence",
          "whyItMatters",
          "reproductionOrProof",
          "fixStrategy",
          "estimatedRisk",
        ],
      },
    },
  },
  required: ["findings"],
};

const VERDICT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    real: { type: "boolean" },
    adjustedSeverity: { type: "string", enum: ["P0", "P1", "P2", "P3"] },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    disproofAttempt: { type: "string" },
    reason: { type: "string" },
    prerequisitesBeforeEdit: { type: "array", items: { type: "string" } },
  },
  required: [
    "real",
    "adjustedSeverity",
    "confidence",
    "disproofAttempt",
    "reason",
    "prerequisitesBeforeEdit",
  ],
};

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    slices: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          objective: { type: "string" },
          findings: { type: "array", items: { type: "string" } },
          files: { type: "array", items: { type: "string" } },
          instructions: { type: "string" },
          commandsAfter: { type: "array", items: { type: "string" } },
          risk: { type: "string", enum: ["low", "medium", "high"] },
          parallelSafe: { type: "boolean" },
          dependsOn: { type: "array", items: { type: "string" } },
        },
        required: [
          "name",
          "objective",
          "findings",
          "files",
          "instructions",
          "commandsAfter",
          "risk",
          "parallelSafe",
          "dependsOn",
        ],
      },
    },
    deferred: { type: "array", items: { type: "string" } },
  },
  required: ["slices", "deferred"],
};

phase("0. Mission Framing");
const mission = await agent(
  `Frame the repo-offensive mission.

Scope: ${focus}
Implementation allowed: ${implement}
Minimum severity: ${minSeverity}
High-risk fixes allowed: ${allowHighRisk}

Define the quality bar, explicit non-goals, and stop conditions. This is not a style nit pass. Prioritize defects, maintainability hazards with real blast radius, release blockers, and verified cleanup opportunities.`,
  { label: "mission", phase: "0. Mission Framing", schema: MISSION_SCHEMA },
);

phase("1. Recon");
const recon = await agent(
  `Recon the repository for a high-agency quality offensive.

Mission:
${JSON.stringify(mission, null, 2)}

Find:
- stack and package manager
- canonical install/dev/build/test/lint/typecheck/format-check commands
- architecture areas and paths
- generated, vendored, or unsafe paths
- likely hotspots worth deeper review

Read enough files to be accurate. Do not edit.`,
  { label: "recon", phase: "1. Recon", schema: RECON_SCHEMA },
);

const discoveryLenses = [
  "type system soundness, unsafe casts, impossible states, schema/type drift",
  "runtime crash paths: nullability, edge cases, missing guards, bad assumptions",
  "async/concurrency bugs: races, cancellation, cleanup, lifecycle, ordering",
  "security: authz/authn, secrets, injection, input validation, SSRF/path traversal, unsafe defaults",
  "tests: flakiness, missing regressions, over-mocking, untested critical behavior",
  "performance: repeated work, render churn, N+1 calls, heavy bundles, hot loops, memory leaks",
  "UI correctness: React/hooks/state, accessibility, forms, loading/error/empty states",
  "API/data contracts: client/server drift, cache invalidation, serialization, migrations",
  "dead code and duplicate logic with safe deletion or consolidation evidence",
  "dependency/config/CI drift: package scripts, lockfiles, build config, env, generated artifacts",
  "error handling and observability: swallowed errors, noisy logs, no actionable diagnostics",
  "architecture boundaries: circular deps, leaky abstractions, misplaced domain logic",
  "docs/spec drift where documented behavior disagrees with implementation",
];

const seen = new Set();
const rawFindings = [];
let dryWaves = 0;

phase("2. Discovery Waves");
for (let wave = 1; wave <= maxWaves && dryWaves < 2; wave++) {
  log(`Discovery wave ${wave}: ${discoveryLenses.length} independent lenses`);

  const results = await parallel(
    discoveryLenses.map(
      (lens) => () =>
        agent(
          `Discovery wave ${wave}. Hunt for evidence-backed issues.

Lens:
${lens}

Scope:
${focus}

Recon:
${JSON.stringify(recon, null, 2)}

Already seen finding keys:
${JSON.stringify(Array.from(seen).slice(-250))}

Rules:
- Prefer high-signal P0/P1/P2 findings.
- No style-only nits.
- No speculation without file or command evidence.
- Include reproduction/proof or the exact static evidence that makes the issue real.
- Do not edit.`,
          {
            label: `discover:${wave}:${lens}`,
            phase: "2. Discovery Waves",
            schema: FINDING_SCHEMA,
          },
        ),
    ),
  );

  const fresh = [];
  for (const item of results.filter(Boolean).flatMap((x) => x.findings || [])) {
    if (severityRank[item.severity] > severityRank[minSeverity]) continue;
    const key = `${item.title}::${(item.files || []).sort().join("|")}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    fresh.push({ ...item, key });
  }

  if (fresh.length === 0) {
    dryWaves++;
  } else {
    dryWaves = 0;
    rawFindings.push(...fresh);
  }
}

phase("3. Evidence Court");
const verified = await pipeline(rawFindings, async (finding) => {
  const verdicts = await parallel([
    () =>
      agent(
        `You are the correctness skeptic. Try hard to disprove this finding. If it survives, explain why.

Finding:
${JSON.stringify(finding, null, 2)}`,
        {
          label: `court:correctness:${finding.title}`,
          phase: "3. Evidence Court",
          schema: VERDICT_SCHEMA,
        },
      ),
    () =>
      agent(
        `You are the reproduction/tooling skeptic. Attack command assumptions, generated files, stale docs, false positives, and missing context.

Finding:
${JSON.stringify(finding, null, 2)}

Recon:
${JSON.stringify(recon, null, 2)}`,
        {
          label: `court:repro:${finding.title}`,
          phase: "3. Evidence Court",
          schema: VERDICT_SCHEMA,
        },
      ),
    () =>
      agent(
        `You are the regression skeptic. Attack the proposed fix. Would it break behavior, tests, public API, performance, or UX?

Finding:
${JSON.stringify(finding, null, 2)}`,
        {
          label: `court:regression:${finding.title}`,
          phase: "3. Evidence Court",
          schema: VERDICT_SCHEMA,
        },
      ),
  ]);

  const good = verdicts.filter(Boolean);
  const realVotes = good.filter((v) => v.real && v.confidence !== "low").length;
  const accepted = realVotes >= 2;
  return { finding, verdicts: good, accepted };
});

const acceptedFindings = verified
  .filter(Boolean)
  .filter((x) => x.accepted)
  .map((x) => x.finding);

phase("4. Battle Plan");
const plan = await agent(
  `Create the implementation battle plan.

Mission:
${JSON.stringify(mission, null, 2)}

Recon:
${JSON.stringify(recon, null, 2)}

Verified findings:
${JSON.stringify(acceptedFindings, null, 2)}

Rules:
- Group by independent implementation slice, not by category.
- Defer anything speculative, high-risk without user intent, or not locally verifiable.
- Mark conflicts with dependsOn and parallelSafe.
- Prefer small, coherent patches with tests/checks.`,
  { label: "battle-plan", phase: "4. Battle Plan", schema: PLAN_SCHEMA },
);

const implementationResults = [];

if (implement) {
  phase("5. Surgical Fixes");

  const allowed = plan.slices.filter((slice) => allowHighRisk || slice.risk !== "high");
  const done = new Set();
  let remaining = [...allowed];
  let pass = 0;

  while (remaining.length && pass < 8) {
    pass++;
    const ready = remaining.filter((slice) =>
      (slice.dependsOn || []).every((dep) => done.has(dep)),
    );
    if (ready.length === 0) break;

    const parallelSafe = ready.filter((slice) => slice.parallelSafe);
    const sequential = ready.filter((slice) => !slice.parallelSafe);

    const parallelResults = await parallel(
      parallelSafe.map(
        (slice) => () =>
          agent(
            `Implement this verified repo-offensive slice.

Slice:
${JSON.stringify(slice, null, 2)}

Mission:
${JSON.stringify(mission, null, 2)}

Rules:
- Minimal production-quality edit.
- Read affected files before modifying.
- Do not touch generated/unsafe paths: ${JSON.stringify(recon.generatedOrUnsafePaths)}
- Add or update regression tests when useful.
- Run the smallest relevant commandsAfter when practical.
- Return changed files, commands run, and residual risks.`,
            { label: `fix:${slice.name}`, phase: "5. Surgical Fixes", isolation: "worktree" },
          ),
      ),
    );

    implementationResults.push(...parallelResults.filter(Boolean));
    for (const slice of parallelSafe) done.add(slice.name);

    for (const slice of sequential) {
      const result = await agent(
        `Sequentially implement this verified repo-offensive slice.

Slice:
${JSON.stringify(slice, null, 2)}

Rules are identical to parallel slices.`,
        { label: `fix-seq:${slice.name}`, phase: "5. Surgical Fixes" },
      );
      implementationResults.push(result);
      done.add(slice.name);
    }

    remaining = remaining.filter((slice) => !done.has(slice.name));
  }
}

phase("6. Validation Gauntlet");

return {
  focus,
  findingsDiscovered: rawFindings.length,
  findingsVerified: acceptedFindings.length,
  slicesPlanned: plan.slices.length,
  slicesImplemented: implementationResults.length,
  deferred: plan.deferred,
  validation: await agent(
    `Run the final validation gauntlet.

Mission:
${JSON.stringify(mission, null, 2)}

Recon commands:
${JSON.stringify(recon.commands, null, 2)}

Plan:
${JSON.stringify(plan, null, 2)}

Implementation results:
${JSON.stringify(implementationResults, null, 2)}

Run the appropriate real checks. If failures were introduced by this workflow, repair them. If failures are pre-existing or environmental, prove it with evidence. Return:
- commands run
- pass/fail status
- fixes made during validation
- remaining failures
- residual risk ledger
- recommended next workflow`,
    { label: "validation-gauntlet", phase: "6. Validation Gauntlet" }
  ),
};
