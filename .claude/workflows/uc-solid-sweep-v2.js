export const meta = {
  name: "uc-solid-sweep-v2",
  description:
    "Finds or accepts a high-value coupled module/component/class/service, proves its current behavior, designs language-idiomatic contracts, extracts cohesive responsibilities, integrates through a stable facade/composition layer, and verifies behavior, build health, dependency direction, and public API compatibility.",
  phases: [
    {
      title: "Target Resolution",
      detail:
        "Use supplied target or run a repo-wide tournament to choose the highest-value refactor candidate",
    },
    {
      title: "Preflight",
      detail:
        "Discover language, framework, commands, tests, public API, callers, and repo constraints",
    },
    {
      title: "Topology Swarm",
      detail:
        "Map responsibilities, public surface, dataflow, side effects, dependency shape, and behavioral invariants",
    },
    {
      title: "Topology Adjudication",
      detail: "Fuse independent maps into one canonical decomposition plan",
    },
    {
      title: "Refactor Plan Gate",
      detail:
        "Create the smallest safe implementation plan, attack it with stable critics, repair or downscope it through a bounded issue-ledger loop, then approve the exact scope downstream phases may execute",
    },
    {
      title: "Characterization Harness",
      detail: "Add regression protection before production behavior changes",
    },
    {
      title: "Contract Tournament",
      detail: "Generate and judge language-idiomatic boundary designs",
    },
    {
      title: "Extraction Pipeline",
      detail: "Draft, review, and repair each extracted responsibility independently",
    },
    {
      title: "Serial Integration",
      detail: "Apply the accepted decomposition in one conflict-aware implementation pass",
    },
    {
      title: "Verification Matrix",
      detail: "Run build/test/static-analysis/API/behavior/dependency checks",
    },
    {
      title: "Repair Loop",
      detail: "Fix verified failures until clean or bounded repair budget is exhausted",
    },
    {
      title: "Final Audit",
      detail:
        "Adversarially inspect final diff for behavior loss, over-abstraction, and hidden coupling",
    },
  ],
};

const input = typeof args === "object" && args ? args : {};

const suppliedTarget =
  input.target || input.file || input.path || input.module || input.symbol || null;

const maxRepairRounds = Number.isInteger(input.maxRepairRounds) ? input.maxRepairRounds : 6;

let refactorMode = input.mode || input.refactorMode || "balanced";

const validModes = ["smallest-safe", "balanced", "maximum-transform"];
if (!validModes.includes(refactorMode)) {
  refactorMode = "balanced";
}

const maxPlanGateRounds = Number.isInteger(input.maxPlanGateRounds) ? input.maxPlanGateRounds : 3;

const allowPublicApiChange = input.allowPublicApiChange === true;

const packageManagerHint = input.packageManager || "auto";

const refactorGoal =
  input.goal ||
  "Reduce coupling and split a high-value legacy unit into cohesive, testable, language-idiomatic modules while preserving observable behavior and caller compatibility.";

const strictPublicApiRule = allowPublicApiChange
  ? "Public API changes are allowed only when explicitly justified with migration steps, caller updates, and compatibility notes."
  : "Preserve the existing caller-facing public API: exported names, method/function names, signatures, constructor shape, return semantics, error behavior, initialization behavior, side-effect timing, and supported call patterns must remain compatible.";

function j(value) {
  return JSON.stringify(value, null, 2);
}

function openBlockingIssuesOnly(ledger) {
  return {
    issues: (ledger.issues || []).filter(
      (issue) => issue.status === "open" && issue.severity === "blocking",
    ),
  };
}

function selectedTopologyOnly(topology, plan) {
  const selected = new Set(plan.selectedResponsibilityIds || []);
  const deferred = new Set(plan.deferredResponsibilityIds || []);

  return {
    targetName: topology.targetName,
    publicApiLock: topology.publicApiLock,
    behaviorInvariants: topology.behaviorInvariants,
    selectedResponsibilities: topology.responsibilities.filter((r) => selected.has(r.id)),
    deferredResponsibilities: topology.responsibilities
      .filter((r) => deferred.has(r.id))
      .map((r) => ({ id: r.id, name: r.name, responsibility: r.responsibility })),
    integrationStrategy: topology.integrationStrategy,
    testStrategy: topology.testStrategy,
    redFlags: topology.redFlags,
  };
}

const TARGET_CANDIDATE_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    path: { type: "string" },
    symbolOrUnit: { type: "string" },
    languageOrStack: { type: "string" },
    candidateType: { type: "string" },
    currentResponsibilities: { type: "array", items: { type: "string" } },
    evidenceOfCoupling: { type: "array", items: { type: "string" } },
    evidenceOfPain: { type: "array", items: { type: "string" } },
    expectedUpside: { type: "string" },
    extractionFeasibility: { type: "string" },
    riskLevel: { type: "string" },
    whyTopFive: { type: "string" },
  },
  required: [
    "id",
    "path",
    "symbolOrUnit",
    "languageOrStack",
    "candidateType",
    "currentResponsibilities",
    "evidenceOfCoupling",
    "evidenceOfPain",
    "expectedUpside",
    "extractionFeasibility",
    "riskLevel",
    "whyTopFive",
  ],
};

const TARGET_EXPLORER_SCHEMA = {
  type: "object",
  properties: {
    explorerStrategy: { type: "string" },
    candidates: {
      type: "array",
      items: TARGET_CANDIDATE_SCHEMA,
    },
  },
  required: ["explorerStrategy", "candidates"],
};

const TARGET_COLLATION_SCHEMA = {
  type: "object",
  properties: {
    dedupedCandidates: {
      type: "array",
      items: TARGET_CANDIDATE_SCHEMA,
    },
    rejectedDuplicates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          duplicateId: { type: "string" },
          keptId: { type: "string" },
          reason: { type: "string" },
        },
        required: ["duplicateId", "keptId", "reason"],
      },
    },
    collationRationale: { type: "string" },
  },
  required: ["dedupedCandidates", "rejectedDuplicates", "collationRationale"],
};

const TARGET_JUDGE_SCHEMA = {
  type: "object",
  properties: {
    judgeLens: { type: "string" },
    first: { type: "string" },
    second: { type: "string" },
    third: { type: "string" },
    reasoning: { type: "string" },
  },
  required: ["judgeLens", "first", "second", "third", "reasoning"],
};

const TARGET_TIEBREAK_SCHEMA = {
  type: "object",
  properties: {
    winnerId: { type: "string" },
    reasoning: { type: "string" },
  },
  required: ["winnerId", "reasoning"],
};

const TARGET_RESOLUTION_SCHEMA = {
  type: "object",
  properties: {
    path: { type: "string" },
    symbolOrUnit: { type: "string" },
    languageOrStack: { type: "string" },
    candidateType: { type: "string" },
    selectionReason: { type: "string" },
    tournamentEvidence: { type: "string" },
  },
  required: ["path", "symbolOrUnit", "languageOrStack", "candidateType", "selectionReason"],
};

const PREFLIGHT_SCHEMA = {
  type: "object",
  properties: {
    primaryLanguage: { type: "string" },
    secondaryLanguages: { type: "array", items: { type: "string" } },
    frameworkOrRuntime: { type: "string" },
    packageOrBuildSystem: { type: "string" },
    commands: {
      type: "object",
      properties: {
        restoreOrInstall: { type: "string" },
        format: { type: "string" },
        staticAnalysis: { type: "string" },
        compileOrTypecheck: { type: "string" },
        testFocused: { type: "string" },
        testAll: { type: "string" },
        build: { type: "string" },
      },
      required: ["testFocused"],
    },
    targetPublicSurface: { type: "array", items: { type: "string" } },
    inboundCallers: { type: "array", items: { type: "string" } },
    relatedTests: { type: "array", items: { type: "string" } },
    repoConventions: { type: "array", items: { type: "string" } },
    dependencyRules: { type: "array", items: { type: "string" } },
    riskFlags: { type: "array", items: { type: "string" } },
  },
  required: [
    "primaryLanguage",
    "frameworkOrRuntime",
    "packageOrBuildSystem",
    "commands",
    "targetPublicSurface",
    "inboundCallers",
    "relatedTests",
    "repoConventions",
    "dependencyRules",
    "riskFlags",
  ],
};

const TOPOLOGY_SCHEMA = {
  type: "object",
  properties: {
    lens: { type: "string" },
    publicSurface: {
      type: "array",
      items: {
        type: "object",
        properties: {
          entrypoint: { type: "string" },
          compatibilityRequirement: { type: "string" },
          callers: { type: "array", items: { type: "string" } },
        },
        required: ["entrypoint", "compatibilityRequirement"],
      },
    },
    responsibilities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          responsibility: { type: "string" },
          currentLocations: { type: "array", items: { type: "string" } },
          inputs: { type: "array", items: { type: "string" } },
          outputs: { type: "array", items: { type: "string" } },
          stateOrMutation: { type: "array", items: { type: "string" } },
          sideEffects: { type: "array", items: { type: "string" } },
          dependencies: { type: "array", items: { type: "string" } },
          extractionRisk: { type: "string" },
        },
        required: [
          "name",
          "responsibility",
          "currentLocations",
          "inputs",
          "outputs",
          "stateOrMutation",
          "sideEffects",
          "dependencies",
          "extractionRisk",
        ],
      },
    },
    behaviorInvariants: { type: "array", items: { type: "string" } },
    unknowns: { type: "array", items: { type: "string" } },
  },
  required: ["lens", "publicSurface", "responsibilities", "behaviorInvariants", "unknowns"],
};

const CANONICAL_TOPOLOGY_SCHEMA = {
  type: "object",
  properties: {
    targetName: { type: "string" },
    publicApiLock: { type: "array", items: { type: "string" } },
    behaviorInvariants: { type: "array", items: { type: "string" } },
    responsibilities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          responsibility: { type: "string" },
          sourceLocations: { type: "array", items: { type: "string" } },
          boundaryNeeds: { type: "array", items: { type: "string" } },
          dependenciesToInjectOrPass: { type: "array", items: { type: "string" } },
          forbiddenDependencies: { type: "array", items: { type: "string" } },
          acceptanceCriteria: { type: "array", items: { type: "string" } },
          extractionOrderHint: { type: "number" },
        },
        required: [
          "id",
          "name",
          "responsibility",
          "sourceLocations",
          "boundaryNeeds",
          "dependenciesToInjectOrPass",
          "forbiddenDependencies",
          "acceptanceCriteria",
        ],
      },
    },
    integrationStrategy: { type: "string" },
    testStrategy: { type: "string" },
    redFlags: { type: "array", items: { type: "string" } },
  },
  required: [
    "targetName",
    "publicApiLock",
    "behaviorInvariants",
    "responsibilities",
    "integrationStrategy",
    "testStrategy",
    "redFlags",
  ],
};

const BOUNDARY_DESIGN_SCHEMA = {
  type: "object",
  properties: {
    boundaryFileOrLocation: { type: "string" },
    boundaryCodeOrDefinition: { type: "string" },
    modulePlan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          responsibilityId: { type: "string" },
          destinationPath: { type: "string" },
          abstractionName: { type: "string" },
          implementationName: { type: "string" },
          dependencyPassingStyle: { type: "string" },
          facadeTouchpoints: { type: "array", items: { type: "string" } },
        },
        required: [
          "responsibilityId",
          "destinationPath",
          "abstractionName",
          "implementationName",
          "dependencyPassingStyle",
          "facadeTouchpoints",
        ],
      },
    },
    rationale: { type: "string" },
    risks: { type: "array", items: { type: "string" } },
  },
  required: [
    "boundaryFileOrLocation",
    "boundaryCodeOrDefinition",
    "modulePlan",
    "rationale",
    "risks",
  ],
};

const EXTRACTION_PATCH_SCHEMA = {
  type: "object",
  properties: {
    responsibilityId: { type: "string" },
    responsibilityName: { type: "string" },
    newOrChangedFiles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          intendedChange: { type: "string" },
          codeOrPatchSummary: { type: "string" },
        },
        required: ["path", "intendedChange", "codeOrPatchSummary"],
      },
    },
    dependenciesMadeExplicit: { type: "array", items: { type: "string" } },
    preservedInvariants: { type: "array", items: { type: "string" } },
    openRisks: { type: "array", items: { type: "string" } },
  },
  required: [
    "responsibilityId",
    "responsibilityName",
    "newOrChangedFiles",
    "dependenciesMadeExplicit",
    "preservedInvariants",
    "openRisks",
  ],
};

const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    blockingIssues: { type: "array", items: { type: "string" } },
    nonBlockingIssues: { type: "array", items: { type: "string" } },
    requiredChanges: { type: "array", items: { type: "string" } },
  },
  required: ["pass", "blockingIssues", "nonBlockingIssues", "requiredChanges"],
};

const VERIFY_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    checkName: { type: "string" },
    evidence: { type: "string" },
    failures: { type: "array", items: { type: "string" } },
    suspectedRootCauses: { type: "array", items: { type: "string" } },
  },
  required: ["ok", "checkName", "evidence", "failures", "suspectedRootCauses"],
};

const VERIFICATION_SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    passedChecks: { type: "array", items: { type: "string" } },
    failedChecks: { type: "array", items: { type: "string" } },
    rootCauses: { type: "array", items: { type: "string" } },
    nextRepairInstructions: { type: "array", items: { type: "string" } },
  },
  required: ["ok", "passedChecks", "failedChecks", "rootCauses", "nextRepairInstructions"],
};

const REFACTOR_PLAN_SCHEMA = {
  type: "object",
  properties: {
    mode: { type: "string" },
    proceed: { type: "boolean" },
    decision: {
      type: "string",
      enum: ["proceed", "downscope-and-proceed", "characterization-only", "abort"],
    },
    selectedResponsibilityIds: { type: "array", items: { type: "string" } },
    deferredResponsibilityIds: { type: "array", items: { type: "string" } },
    planSummary: { type: "string" },
    stagedImplementationPlan: { type: "string" },
    publicApiStrategy: { type: "string" },
    characterizationTestPlan: { type: "string" },
    boundaryDesignConstraints: { type: "array", items: { type: "string" } },
    expectedFilesTouched: { type: "array", items: { type: "string" } },
    behaviorRisks: { type: "array", items: { type: "string" } },
    dependencyRisks: { type: "array", items: { type: "string" } },
    abstractionRisks: { type: "array", items: { type: "string" } },
    blastRadius: { type: "string" },
    stopConditions: { type: "array", items: { type: "string" } },
    reviewFindings: { type: "array", items: { type: "string" } },
  },
  required: [
    "mode",
    "proceed",
    "decision",
    "selectedResponsibilityIds",
    "deferredResponsibilityIds",
    "planSummary",
    "stagedImplementationPlan",
    "publicApiStrategy",
    "characterizationTestPlan",
    "boundaryDesignConstraints",
    "expectedFilesTouched",
    "behaviorRisks",
    "dependencyRisks",
    "abstractionRisks",
    "blastRadius",
    "stopConditions",
    "reviewFindings",
  ],
};

const PLAN_REVIEW_SCHEMA = {
  type: "object",
  properties: {
    critic: { type: "string" },
    lens: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          severity: { type: "string", enum: ["blocking", "nonblocking"] },
          evidence: { type: "string" },
          affectedPlanFields: { type: "array", items: { type: "string" } },
          requiredChange: { type: "string" },
        },
        required: ["id", "title", "severity", "evidence", "affectedPlanFields", "requiredChange"],
      },
    },
    summary: { type: "string" },
  },
  required: ["critic", "lens", "findings", "summary"],
};

const ISSUE_LEDGER_SCHEMA = {
  type: "object",
  properties: {
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          critic: { type: "string" },
          title: { type: "string" },
          severity: { type: "string", enum: ["blocking", "nonblocking"] },
          status: { type: "string", enum: ["open", "fixed", "invalid", "deferred"] },
          evidence: { type: "string" },
          affectedPlanFields: { type: "array", items: { type: "string" } },
          requiredChange: { type: "string" },
          createdRound: { type: "number" },
          lastSeenRound: { type: "number" },
        },
        required: [
          "id",
          "critic",
          "title",
          "severity",
          "status",
          "evidence",
          "affectedPlanFields",
          "requiredChange",
          "createdRound",
          "lastSeenRound",
        ],
      },
    },
    collationRationale: { type: "string" },
  },
  required: ["issues", "collationRationale"],
};

const PLAN_GATE_SCHEMA = {
  type: "object",
  properties: {
    approvedPlan: { type: "object", properties: REFACTOR_PLAN_SCHEMA.properties },
    issueLedger: { type: "object", properties: ISSUE_LEDGER_SCHEMA.properties },
    stopReason: { type: "string" },
  },
  required: ["approvedPlan", "issueLedger", "stopReason"],
};

async function resolveTarget() {
  phase("Target Resolution");

  if (suppliedTarget) {
    return agent(
      `
Resolve the supplied refactor target into a precise repository target descriptor.

Supplied target:
${suppliedTarget}

Rules:
- Identify the concrete file/path and symbol/unit when possible.
- Infer language, stack, and unit type.
- Do not edit files.
- Return a descriptor suitable for downstream analysis.
`,
      {
        label: "resolve-supplied-target",
        phase: "Target Resolution",
        schema: TARGET_RESOLUTION_SCHEMA,
      },
    );
  }

  const explorerStrategies = [
    "Search for oversized or highly coupled files/classes/components/services with many responsibilities and many inbound callers.",
    "Search for modules with high churn risk: broad imports, brittle tests, TODOs, conditionals, feature flags, or repeated bug-prone edits.",
    "Search for architectural choke points: orchestration blobs, god objects, fat controllers, service locators, sagas, managers, handlers, processors, or utils folders.",
    "Search from the test surface: weakly tested but important code, skipped tests, integration-heavy seams, behavior that deserves characterization before extraction.",
    "Search from dependency topology: cycle-prone modules, cross-layer imports, framework leakage, global state, IO mixed with domain logic, or concrete dependencies that should be inverted.",
  ];

  const explorerReports = (
    await parallel(
      explorerStrategies.map(
        (strategy, index) => () =>
          agent(
            `
You are target explorer ${index + 1} of 5.

Strategy:
${strategy}

Task:
Scan the repository and return your top 5 refactor candidates.

Definition of a strong candidate:
- It has real evidence of coupling, mixed responsibilities, or architectural drag.
- It is important enough to matter.
- It is extractable without requiring a rewrite of the whole application.
- It has a public surface or caller set that can be protected.
- It would benefit from decomposition, explicit boundaries, and characterization tests.

Rules:
- Be language and framework agnostic.
- Use exact paths and symbols where possible.
- Do not edit files.
- Do not pick generated files, vendored code, migrations, snapshots, lockfiles, or pure config unless they are truly hand-maintained architecture.
- Prefer candidates with concrete evidence over vibes.
- Return exactly 5 candidates when the repo contains enough viable options.
`,
            {
              label: `target-explorer:${index + 1}`,
              phase: "Target Resolution",
              schema: TARGET_EXPLORER_SCHEMA,
            },
          ),
      ),
    )
  ).filter(Boolean);

  const collation = await agent(
    `
Collate the 25 proposed candidates into the best 5 unique candidates.

Explorer reports:
${j(explorerReports)}

Deduplication rules:
- Same path and same symbol/unit means duplicate.
- Same path but different nested symbol can remain separate only if they are genuinely independent refactor targets.
- Keep the better-worded, better-evidenced, more actionable version of each duplicate.
- Prefer candidates with high upside, clear evidence, feasible boundaries, and testable behavior.
- Return exactly 5 candidates if 5 viable candidates exist.
`,
    {
      label: "target-collator",
      phase: "Target Resolution",
      schema: TARGET_COLLATION_SCHEMA,
    },
  );

  const finalists = (collation.dedupedCandidates || []).slice(0, 5);

  if (!finalists.length) {
    return {
      status: "aborted-no-target-candidates",
      target: suppliedTarget,
      reason: "No viable refactor candidates were found in the repository.",
      preflight: null,
      topologyReports: null,
      canonicalTopology: null,
    };
  }

  const judgeLenses = [
    "Highest architectural leverage: choose the candidate whose cleanup most improves the codebase structure.",
    "Highest safe ROI: choose the candidate with the best upside-to-risk ratio and clearest verification path.",
    "Best decomposition target: choose the candidate with the cleanest true responsibility seams and least fake abstraction risk.",
  ];

  const judgeVotes = (
    await parallel(
      judgeLenses.map(
        (lens, index) => () =>
          agent(
            `
You are target judge ${index + 1} of 3.

Judge lens:
${lens}

Finalist candidates:
${j(finalists)}

Task:
Rank up to 3 candidates, or fewer if fewer finalists exist.

Scoring used downstream:
- first = 3 points
- second = 2 points
- third = 1 point

Rules:
- Use candidate ids exactly as provided.
- Do not invent candidates.
- Prefer concrete repository evidence over theoretical elegance.
- Penalize candidates that are too risky, too vague, generated, peripheral, or likely to become an abstraction vanity project.
`,
            {
              label: `target-judge:${index + 1}`,
              phase: "Target Resolution",
              schema: TARGET_JUDGE_SCHEMA,
            },
          ),
      ),
    )
  ).filter(Boolean);

  const byId = new Map(finalists.map((candidate) => [candidate.id, candidate]));
  const scores = new Map(finalists.map((candidate) => [candidate.id, 0]));

  for (const vote of judgeVotes) {
    const first = vote.first;
    const second = vote.second;
    const third = vote.third;

    if (scores.has(first)) scores.set(first, scores.get(first) + 3);
    if (scores.has(second)) scores.set(second, scores.get(second) + 2);
    if (scores.has(third)) scores.set(third, scores.get(third) + 1);
  }

  const sortedScores = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const topScore = sortedScores[0]?.[1] || 0;
  const tiedWinners = sortedScores
    .filter(([, score]) => score === topScore)
    .map(([id]) => byId.get(id))
    .filter(Boolean);

  let winner = tiedWinners[0];

  if (tiedWinners.length > 1) {
    const tiebreak = await agent(
      `
Resolve a first-place tie in the target tournament.

Tied candidates:
${j(tiedWinners)}

All judge votes:
${j(judgeVotes)}

Scores:
${j(Object.fromEntries(scores))}

Tie-break policy:
1. Prefer the candidate with the clearest behavior-preserving verification path.
2. Then prefer the candidate with the strongest evidence of real coupling.
3. Then prefer the candidate with lower blast radius.
4. Then prefer the candidate with higher architectural leverage.
5. If still indistinguishable, choose the candidate whose description is most precise and implementation-ready.

Return exactly one winner id.
`,
      {
        label: "target-tiebreak",
        phase: "Target Resolution",
        schema: TARGET_TIEBREAK_SCHEMA,
      },
    );

    winner = byId.get(tiebreak.winnerId) || tiedWinners[0];
  }

  return {
    path: winner.path,
    symbolOrUnit: winner.symbolOrUnit,
    languageOrStack: winner.languageOrStack,
    candidateType: winner.candidateType,
    selectionReason: winner.whyTopFive,
    tournamentEvidence: j({
      scores: Object.fromEntries(scores),
      judgeVotes,
      collationRationale: collation.collationRationale,
      winner,
    }),
  };
}

async function verifyAll(target, preflight, roundLabel, approvedPlan, issueLedger) {
  phase("Verification Matrix");

  const checks = [
    {
      key: "focused-tests",
      prompt: `Run the focused tests for the target. Command or approach: ${preflight.commands.testFocused || "discover and run the narrowest relevant test command"}`,
    },
    {
      key: "full-or-relevant-tests",
      prompt: `Run the broader relevant test suite. Command or approach: ${preflight.commands.testAll || preflight.commands.testFocused || "discover and run the most appropriate available tests"}`,
    },
    {
      key: "compile-static-analysis",
      prompt: `Run compile/typecheck/static-analysis appropriate for this repo. Commands: compile/typecheck=${preflight.commands.compileOrTypecheck || "none discovered"}, staticAnalysis=${preflight.commands.staticAnalysis || "none discovered"}`,
    },
    {
      key: "build",
      prompt: `Run or validate the build if available. Command: ${preflight.commands.build || "none discovered"}`,
    },
    {
      key: "public-api-compatibility",
      prompt: `Compare caller-facing behavior before and after the refactor. ${strictPublicApiRule}`,
    },
    {
      key: "dependency-direction",
      prompt: `Inspect the dependency graph around the target. Confirm extracted units do not import the facade/orchestrator/old monolith, and no new dependency cycles or cross-layer violations were introduced. Only verify selected responsibilities.`,
    },
    {
      key: "behavioral-invariants",
      prompt: `Audit tests and diff evidence for preserved behavior: defaults, ordering, mutation timing, caching, IO, async/concurrency semantics, exceptions/errors, null handling, and framework lifecycle behavior.`,
    },
    {
      key: "approved-scope",
      prompt: `Verify the implementation did not exceed approvedPlan.selectedResponsibilityIds, approvedPlan.deferredResponsibilityIds, or approvedPlan.expectedFilesTouched. Confirm deferred responsibilities were not accidentally refactored. Confirm abstraction level matches the approved plan. Confirm blast radius stayed within approvedPlan.blastRadius unless justified.`,
    },
  ];

  const rawChecks = await parallel(
    checks.map(
      (check) => () =>
        agent(
          `
You are verification agent "${check.key}" for round "${roundLabel}".

Target:
${j(target)}

Preflight:
${j(preflight)}

Approved plan:
${j(approvedPlan)}

Issue ledger:
${j(issueLedger)}

Task:
${check.prompt}

Rules:
- Do not edit files.
- Prefer commands and evidence over opinion.
- If a command cannot run, explain the concrete blocker and whether that blocker invalidates confidence.
`,
          {
            label: `verify:${roundLabel}:${check.key}`,
            phase: "Verification Matrix",
            schema: VERIFY_SCHEMA,
          },
        ),
    ),
  );

  const results = rawChecks.filter(Boolean);

  return agent(
    `
Synthesize verification results into a single go/no-go.

Target:
${j(target)}

Approved plan:
${j(approvedPlan)}

Issue ledger:
${j(issueLedger)}

Verification results:
${j(results)}

Return ok=true only when:
- focused tests pass,
- broader relevant tests pass or the reason they cannot run is non-blocking and explicit,
- compile/static-analysis/build health is acceptable for this repo,
- public API compatibility is preserved unless explicitly allowed,
- dependency direction is improved or at least not worsened,
- behavior invariants are protected by tests or strong diff evidence,
- implementation did not exceed approvedPlan.selectedResponsibilityIds or approvedPlan.deferredResponsibilityIds,
- no deferred responsibilities were accidentally refactored.

If not ok, produce precise repair instructions ordered by root cause.
`,
    {
      label: `verify-summary:${roundLabel}`,
      phase: "Verification Matrix",
      schema: VERIFICATION_SUMMARY_SCHEMA,
    },
  );
}

const target = await resolveTarget();

phase("Preflight");
log(`Selected target: ${target.path}${target.symbolOrUnit ? ` :: ${target.symbolOrUnit}` : ""}`);

const preflight = await agent(
  `
Inspect the repository and selected target.

Selected target:
${j(target)}

Goal:
${refactorGoal}

Package/build-system hint:
${packageManagerHint}

Find:
1. Primary language, framework/runtime, package/build system, and repo structure.
2. Exact commands or best available commands for restore/install, format, static analysis, compile/typecheck, focused tests, broader tests, and build.
3. The caller-facing public surface of the selected target.
4. Every inbound caller and related test.
5. Repository conventions: naming, layout, layering, test style, dependency boundaries, formatting.
6. Risk flags: global state, singleton behavior, caches, IO, environment reads, hidden initialization, framework lifecycle, reflection, serialization, concurrency, mutation, events, decorators/attributes/annotations/macros.

Rules:
- Do not edit files.
- Be language agnostic.
- Do not assume TypeScript, interfaces, classes, dependency injection containers, or a particular test runner.
- Return only validated, repository-grounded facts.
`,
  {
    label: "preflight",
    phase: "Preflight",
    schema: PREFLIGHT_SCHEMA,
  },
);

phase("Topology Swarm");

const topologyLenses = [
  {
    key: "public-surface-callers",
    prompt:
      "Map caller-facing entrypoints, signatures/protocols/contracts, call sites, compatibility requirements, error behavior, and initialization expectations.",
  },
  {
    key: "state-side-effects",
    prompt:
      "Map mutation, shared state, caches, IO, environment access, database/network/filesystem usage, timers, event subscriptions, lifecycle hooks, and hidden side effects.",
  },
  {
    key: "responsibility-seams",
    prompt:
      "Identify real cohesive responsibilities and domain seams. Avoid superficial method grouping or abstraction for its own sake.",
  },
  {
    key: "dataflow-boundaries",
    prompt:
      "Trace data shapes, validation, serialization, nullability, error propagation, concurrency boundaries, and dependency flow.",
  },
  {
    key: "tests-behavior",
    prompt:
      "Inspect existing tests and infer missing characterization tests required before safe extraction.",
  },
  {
    key: "architecture-risk",
    prompt:
      "Identify extraction order, circular dependency risk, framework leakage, over-abstraction risk, and safest facade/composition strategy.",
  },
];

const topologyReports = (
  await parallel(
    topologyLenses.map(
      (lens) => () =>
        agent(
          `
You are topology analyst "${lens.key}".

Selected target:
${j(target)}

Preflight:
${j(preflight)}

Lens:
${lens.prompt}

Rules:
- Do not edit files.
- Use exact paths, symbols, functions, classes, components, services, modules, or methods where relevant.
- Distinguish confirmed facts from inferred risks.
- Be idiomatic to the detected language and framework.
- Do not invent clean seams that the code does not support.
`,
          {
            label: `topology:${lens.key}`,
            phase: "Topology Swarm",
            schema: TOPOLOGY_SCHEMA,
          },
        ),
    ),
  )
).filter(Boolean);

phase("Topology Adjudication");

const canonicalTopology = await agent(
  `
Fuse these independent topology reports into one canonical decomposition plan.

Selected target:
${j(target)}

Preflight:
${j(preflight)}

Reports:
${j(topologyReports)}

Rules:
- Resolve contradictions explicitly.
- Keep only responsibilities backed by real code evidence.
- Define behavior invariants that must survive.
- Define the public API lock.
- Define acceptance criteria per extracted responsibility.
- Choose a language-idiomatic integration strategy: facade, composition root, adapter, port/protocol, partial class, package-private module, trait, interface, abstract base, function boundary, service boundary, or equivalent.
- Do not impose TypeScript-style interfaces on languages or repos where that is non-idiomatic.
- Prefer smallest safe decomposition over maximal abstraction.
- ${strictPublicApiRule}
`,
  {
    label: "adjudicate-topology",
    phase: "Topology Adjudication",
    schema: CANONICAL_TOPOLOGY_SCHEMA,
  },
);

if (!canonicalTopology.responsibilities.length) {
  return {
    status: "aborted-no-safe-responsibility-seams",
    target,
    reason: "No cohesive extraction seams survived topology adjudication.",
    preflight,
    topologyReports,
    canonicalTopology
  };
}

const _topologyPacket = {
  targetName: canonicalTopology.targetName,
  publicApiLock: canonicalTopology.publicApiLock,
  behaviorInvariants: canonicalTopology.behaviorInvariants,
  responsibilityCount: canonicalTopology.responsibilities.length,
  integrationStrategy: canonicalTopology.integrationStrategy,
  testStrategy: canonicalTopology.testStrategy,
  redFlags: canonicalTopology.redFlags,
};

phase("Refactor Plan Gate");

const initialPlan = await agent(
  `
Create the smallest safe implementation plan for this refactor run.

Selected target:
${j(target)}

Preflight:
${j(preflight)}

Canonical topology:
${j(canonicalTopology)}

Refactor mode:
${refactorMode}

Strict public API rule:
${strictPublicApiRule}

Refactor goal:
${refactorGoal}

Rules:
- Propose the exact implementation scope for this run.
- Do not assume TypeScript or any specific language.
- Choose language/framework-idiomatic boundaries.
- In "smallest-safe" mode: select the smallest extraction that removes one real responsibility, improves testability, preserves behavior, and creates a safe path for later extractions.
- In "balanced" mode: select the highest-value subset of responsibilities that can safely complete in one run without broad caller churn.
- In "maximum-transform" mode: allow broader decomposition only when characterization, public API clarity, and dependency seams are strong enough.
- Include all required fields in the returned plan.
`,
  {
    label: "refactor-plan-gate-initial",
    phase: "Refactor Plan Gate",
    schema: REFACTOR_PLAN_SCHEMA,
  },
);

const criticLenses = [
  {
    key: "behavior-risk",
    prompt:
      "Critique the plan for behavior risks: preserved invariants, side effects, mutation timing, async/concurrency, error behavior, edge cases, null handling, and lifecycle behavior.",
  },
  {
    key: "dependency-direction",
    prompt:
      "Critique the plan for dependency direction risks: ensure extracted units do not import the old monolith, no circular dependencies, cross-layer violations, or hidden coupling.",
  },
  {
    key: "abstraction-overengineering",
    prompt:
      "Critique the plan for abstraction bloat. Aggressively reject: fake interfaces/protocols/traits with no real reason, service/factory/container/manager cosplay, unnecessary inheritance, broad abstractions not backed by real volatility, dependency injection where simple parameters/modules/functions are cleaner, and extraction that makes the code more abstract but not more understandable.",
  },
  {
    key: "test-sufficiency",
    prompt:
      "Critique the plan for test sufficiency: characterization test coverage, testability of extracted units, risk of behavior loss without test protection, and whether the characterization test plan is adequate.",
  },
  {
    key: "migration-blast-radius",
    prompt:
      "Critique the plan for migration and blast radius: caller churn, file touch count, public API compatibility, and whether the expected scope is realistic.",
  },
];

function hasOpenBlockingIssues(ledger) {
  return (ledger.issues || []).some(
    (issue) => issue.status === "open" && issue.severity === "blocking",
  );
}

async function runStablePlanCritics(plan, ledger, round) {
  const previousIssues = ledger.issues || [];
  const openPreviousBlockers = previousIssues.filter(
    (issue) => issue.status === "open" && issue.severity === "blocking",
  );

  const findings = await parallel(
    criticLenses.map(
      (lens) => () =>
        agent(
          `
You are the ${lens.key} critic for the Refactor Plan Gate.

Round: ${round}
Is initial round: ${round === 1 ? "yes" : "no"}

Previous open blocking issues:
${j(openPreviousBlockers)}

Plan:
${j(plan)}

Selected target:
${j(target)}

Preflight:
${j(preflight)}

Canonical topology:
${j(canonicalTopology)}

Critic lens:
${lens.prompt}

Rules:
${round === 1 ? "- Review the full plan and create findings freely." : "- Do NOT perform an open-ended fresh review. Review only the repaired plan, the previous issue ledger, whether previous blocking issues were fixed, and whether the repair introduced new blocking issues."}
${round === 1 ? "" : "- In round 2+, a new blocking issue is allowed only if it is: caused by the latest repair, directly violates approved scope, directly violates public API compatibility, directly weakens characterization, creates a dependency-direction problem, creates an abstraction that the plan did not approve, or has concrete evidence of behavior risk."}
${round === 1 ? "" : "- Subjective improvements, broader architecture ideas, naming preferences, and deferred-responsibility complaints must be marked nonblocking or deferred."}
- Reject vague or subjective issues.
- Each finding must have concrete evidence.
`,
          {
            label: `plan-gate-critic:${lens.key}:round-${round}`,
            phase: "Refactor Plan Gate",
            schema: PLAN_REVIEW_SCHEMA,
          },
        ),
    ),
  );

  return findings.filter(Boolean);
}

async function collateIssueLedger(prevLedger, reviews, round) {
  const rawFindings = reviews.flatMap((review) => review.findings || []);
  const collation = await agent(
    `
Collate critic findings into a canonical issue ledger.

Previous ledger:
${j(prevLedger)}

Raw findings from round ${round}:
${j(rawFindings)}

Rules:
- Dedupe repeated issues.
- Preserve stable issue ids where possible.
- Mark fixed issues as fixed.
- Mark invalid issues as invalid.
- Keep unresolved valid issues open.
- Reject vague or subjective new issues.
- Classify out-of-scope findings as deferred.
- Set lastSeenRound for every issue.
- Ensure createdRound is preserved for existing issues.
`,
    {
      label: `plan-gate-collate:round-${round}`,
      phase: "Refactor Plan Gate",
      schema: ISSUE_LEDGER_SCHEMA,
    },
  );

  return collation;
}

async function repairOrDownscopePlan(plan, ledger, round) {
  return agent(
    `
Repair or downscope the plan based on the issue ledger.

Plan:
${j(plan)}

Issue ledger:
${j(ledger)}

Round: ${round} of ${maxPlanGateRounds}

Rules:
- Fix blocking issues only.
- Reduce scope to a smaller viable incision if needed.
- Move valid but out-of-scope concerns to deferred.
- You may switch decision to "characterization-only".
- You may switch decision to "abort".
- You must NOT expand scope.
- Only switch to "abort" if there is no safe path forward.
- Return a revised plan with all required fields.
`,
    {
      label: `plan-gate-repair:round-${round}`,
      phase: "Refactor Plan Gate",
      schema: REFACTOR_PLAN_SCHEMA,
    },
  );
}

const initialReviews = await runStablePlanCritics(
  initialPlan,
  { issues: [], collationRationale: "" },
  1,
);
let issueLedger = await collateIssueLedger(
  { issues: [], collationRationale: "Initial ledger from round 1." },
  initialReviews,
  1,
);

let planGateRepairRound = 0;
let currentPlan = initialPlan;

while (
  planGateRepairRound < maxPlanGateRounds &&
  hasOpenBlockingIssues(issueLedger) &&
  currentPlan.decision !== "characterization-only" &&
  currentPlan.decision !== "abort"
) {
  planGateRepairRound += 1;
  currentPlan = await repairOrDownscopePlan(currentPlan, issueLedger, planGateRepairRound);
  const reviews = await runStablePlanCritics(currentPlan, issueLedger, planGateRepairRound + 1);
  issueLedger = await collateIssueLedger(issueLedger, reviews, planGateRepairRound + 1);
}

if (planGateRepairRound >= maxPlanGateRounds && hasOpenBlockingIssues(issueLedger)) {
  if (currentPlan.characterizationTestPlan && currentPlan.characterizationTestPlan.length > 0) {
    currentPlan.decision = "characterization-only";
  } else {
    currentPlan.decision = "abort";
  }
  currentPlan.proceed = false;
}

const planGateResult = await agent(
  `
Synthesize the final approved plan from the Refactor Plan Gate.

Current plan:
${j(currentPlan)}

Issue ledger:
${j(issueLedger)}

Stop reason:
${hasOpenBlockingIssues(issueLedger) ? "maxPlanGateRounds reached with open blocking issues" : "no open blocking issues"}

Repair rounds used:
${planGateRepairRound}

Rules:
- proceed is true only when decision is "proceed" or "downscope-and-proceed".
- Preserve all plan fields.
- Summarize the final gate outcome.
`,
  {
    label: "plan-gate-final",
    phase: "Refactor Plan Gate",
    schema: PLAN_GATE_SCHEMA,
  },
);

const approvedPlan = planGateResult.approvedPlan;
issueLedger = planGateResult.issueLedger || issueLedger;

if (approvedPlan.decision === "characterization-only") {
  const characterization = await agent(
    `
Before production refactoring, strengthen regression protection for the selected target.

Selected target:
${j(target)}

Preflight:
${j(preflight)}

Canonical topology:
${j(canonicalTopology)}

Approved plan:
${j(approvedPlan)}

Issue ledger:
${j(issueLedger)}

Task:
1. Add or strengthen characterization tests according to the approvedPlan.characterizationTestPlan.
2. Follow the repository's actual testing idioms.
3. Run the focused tests and the relevant compile/static-analysis command if available.
4. Fix only the tests/harness if the new tests are incorrectly written. Do not refactor production behavior yet.

Rules:
- Do not weaken existing tests.
- Do not change production behavior during this phase unless strictly required to expose test seams, and if so, preserve behavior exactly.
- Summarize files changed and command evidence.
`,
    {
      label: "characterization-harness",
      phase: "Characterization Harness",
    },
  );

  return {
    status: "characterization-only",
    selectedTarget: target,
    approvedPlan,
    issueLedger,
    preflight,
    canonicalTopology,
    characterization
  };
}

if (approvedPlan.decision === "abort") {
  return {
    status: "aborted-plan-gate",
    selectedTarget: target,
    approvedPlan,
    issueLedger,
    preflight,
    canonicalTopology
  };
}

const _planGatePacket = {
  mode: approvedPlan.mode,
  decision: approvedPlan.decision,
  selectedResponsibilityIds: approvedPlan.selectedResponsibilityIds,
  deferredResponsibilityIds: approvedPlan.deferredResponsibilityIds,
  planSummary: approvedPlan.planSummary,
  publicApiStrategy: approvedPlan.publicApiStrategy,
  blastRadius: approvedPlan.blastRadius,
  stopConditions: approvedPlan.stopConditions,
  openBlockingIssues: openBlockingIssuesOnly(issueLedger).issues,
};

const approvedResponsibilityIds = new Set(approvedPlan.selectedResponsibilityIds || []);

const orderedResponsibilities = canonicalTopology.responsibilities
  .filter((responsibility) => approvedResponsibilityIds.has(responsibility.id))
  .slice()
  .sort((a, b) => (a.extractionOrderHint || 0) - (b.extractionOrderHint || 0));

if (!orderedResponsibilities.length) {
  return {
    status: "aborted-no-approved-responsibilities",
    selectedTarget: target,
    approvedPlan,
    issueLedger,
    preflight,
    canonicalTopology
  };
}

phase("Characterization Harness");

const characterization = await agent(
  `
Before production refactoring, strengthen regression protection for the selected target.

Selected target:
${j(target)}

Preflight:
${j(preflight)}

Canonical topology:
${j(canonicalTopology)}

Approved plan:
${j(approvedPlan)}

Issue ledger:
${j(issueLedger)}

Task:
1. Add or strengthen characterization tests according to the approvedPlan.characterizationTestPlan.
2. Cover public surface, side effects, edge cases, error behavior, ordering, async/concurrency behavior, mutation/caching, serialization, framework lifecycle, and integration boundaries.
3. Follow the repository's actual testing idioms.
4. Run the focused tests and the relevant compile/static-analysis command if available.
5. Fix only the tests/harness if the new tests are incorrectly written. Do not refactor production behavior yet.

Rules:
- Do not weaken existing tests.
- Do not change production behavior during this phase unless strictly required to expose test seams, and if so, preserve behavior exactly.
- Only cover responsibilities in approvedPlan.selectedResponsibilityIds.
- Summarize files changed and command evidence.
`,
  {
    label: "characterization-harness",
    phase: "Characterization Harness",
  },
);

const characterizationPacket = {
  selectedResponsibilityIds: approvedPlan.selectedResponsibilityIds,
  characterizationTestPlan: approvedPlan.characterizationTestPlan,
  filesChanged: approvedPlan.expectedFilesTouched,
  stopConditions: approvedPlan.stopConditions,
};

phase("Contract Tournament");

const boundaryDesignStyles = [
  "minimal-language-idiomatic-boundaries",
  "domain-cohesion-boundaries",
  "testability-first-boundaries",
  "migration-safety-boundaries",
];

const boundaryCandidates = (
  await parallel(
    boundaryDesignStyles.map(
      (style) => () =>
        agent(
          `
Design a language-idiomatic boundary architecture for decomposing the selected target.

Do not output full implementation code. Output only boundary shape, file destinations, dependency style, facade touchpoints, risks, and concise rationale. The final synthesis agent will produce exact definitions.

Return concise findings only. Maximum 8 findings. Each finding max 40 words. Do not include raw command logs unless a failure requires a short excerpt.

Style:
${style}

Selected target:
${j(target)}

Preflight:
${j(preflight)}

Canonical topology (compact):
${j(selectedTopologyOnly(canonicalTopology, approvedPlan))}

Approved plan:
${j(approvedPlan)}

Issue ledger (open blockers only):
${j(openBlockingIssuesOnly(issueLedger))}

Hard rules:
- ${strictPublicApiRule}
- Use the abstraction mechanism that fits the detected stack: interface, protocol, trait, abstract class, delegate, function boundary, adapter, port, composition root, package-private module, partial class, internal service, or equivalent.
- Do not force dependency injection containers where simple explicit construction or parameter passing is better.
- Extracted units must not import the facade/orchestrator/old monolith.
- Preserve behavior, side-effect timing, framework lifecycle, and caller semantics.
- Include exact destination paths and boundary definitions.
- Keep the design strict enough to prevent backsliding but small enough to avoid enterprise cosplay.
- Design boundaries only for approvedPlan.selectedResponsibilityIds.
- Preserve future compatibility for approvedPlan.deferredResponsibilityIds.
`,
          {
            label: `boundary-design:${style}`,
            phase: "Contract Tournament",
            schema: BOUNDARY_DESIGN_SCHEMA,
          },
        ),
    ),
  )
).filter(Boolean);

const canonicalBoundary = await agent(
  `
Judge the competing boundary designs and synthesize the strongest final architecture.

Selected target:
${j(target)}

Preflight:
${j(preflight)}

Canonical topology:
${j(canonicalTopology)}

Approved plan:
${j(approvedPlan)}

Issue ledger:
${j(issueLedger)}

Candidates:
${j(boundaryCandidates)}

Choose or synthesize the design that maximizes:
1. Behavior preservation.
2. Idiomatic fit for the detected language/framework.
3. Smallest safe public boundary.
4. Low coupling.
5. Low migration risk.
6. Testability.
7. No circular dependencies.
8. Clear ownership of side effects.
9. Alignment with approvedPlan.selectedResponsibilityIds.
10. Future compatibility for approvedPlan.deferredResponsibilityIds.

Return the exact final boundary location/definition and module plan.
`,
  {
    label: "judge-boundary-designs",
    phase: "Contract Tournament",
    schema: BOUNDARY_DESIGN_SCHEMA,
  },
);

const boundaryPacket = {
  selectedResponsibilityIds: approvedPlan.selectedResponsibilityIds,
  boundaryFileOrLocation: canonicalBoundary.boundaryFileOrLocation,
  modulePlan: canonicalBoundary.modulePlan,
  risks: canonicalBoundary.risks,
};

phase("Extraction Pipeline");

const extractedResponsibilities = await pipeline(
  orderedResponsibilities,

  async (responsibility, _, index) => {
    return agent(
      `
Draft the extraction for one responsibility. Do not apply edits yet unless the workflow environment expects draft agents to edit; otherwise return an implementation-ready patch plan.

Return concise findings only. Maximum 8 findings. Each finding max 40 words. Do not include raw command logs unless a failure requires a short excerpt.

Selected target:
${j(target)}

Preflight:
${j(preflight)}

Canonical topology (compact):
${j(selectedTopologyOnly(canonicalTopology, approvedPlan))}

Boundary packet:
${j(boundaryPacket)}

Approved plan:
${j(approvedPlan)}

Issue ledger (open blockers only):
${j(openBlockingIssuesOnly(issueLedger))}

Characterization summary:
${characterization}

Responsibility:
${j(responsibility)}

Rules:
- Be idiomatic to the detected language and framework.
- Extract only this responsibility.
- Do not import the facade/orchestrator/old monolith from the extracted unit.
- Make dependencies explicit through the least complex appropriate mechanism.
- Preserve behavior exactly.
- Preserve side-effect timing, error behavior, lifecycle behavior, async/concurrency semantics, and mutation semantics.
- Avoid speculative abstractions.
- State required facade/composition changes as patch intent.
- Do not exceed approvedPlan.selectedResponsibilityIds or approvedPlan.expectedFilesTouched. Do not touch deferred responsibilities.
- Map any new issues to existing ledger ids or classify as: refactor-caused blocking, pre-existing, nonblocking, or deferred.
`,
      {
        label: `extract-draft:${responsibility.id || index}`,
        phase: "Extraction Pipeline",
        schema: EXTRACTION_PATCH_SCHEMA,
      },
    );
  },

  async (draft, originalResponsibility, index) => {
    const reviewLenses = [
      "behavior-correctness",
      "boundary-compliance",
      "dependency-direction",
      "idiomatic-simplicity",
    ];

    const reviews = (
      await parallel(
        reviewLenses.map(
          (lens) => () =>
            agent(
              `
Review this drafted extraction. Do not edit files.

Return concise findings only. Maximum 8 findings. Each finding max 40 words. Do not include raw command logs unless a failure requires a short excerpt.

Lens:
${lens}

Original responsibility:
${j(originalResponsibility)}

Draft:
${j(draft)}

Boundary packet:
${j(boundaryPacket)}

Approved plan:
${j(approvedPlan)}

Issue ledger (open blockers only):
${j(openBlockingIssuesOnly(issueLedger))}

Fail the draft if it:
- changes behavior,
- violates the public API lock,
- hides dependencies,
- imports the facade/orchestrator/old monolith,
- creates circular dependencies,
- fights the repo's language/framework idioms,
- over-abstracts beyond evidence,
- omits required edge cases,
- exceeds approved scope or touches deferred responsibilities.
`,
              {
                label: `review:${originalResponsibility.id || index}:${lens}`,
                phase: "Extraction Pipeline",
                schema: REVIEW_SCHEMA,
              },
            ),
        ),
      )
    ).filter(Boolean);

    return { draft, reviews };
  },

  async (reviewed, originalResponsibility, index) => {
    const blockingIssues = reviewed.reviews.flatMap((review) => review.blockingIssues || []);

    if (!blockingIssues.length) {
      return reviewed.draft;
    }

    return agent(
      `
Repair this responsibility extraction draft. Do not apply final integration edits.

Return concise findings only. Maximum 8 findings. Each finding max 40 words. Do not include raw command logs unless a failure requires a short excerpt.

Original responsibility:
${j(originalResponsibility)}

Draft:
${j(reviewed.draft)}

Reviews:
${j(reviewed.reviews)}

Boundary packet:
${j(boundaryPacket)}

Approved plan:
${j(approvedPlan)}

Issue ledger (open blockers only):
${j(openBlockingIssuesOnly(issueLedger))}

Task:
Return a revised patch object that resolves every blocking issue while preserving behavior, idiomatic style, public compatibility, and dependency direction.

Rules:
- Do not expand scope.
- Do not touch deferred responsibilities.
- Map any new issues to existing ledger ids or classify as: refactor-caused blocking, pre-existing, nonblocking, or deferred.
`,
      {
        label: `extract-repair:${originalResponsibility.id || index}`,
        phase: "Extraction Pipeline",
        schema: EXTRACTION_PATCH_SCHEMA,
      },
    );
  },
);

const acceptedPatches = extractedResponsibilities.filter(Boolean);

const patchPacket = {
  acceptedCount: acceptedPatches.length,
  responsibilityIds: acceptedPatches.map((p) => p.responsibilityId),
  filesTouched: [
    ...new Set(acceptedPatches.flatMap((p) => (p.newOrChangedFiles || []).map((f) => f.path))),
  ],
};

phase("Serial Integration");

const integration = await agent(
  `
Apply the complete decomposition in the real workspace.

Return concise findings only. Maximum 8 findings. Each finding max 40 words. Do not include raw command logs unless a failure requires a short excerpt.

Selected target:
${j(target)}

Preflight:
${j(preflight)}

Canonical topology (compact):
${j(selectedTopologyOnly(canonicalTopology, approvedPlan))}

Boundary packet:
${j(boundaryPacket)}

Approved plan:
${j(approvedPlan)}

Issue ledger (open blockers only):
${j(openBlockingIssuesOnly(issueLedger))}

Characterization packet:
${j(characterizationPacket)}

Patch packet:
${j(patchPacket)}

Hard requirements:
1. Apply the final boundary design in the idiomatic location for this repo.
2. Create or modify extracted responsibility units only for approvedPlan.selectedResponsibilityIds.
3. Rewrite the original target into the smallest safe facade/orchestrator/composition layer, or the detected language's equivalent.
4. Preserve every caller-facing entrypoint unless public API changes were explicitly allowed.
5. Preserve behavior, side effects, lifecycle, async/concurrency semantics, ordering, error behavior, serialization, and mutation semantics.
6. Do not leave dead duplicated logic unless it is a deliberate temporary compatibility shim, and label it clearly.
7. Do not introduce circular dependencies or cross-layer violations.
8. Update imports/usings/references/exports only where necessary.
9. Run formatter if the repo has one.
10. Do not broaden scope beyond this refactor.
11. Do not touch deferred responsibilities except where strictly necessary to preserve facade compatibility.
12. Map any new issues to existing ledger ids or classify as: refactor-caused blocking, pre-existing, nonblocking, or deferred.

After editing, summarize changed files, command evidence, and unresolved risk.
`,
  {
    label: "serial-integrator",
    phase: "Serial Integration",
  },
);

let verification = await verifyAll(target, preflight, "initial", approvedPlan, issueLedger);
let repairRound = 0;

while (!verification.ok && repairRound < maxRepairRounds) {
  repairRound += 1;
  phase("Repair Loop");

  await agent(
    `
Repair the refactor based only on verified failures.

Selected target:
${j(target)}

Repair round:
${repairRound} of ${maxRepairRounds}

Verification summary:
${j(verification)}

Boundary packet:
${j(boundaryPacket)}

Approved plan:
${j(approvedPlan)}

Issue ledger (open blockers only):
${j(openBlockingIssuesOnly(issueLedger))}

Patch packet:
${j(patchPacket)}

Rules:
- Fix root causes, not symptoms.
- Preserve public API compatibility unless explicitly allowed.
- Preserve characterization tests and behavior invariants.
- Do not delete or weaken tests to get green.
- Do not weaken types/contracts/static checks to hide errors.
- Do not introduce broad catch-all abstractions.
- Do not expand the refactor scope.
- Do not touch deferred responsibilities.
- Map any new issues to existing ledger ids or classify as: refactor-caused blocking, pre-existing, nonblocking, or deferred.
- After editing, run the narrowest command that proves the fix.
`,
    {
      label: `repair:${repairRound}`,
      phase: "Repair Loop",
    },
  );

  verification = await verifyAll(
    target,
    preflight,
    `repair-${repairRound}`,
    approvedPlan,
    issueLedger,
  );
}

phase("Final Audit");

const finalAudit = await agent(
  `
Perform an adversarial final audit of the completed refactor.

Return concise findings only. Maximum 8 findings. Each finding max 40 words. Do not include raw command logs unless a failure requires a short excerpt.

Selected target:
${j(target)}

Preflight:
${j(preflight)}

Canonical topology (compact):
${j(selectedTopologyOnly(canonicalTopology, approvedPlan))}

Boundary packet:
${j(boundaryPacket)}

Approved plan:
${j(approvedPlan)}

Issue ledger (open blockers only):
${j(openBlockingIssuesOnly(issueLedger))}

Patch packet:
${j(patchPacket)}

Integration summary:
${integration}

Final verification:
${j(verification)}

Audit:
1. Inspect the final diff.
2. Confirm public API compatibility.
3. Confirm extracted units do not import the facade/orchestrator/old monolith.
4. Confirm behavior was not silently dropped.
5. Confirm characterization tests protect the riskiest behavior.
6. Confirm abstraction level is justified by actual seams and matches the approved plan.
7. Confirm no dead duplicate logic, hidden singleton, dependency cycle, or cross-layer violation remains.
8. Confirm the result is idiomatic for the detected language/framework.
9. Confirm no open blocking plan-gate issues remain.
10. Confirm implementation did not exceed approvedPlan.selectedResponsibilityIds or approvedPlan.expectedFilesTouched.
11. Confirm deferred responsibilities were not accidentally refactored.
12. Confirm blast radius stayed within approvedPlan.blastRadius unless justified.
13. Confirm no critic churn was accepted as scope expansion.
14. Produce a final verdict.

Do not edit files.
`,
  {
    label: "final-adversarial-audit",
    phase: "Final Audit",
    schema: {
      type: "object",
      properties: {
        pass: { type: "boolean" },
        verdict: { type: "string" },
        remainingRisks: { type: "array", items: { type: "string" } },
        changedFiles: { type: "array", items: { type: "string" } },
        recommendedFollowUps: { type: "array", items: { type: "string" } },
      },
      required: ["pass", "verdict", "remainingRisks", "changedFiles", "recommendedFollowUps"],
    },
  },
);

return {
  status: verification.ok && finalAudit.pass ? "architecture-realigned" : "completed-with-risks",
  selectedTarget: target,
  usedSuppliedTarget: Boolean(suppliedTarget),
  repairRoundsUsed: repairRound,
  planGateRepairRoundsUsed: planGateRepairRound,
  preflight,
  canonicalTopology,
  canonicalBoundary,
  approvedPlan,
  issueLedger,
  acceptedPatchCount: acceptedPatches.length,
  verification,
  finalAudit
};
