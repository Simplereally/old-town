export const meta = {
  name: "uc-solid-sweep",
  description:
    "Refactors a coupled legacy module by first proving its current behavior, independently mapping topology, designing judged contracts, extracting domains through verified pipelines, integrating serially, and repairing until type/tests/API invariants pass.",
  phases: [
    {
      title: "Preflight",
      detail:
        "Discover language, framework, commands, package manager, target exports, callers, and repo constraints",
    },
    {
      title: "Candidate Discovery Swarm",
      detail: "If no target file given, run 5 explorers to find the best refactor candidates",
    },
    {
      title: "Candidate Collation",
      detail: "Deduplicate and keep the best 5 unique candidates from the swarm",
    },
    {
      title: "Candidate Judging",
      detail: "3 judges rank the top 5 candidates; scoring picks the winner",
    },
    {
      title: "Topology Swarm",
      detail:
        "Map public API, callers, side effects, dataflow, tests, and domain seams from independent lenses",
    },
    {
      title: "Topology Adjudication",
      detail: "Fuse findings into one canonical refactor map with explicit invariants",
    },
    {
      title: "Characterization Harness",
      detail: "Add or strengthen golden tests before touching behavior",
    },
    {
      title: "Contract Tournament",
      detail: "Generate competing interface architectures and judge them",
    },
    {
      title: "Extraction Pipeline",
      detail: "Draft, review, and repair each domain extraction independently",
    },
    {
      title: "Serial Integration",
      detail: "Apply all accepted module contracts and facade changes in one conflict-free pass",
    },
    {
      title: "Verification Matrix",
      detail:
        "Run static analysis, tests, lint, build, API compatibility, dependency-cycle checks, and behavioral audit",
    },
    { title: "Repair Loop", detail: "Fix verified failures in bounded rounds until clean" },
    {
      title: "Final Audit",
      detail:
        "Adversarially inspect the final diff for behavior loss, over-abstraction, and hidden coupling",
    },
  ],
};

const input = typeof args === "object" && args ? args : {};

const explicitTargetFile =
  typeof input?.file === "string" && input.file.trim().length > 0 ? input.file.trim() : null;

const maxRepairRounds = Number.isInteger(input.maxRepairRounds) ? input.maxRepairRounds : 6;
const allowPublicApiChange = input.allowPublicApiChange === true;
const packageManagerHint = input.packageManager || "auto";
const refactorGoal =
  input.goal ||
  "Split the legacy module into cohesive, testable modules while preserving the exact public API and runtime behavior.";

const strictPublicApiRule = allowPublicApiChange
  ? "Public API changes are allowed only when explicitly listed with migration steps."
  : "Public API names, exported symbols, parameter order, return types, thrown error behavior, and caller semantics must remain unchanged.";

function compact(value) {
  return JSON.stringify(value, null, 2);
}

const CANDIDATE_SCHEMA = {
  type: "object",
  properties: {
    path: { type: "string" },
    symbolOrModuleName: { type: "string" },
    language: { type: "string" },
    whyThisIsHighLeverage: { type: "string" },
    couplingEvidence: { type: "string" },
    complexityEvidence: { type: "string" },
    blastRadiusEvidence: { type: "string" },
    testCoverageSignal: { type: "string" },
    expectedPayoff: { type: "string" },
    refactorRisk: { type: "string" },
    confidence: { type: "number" },
  },
  required: [
    "path",
    "symbolOrModuleName",
    "language",
    "whyThisIsHighLeverage",
    "couplingEvidence",
    "complexityEvidence",
    "blastRadiusEvidence",
    "testCoverageSignal",
    "expectedPayoff",
    "refactorRisk",
    "confidence",
  ],
};

const EXPLORER_SCHEMA = {
  type: "object",
  properties: {
    candidates: {
      type: "array",
      items: CANDIDATE_SCHEMA,
      minItems: 5,
      maxItems: 5,
    },
  },
  required: ["candidates"],
};

const COLLATION_SCHEMA = {
  type: "object",
  properties: {
    finalists: {
      type: "array",
      items: CANDIDATE_SCHEMA,
      minItems: 5,
      maxItems: 5,
    },
  },
  required: ["finalists"],
};

const JUDGE_SCHEMA = {
  type: "object",
  properties: {
    ranked: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          symbolOrModuleName: { type: "string" },
          rank: { type: "number" },
          points: { type: "number" },
          justification: { type: "string" },
        },
        required: ["path", "symbolOrModuleName", "rank", "points", "justification"],
      },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: ["ranked"],
};

const SCORING_SCHEMA = {
  type: "object",
  properties: {
    winner: {
      type: "object",
      properties: {
        path: { type: "string" },
        symbolOrModuleName: { type: "string" },
        totalPoints: { type: "number" },
        ballots: { type: "number" },
        averageRank: { type: "number" },
        tieBreakReason: { type: "string" },
      },
      required: [
        "path",
        "symbolOrModuleName",
        "totalPoints",
        "ballots",
        "averageRank",
        "tieBreakReason",
      ],
    },
  },
  required: ["winner"],
};

const PRE_FLIGHT_SCHEMA = {
  type: "object",
  properties: {
    language: { type: "string" },
    framework: { type: "string" },
    packageManager: { type: "string" },
    commands: {
      type: "object",
      properties: {
        compile: { type: "string" },
        test: { type: "string" },
        lint: { type: "string" },
        build: { type: "string" },
        format: { type: "string" },
      },
      required: ["test"],
    },
    publicApiSurface: { type: "array", items: { type: "string" } },
    inboundCallers: { type: "array", items: { type: "string" } },
    relatedTests: { type: "array", items: { type: "string" } },
    repoConstraints: { type: "array", items: { type: "string" } },
    riskFlags: { type: "array", items: { type: "string" } },
  },
  required: [
    "language",
    "packageManager",
    "commands",
    "publicApiSurface",
    "inboundCallers",
    "relatedTests",
    "repoConstraints",
    "riskFlags",
  ],
};

const TOPOLOGY_SCHEMA = {
  type: "object",
  properties: {
    lens: { type: "string" },
    publicApi: {
      type: "array",
      items: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          signature: { type: "string" },
          callers: { type: "array", items: { type: "string" } },
          compatibilityRequirement: { type: "string" },
        },
        required: ["symbol", "signature", "compatibilityRequirement"],
      },
    },
    domains: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          responsibility: { type: "string" },
          currentCodeRegions: { type: "array", items: { type: "string" } },
          inputs: { type: "array", items: { type: "string" } },
          outputs: { type: "array", items: { type: "string" } },
          stateMutations: { type: "array", items: { type: "string" } },
          sideEffects: { type: "array", items: { type: "string" } },
          dependencies: { type: "array", items: { type: "string" } },
          extractionRisk: { type: "string" },
        },
        required: [
          "name",
          "responsibility",
          "currentCodeRegions",
          "inputs",
          "outputs",
          "stateMutations",
          "sideEffects",
          "dependencies",
          "extractionRisk",
        ],
      },
    },
    invariants: { type: "array", items: { type: "string" } },
    unknowns: { type: "array", items: { type: "string" } },
  },
  required: ["lens", "publicApi", "domains", "invariants", "unknowns"],
};

const CANONICAL_TOPOLOGY_SCHEMA = {
  type: "object",
  properties: {
    legacyModuleName: { type: "string" },
    publicApiLock: { type: "array", items: { type: "string" } },
    behaviorInvariants: { type: "array", items: { type: "string" } },
    domains: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          responsibility: { type: "string" },
          sourceRegions: { type: "array", items: { type: "string" } },
          contractNeeds: { type: "array", items: { type: "string" } },
          dependenciesToInject: { type: "array", items: { type: "string" } },
          forbiddenImports: { type: "array", items: { type: "string" } },
          acceptanceCriteria: { type: "array", items: { type: "string" } },
          extractionOrderHint: { type: "number" },
        },
        required: [
          "id",
          "name",
          "responsibility",
          "sourceRegions",
          "contractNeeds",
          "dependenciesToInject",
          "forbiddenImports",
          "acceptanceCriteria",
        ],
      },
    },
    integrationStrategy: { type: "string" },
    testStrategy: { type: "string" },
    redFlags: { type: "array", items: { type: "string" } },
  },
  required: [
    "legacyModuleName",
    "publicApiLock",
    "behaviorInvariants",
    "domains",
    "integrationStrategy",
    "testStrategy",
    "redFlags",
  ],
};

const CONTRACT_SCHEMA = {
  type: "object",
  properties: {
    contractArtifacts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          code: { type: "string" },
        },
        required: ["path", "code"],
      },
    },
    modulePlan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          domainId: { type: "string" },
          contractKind: { type: "string" },
          contractName: { type: "string" },
          contractArtifactPath: { type: "string" },
          implementationArtifactPath: { type: "string" },
          injectedDependencies: { type: "array", items: { type: "string" } },
          publicFacadeTouchpoints: { type: "array", items: { type: "string" } },
          dependencyInjectionMechanism: { type: "string" },
        },
        required: [
          "domainId",
          "contractKind",
          "contractName",
          "contractArtifactPath",
          "implementationArtifactPath",
          "injectedDependencies",
          "publicFacadeTouchpoints",
          "dependencyInjectionMechanism",
        ],
      },
    },
    rationale: { type: "string" },
    risks: { type: "array", items: { type: "string" } },
  },
  required: ["contractArtifacts", "modulePlan", "rationale", "risks"],
};

const PATCH_SCHEMA = {
  type: "object",
  properties: {
    domainId: { type: "string" },
    domainName: { type: "string" },
    newFiles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          code: { type: "string" },
        },
        required: ["path", "code"],
      },
    },
    modifiedFiles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          changeSummary: { type: "string" },
          patchIntent: { type: "string" },
        },
        required: ["path", "changeSummary", "patchIntent"],
      },
    },
    injectedDependencies: { type: "array", items: { type: "string" } },
    preservedInvariants: { type: "array", items: { type: "string" } },
    openRisks: { type: "array", items: { type: "string" } },
  },
  required: [
    "domainId",
    "domainName",
    "newFiles",
    "modifiedFiles",
    "injectedDependencies",
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
    commandOrCheck: { type: "string" },
    evidence: { type: "string" },
    failures: { type: "array", items: { type: "string" } },
    suspectedRootCauses: { type: "array", items: { type: "string" } },
  },
  required: ["ok", "commandOrCheck", "evidence", "failures", "suspectedRootCauses"],
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

async function verifyAll(preflight, roundLabel) {
  phase("Verification Matrix");

  const compilePrompt = preflight.commands.compile
    ? `Run the compile/static analysis command exactly: ${preflight.commands.compile}`
    : "Discover and run the compile or static analysis command if present. If none, inspect the codebase for syntax and structural correctness directly.";

  const lintPrompt = preflight.commands.lint
    ? `Run lint if available. Command: ${preflight.commands.lint}`
    : "Discover and run the repo lint or format command if present.";

  const buildPrompt = preflight.commands.build
    ? `Run build if available. Command: ${preflight.commands.build}`
    : "Discover and run the repo build or package command if present.";

  const checks = [
    {
      key: "compile",
      prompt: compilePrompt,
    },
    {
      key: "tests",
      prompt: `Run the most relevant tests first, then the broader test command if feasible. Relevant tests: ${compact(preflight.relatedTests)}. Test command: ${preflight.commands.test}`,
    },
    {
      key: "lint",
      prompt: lintPrompt,
    },
    {
      key: "build",
      prompt: buildPrompt,
    },
    {
      key: "public-api-compat",
      prompt: `Compare the public API surface of ${targetFile} before and after the refactor using diff, exports, inbound callers, and tests. ${strictPublicApiRule}`,
    },
    {
      key: "dependency-cycles",
      prompt: `Inspect the final import or dependency graph around ${targetFile}. Confirm the refactor did not introduce circular imports, domain modules importing the facade, or hidden dependencies back into legacy code.`,
    },
    {
      key: "behavioral-audit",
      prompt: `Audit the characterization tests and implementation diff. Confirm behavior invariants still hold: no changed defaults, error paths, ordering, caching, mutation timing, async semantics, or side effects.`,
    },
  ];

  const rawChecks = await parallel(
    checks.map(
      (check) => () =>
        agent(
          `You are verification agent "${check.key}" for round "${roundLabel}".

Target file:
${targetFile}

Task:
${check.prompt}

Rules:
- Do not make edits.
- Run or inspect exactly what is needed.
- Report evidence, not vibes.
- If a command cannot run, explain the concrete blocker and whether that is itself a failure.
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
    `Synthesize the verification results into a single go/no-go.

Verification results:
${compact(results)}

Return ok=true only if:
- compile/static analysis passes,
- relevant tests pass,
- public API compatibility is preserved unless explicitly allowed,
- no new dependency cycles or facade-back-imports exist,
- behavioral invariants are supported by test or diff evidence.

If not ok, produce precise repair instructions ordered by likely root cause.
`,
    {
      label: `verify-summary:${roundLabel}`,
      phase: "Verification Matrix",
      schema: VERIFICATION_SUMMARY_SCHEMA,
    },
  );
}

let targetFile;

if (explicitTargetFile) {
  targetFile = explicitTargetFile;
  log(`Explicit target file: ${targetFile}`);
} else {
  phase("Candidate Discovery Swarm");
  log("No explicit target file provided. Running discovery tournament.");

  const explorers = [
    "coupling-lens",
    "complexity-lens",
    "domain-separation-lens",
    "testability-lens",
    "blast-radius-lens",
  ];

  const rawExplorations = (
    await parallel(
      explorers.map(
        (lens) => () =>
          agent(
            `You are an explorer using the "${lens}" lens.

Task: Independently scan the repository and return the top 5 refactor candidates.

Rules:
- Do not edit files.
- Optimize for high-leverage legacy/decomposition candidates, not merely the largest files.
- Good candidates: god objects, highly coupled services, mega components, orchestration blobs, duplicated domain logic, files with many inbound callers, files with mixed IO/business/presentation concerns, files with poor seams but strong testability upside, and files frequently touched with defect risk.
- Bad candidates: generated files, vendored files, migrations, snapshots, lockfiles, config-only files, trivial barrels, and files without meaningful callers.
- For each candidate, provide concrete evidence: paths, symbols, caller counts, line counts, coupling metrics, or observed patterns.
- Distinguish confirmed facts from inferred risks.
- Confidence must be 1-10.
- Do not invent candidates if the repo has fewer than 5 viable targets; return only real candidates.
`,
            {
              label: `explorer:${lens}`,
              phase: "Candidate Discovery Swarm",
              schema: EXPLORER_SCHEMA,
            },
          ),
      ),
    )
  ).filter(Boolean);

  const allCandidates = rawExplorations.flatMap((ex) => ex.candidates || []);

  phase("Candidate Collation");

  const collation = await agent(
    `You receive all raw candidates from the discovery swarm.

Raw candidates:
${compact(allCandidates)}

Task:
1. Deduplicate semantically identical candidates (same path, same module, or same symbol).
2. Keep the best-worded, best-evidenced version of each duplicate.
3. Return exactly the best 5 unique candidates.
4. Prefer candidates with concrete evidence over rhetorical claims.
5. Reject candidates if evidence is thin, generated/vendor status is likely, or blast radius is not inspectable.
6. Do not invent candidates.
`,
    {
      label: "collation",
      phase: "Candidate Collation",
      schema: COLLATION_SCHEMA,
    },
  );

  const finalists = collation?.finalists || [];

  if (finalists.length === 0) {
    return {
      status: "aborted-no-target-discovered",
      reason: "No viable refactor candidates found after discovery and collation.",
      allCandidates
    };
  }

  phase("Candidate Judging");

  const judgeResults = (
    await parallel(
      [1, 2, 3].map(
        (judgeNum) => () =>
          agent(
            `You are Judge ${judgeNum}.

Task: Rank the top 3 candidates from the collated list.

Collated candidates:
${compact(finalists)}

Rules:
- Rank 1st = 3 points, 2nd = 2 points, 3rd = 1 point.
- Provide explicit justification for each ranked candidate.
- Do not edit files.
`,
            {
              label: `judge:${judgeNum}`,
              phase: "Candidate Judging",
              schema: JUDGE_SCHEMA,
            },
          ),
      ),
    )
  ).filter(Boolean);

  const scoring = await agent(
    `You are the scoring agent.

Task: Total the votes from all judges and determine the winner.

Judges:
${compact(judgeResults)}

Candidates:
${compact(finalists)}

Rules:
- 1st place = 3 points, 2nd = 2 points, 3rd = 1 point.
- If one candidate has the highest score, choose it.
- Tie-break hierarchy:
  1. Prefer the tied candidate that appears in more judges' top-3 ballots.
  2. If still tied, prefer higher average rank among judges who ranked it.
  3. If still tied, prefer higher collation confidence.
  4. If still tied, prefer lower refactor risk.
  5. If still tied, prefer stronger test coverage signal.
  6. If still tied, run one final tie-breaker judge agent that must choose exactly one candidate and justify why.
- Never ask the user to choose.
- Never continue with multiple target files.
`,
    {
      label: "scoring",
      phase: "Candidate Judging",
      schema: SCORING_SCHEMA,
    },
  );

  let winner;

  if (scoring?.winner) {
    winner = scoring.winner;
  } else {
    phase("Candidate Judging");
    const tieBreaker = await agent(
      `You are the final tie-breaker judge.

Candidates:
${compact(finalists)}

Task: Choose exactly one candidate as the winner and justify why.

Rules:
- Do not ask the user.
- Choose exactly one.
- Provide explicit evidence-based justification.
`,
      {
        label: "tie-breaker",
        phase: "Candidate Judging",
        schema: {
          type: "object",
          properties: {
            path: { type: "string" },
            symbolOrModuleName: { type: "string" },
            justification: { type: "string" },
          },
          required: ["path", "symbolOrModuleName", "justification"],
        },
      },
    );
    winner = {
      path: tieBreaker.path,
      symbolOrModuleName: tieBreaker.symbolOrModuleName,
      totalPoints: 0,
      ballots: 0,
      averageRank: 0,
      tieBreakReason: tieBreaker.justification,
    };
  }

  targetFile = winner.path;
  log(`Discovered target file: ${targetFile}`);
}

phase("Preflight");
log(`Target: ${targetFile}`);

const preflight = await agent(
  `Inspect the repository and target module.

Target file:
${targetFile}

Goal:
${refactorGoal}

Package manager hint:
${packageManagerHint}

Find:
1. Detect the primary language (TypeScript, JavaScript, C#, Java, Kotlin, Go, Rust, Python, Ruby, PHP, Swift, etc.), framework, and idiomatic contract mechanism (interfaces, traits, protocols, abstract classes, modules, etc.).
2. Package manager and exact commands for compile, tests, lint, build, format.
3. Every public symbol and export from the target file.
4. Every inbound caller and relevant test file.
5. Repo conventions: file naming, module boundaries, dependency rules, testing style, lint/format constraints.
6. Risk flags: global state, singleton behavior, caching, async timing, IO, environment reads, mutation, implicit initialization, decorators, framework magic.

Do not edit files.
Return only validated structured data.
`,
  {
    label: "preflight",
    phase: "Preflight",
    schema: PRE_FLIGHT_SCHEMA,
  },
);

phase("Topology Swarm");

const topologyLenses = [
  {
    key: "public-api-callers",
    prompt:
      "Map exported symbols, caller expectations, overloads, thrown errors, sync/async behavior, and compatibility constraints.",
  },
  {
    key: "side-effects-state",
    prompt:
      "Map all mutation, singleton state, caches, IO, env access, timers, event listeners, framework registration, and hidden lifecycle behavior.",
  },
  {
    key: "domain-seams",
    prompt:
      "Identify true responsibility seams, not superficial method groups. Find cohesive domain concepts with minimal shared state.",
  },
  {
    key: "dataflow-types",
    prompt:
      "Trace data shapes, type dependencies, inferred contracts, validation boundaries, nullability, and error propagation.",
  },
  {
    key: "tests-behavior",
    prompt:
      "Inspect existing tests and infer missing characterization cases required before refactor.",
  },
  {
    key: "architecture-risk",
    prompt:
      "Identify extraction order, cyclic-dependency risks, over-abstraction risks, and safest facade/orchestrator strategy.",
  },
];

const topologyReports = (
  await parallel(
    topologyLenses.map(
      (lens) => () =>
        agent(
          `You are the "${lens.key}" topology analyst.

Target file:
${targetFile}

Preflight:
${compact(preflight)}

Lens:
${lens.prompt}

Rules:
- Do not edit files.
- Prefer exact file paths, symbol names, and code-region descriptions.
- Distinguish confirmed facts from inferred risks.
- Do not invent domains just to make the refactor look clean.
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
  `Fuse these independent topology reports into the canonical refactor map.

Target:
${targetFile}

Preflight:
${compact(preflight)}

Reports:
${compact(topologyReports)}

Rules:
- Resolve contradictions explicitly.
- Keep only domains that correspond to real cohesive responsibilities.
- Define behavior invariants that must survive.
- Define a public API lock.
- Define extraction acceptance criteria per domain.
- Prefer a lightweight facade over a new framework.
- ${strictPublicApiRule}
`,
  {
    label: "adjudicate-topology",
    phase: "Topology Adjudication",
    schema: CANONICAL_TOPOLOGY_SCHEMA,
  },
);

if (!canonicalTopology.domains.length) {
  return {
    status: "aborted-no-safe-domain-seams",
    reason: "No cohesive extraction seams survived topology adjudication.",
    preflight,
    topologyReports,
    canonicalTopology
  };
}

phase("Characterization Harness");

const characterization = await agent(
  `Before refactoring, strengthen regression protection for ${targetFile}.

Use:
Preflight:
${compact(preflight)}

Canonical topology:
${compact(canonicalTopology)}

Task:
1. Add or extend characterization tests for current behavior before changing implementation.
2. Cover public API lock, side effects, edge cases, error behavior, ordering, async behavior, and mutation/caching semantics.
3. Prefer focused tests near existing test conventions.
4. Run the relevant tests and compile/static analysis.
5. Fix only the tests/harness if they are incorrectly written. Do not refactor production behavior yet.

Return a concise summary of files changed, tests added, and command results.
`,
  {
    label: "characterization-harness",
    phase: "Characterization Harness",
  },
);

phase("Contract Tournament");

const contractDesigners = [
  "minimalist-contracts",
  "domain-driven-contracts",
  "testability-first-contracts",
  "migration-safety-contracts",
];

const contractCandidates = (
  await parallel(
    contractDesigners.map(
      (style) => () =>
        agent(
          `Design a contract architecture for splitting ${targetFile}.

Style:
${style}

Inputs:
Preflight:
${compact(preflight)}

Canonical topology:
${compact(canonicalTopology)}

Hard rules:
- ${strictPublicApiRule}
- The facade/orchestrator depends on abstractions.
- Domain implementations must not import the facade or the old monolith.
- Contracts should be strict but not overengineered.
- Preserve current domain behavior and side-effect timing.
- Include exact contract artifact paths and exact contract code.
- Include module plan mapping every domain to contract kind, name, artifact paths, implementation path, dependencies, facade touchpoints, and dependency injection mechanism.
`,
          {
            label: `contract:${style}`,
            phase: "Contract Tournament",
            schema: CONTRACT_SCHEMA,
          },
        ),
    ),
  )
).filter(Boolean);

const canonicalContract = await agent(
  `Judge the competing contract designs and synthesize the strongest canonical architecture.

Candidates:
${compact(contractCandidates)}

Use the design that maximizes:
1. Behavior preservation.
2. Smallest safe public surface.
3. Low coupling.
4. Low migration risk.
5. Testability.
6. No circular imports.
7. Idiomatic for the detected language.

Return the exact final contract artifacts, final module plan, rationale, and risks.
`,
  {
    label: "judge-contracts",
    phase: "Contract Tournament",
    schema: CONTRACT_SCHEMA,
  },
);

phase("Extraction Pipeline");

const extractedDomains = await pipeline(
  canonicalTopology.domains.sort(
    (a, b) => (a.extractionOrderHint || 0) - (b.extractionOrderHint || 0),
  ),

  async (domain, _originalDomain, index) => {
    return agent(
      `Draft the extraction for one domain. Do not edit files.

Target file:
${targetFile}

Domain:
${compact(domain)}

Canonical contract:
${compact(canonicalContract)}

Preflight:
${compact(preflight)}

Characterization summary:
${characterization}

Rules:
- Produce exact new file code for this domain.
- Do not import the legacy monolith or facade.
- Inject dependencies explicitly.
- Keep behavior identical.
- Preserve side-effect timing.
- Avoid speculative abstractions.
- Keep exports consistent with the contract.
- State any required facade modifications as patch intent, not direct edits.
`,
      {
        label: `extract-draft:${domain.id || index}`,
        phase: "Extraction Pipeline",
        schema: PATCH_SCHEMA,
      },
    );
  },

  async (draft, originalDomain, index) => {
    const reviewLenses = [
      "correctness-and-behavior",
      "contract-compliance",
      "dependency-boundaries",
      "testability-and-simplicity",
    ];

    const reviews = (
      await parallel(
        reviewLenses.map(
          (lens) => () =>
            agent(
              `Review this drafted domain extraction. Do not edit files.

Lens:
${lens}

Original domain:
${compact(originalDomain)}

Draft:
${compact(draft)}

Canonical contract:
${compact(canonicalContract)}

Canonical topology:
${compact(canonicalTopology)}

Fail the draft if it:
- changes behavior,
- violates the public API lock,
- imports the facade/monolith,
- hides dependencies instead of injecting them,
- creates cyclic imports,
- over-abstracts beyond the topology evidence,
- omits required edge cases.
`,
              {
                label: `review:${originalDomain.id || index}:${lens}`,
                phase: "Extraction Pipeline",
                schema: REVIEW_SCHEMA,
              },
            ),
        ),
      )
    ).filter(Boolean);

    return { draft, reviews };
  },

  async (reviewed, originalDomain, index) => {
    const blockingIssues = reviewed.reviews.flatMap((r) => r.blockingIssues || []);

    if (!blockingIssues.length) {
      return reviewed.draft;
    }

    return agent(
      `Repair this domain extraction draft. Do not edit files.

Original domain:
${compact(originalDomain)}

Draft:
${compact(reviewed.draft)}

Reviews:
${compact(reviewed.reviews)}

Canonical contract:
${compact(canonicalContract)}

Task:
Return a revised patch object that resolves every blocking issue while preserving the contract and behavior.
`,
      {
        label: `extract-repair:${originalDomain.id || index}`,
        phase: "Extraction Pipeline",
        schema: PATCH_SCHEMA,
      },
    );
  },
);

const acceptedPatches = extractedDomains.filter(Boolean);

phase("Serial Integration");

const integration = await agent(
  `Apply the full refactor in the real workspace.

Target file:
${targetFile}

Preflight:
${compact(preflight)}

Canonical topology:
${compact(canonicalTopology)}

Canonical contract:
${compact(canonicalContract)}

Accepted per-domain patches:
${compact(acceptedPatches)}

Hard requirements:
1. Write the contract artifacts exactly, adapting only for import paths and repo conventions.
2. Create each extracted domain module.
3. Rewrite ${targetFile} into a lightweight facade/orchestrator.
4. Preserve every public export and caller-facing signature unless explicitly allowed.
5. Preserve current behavior, side effects, async timing, ordering, error behavior, and mutation semantics.
6. Do not leave dead duplicate logic in the monolith unless needed temporarily for compatibility.
7. Do not introduce circular imports.
8. Update imports/exports only where necessary.
9. Run formatter if the repo has one.
10. Do not broaden scope beyond this refactor.

After editing, summarize changed files and any unresolved risk.
`,
  {
    label: "serial-integrator",
    phase: "Serial Integration",
  },
);

let verification = await verifyAll(preflight, "initial");
let repairRound = 0;

while (!verification.ok && repairRound < maxRepairRounds) {
  repairRound += 1;
  phase("Repair Loop");

  await agent(
    `Repair the refactor based only on verified failures.

Target:
${targetFile}

Repair round:
${repairRound} of ${maxRepairRounds}

Verification summary:
${compact(verification)}

Canonical topology:
${compact(canonicalTopology)}

Canonical contract:
${compact(canonicalContract)}

Rules:
- Fix root causes, not symptoms.
- Preserve public API compatibility.
- Preserve behavior invariants and characterization tests.
- Do not delete tests to get green.
- Do not weaken types to hide errors.
- Do not introduce "any" or equivalent escape hatches except where the legacy public API already required them.
- After editing, run the narrowest command that proves the fix before handing back.
`,
    {
      label: `repair:${repairRound}`,
      phase: "Repair Loop",
    },
  );

  verification = await verifyAll(preflight, `repair-${repairRound}`);
}

phase("Final Audit");

const finalAudit = await agent(
  `Perform an adversarial final audit of the completed refactor.

Target:
${targetFile}

Preflight:
${compact(preflight)}

Canonical topology:
${compact(canonicalTopology)}

Canonical contract:
${compact(canonicalContract)}

Integration summary:
${integration}

Final verification:
${compact(verification)}

Audit:
1. Inspect git diff.
2. Confirm public API lock is preserved.
3. Confirm domain modules do not import the facade or monolith.
4. Confirm no behavior was silently dropped.
5. Confirm tests meaningfully cover characterized behavior.
6. Confirm abstraction level is justified by actual seams.
7. Confirm no dead compatibility shim, hidden singleton, or dependency cycle remains.
8. Produce a final verdict.

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
  targetFile,
  repairRoundsUsed: repairRound,
  preflight,
  canonicalTopology,
  canonicalContract,
  acceptedPatchCount: acceptedPatches.length,
  verification,
  finalAudit
};
