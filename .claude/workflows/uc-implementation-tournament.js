export const meta = {
  name: "uc-implementation-tournament",
  description:
    "A reusable feature-building workflow that forces multiple independent designs to compete, scores them through a judge panel, synthesizes the strongest plan, implements in dependency-aware slices, and attacks the result before handoff.",
  whenToUse:
    "Use for meaningful feature work, architectural changes, UI/product improvements, or any implementation where the first obvious plan is probably not the best plan. Args: {goal: string, constraints?: string[], implement?: boolean, maxStrategies?: number}",
  phases: [
    {
      title: "0. Brief",
      detail: "Normalize goal, constraints, acceptance criteria, and non-goals.",
    },
    {
      title: "1. Grounding",
      detail: "Parallel repo readers collect evidence from every relevant lens.",
    },
    {
      title: "2. Strategy Tournament",
      detail: "Generate competing implementation strategies from deliberately different priors.",
    },
    {
      title: "3. Judge Panel",
      detail:
        "Score every strategy across correctness, architecture, UX, risk, tests, and performance/security.",
    },
    {
      title: "4. Champion Synthesis",
      detail: "Merge the best ideas into one dependency-ordered implementation plan.",
    },
    {
      title: "5. Build",
      detail: "Implement slices in parallel where safe, sequentially where dependent.",
    },
    {
      title: "6. Attack",
      detail:
        "Adversarially review the implementation against acceptance criteria and hidden risks.",
    },
    { title: "7. Finish", detail: "Repair, validate, and produce an operator-grade handoff." },
  ],
};

const input = typeof args === "string" ? JSON.parse(args || "{}") : args || {};
const goal = input.goal || "implement the requested feature";
const constraints = input.constraints || [];
const implement = input.implement !== false;
const maxStrategies = input.maxStrategies || 7;

const BRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    normalizedGoal: { type: "string" },
    acceptanceCriteria: { type: "array", items: { type: "string" } },
    nonGoals: { type: "array", items: { type: "string" } },
    assumptionsToVerify: { type: "array", items: { type: "string" } },
  },
  required: ["normalizedGoal", "acceptanceCriteria", "nonGoals", "assumptionsToVerify"],
};

const CONTEXT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    lens: { type: "string" },
    relevantFiles: { type: "array", items: { type: "string" } },
    reusablePatterns: { type: "array", items: { type: "string" } },
    hardConstraints: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    recommendedCommands: { type: "array", items: { type: "string" } },
  },
  required: [
    "lens",
    "relevantFiles",
    "reusablePatterns",
    "hardConstraints",
    "risks",
    "recommendedCommands",
  ],
};

const STRATEGY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    thesis: { type: "string" },
    architecture: { type: "string" },
    implementationSteps: { type: "array", items: { type: "string" } },
    likelyFiles: { type: "array", items: { type: "string" } },
    testingPlan: { type: "array", items: { type: "string" } },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    hiddenRisks: { type: "array", items: { type: "string" } },
  },
  required: [
    "name",
    "thesis",
    "architecture",
    "implementationSteps",
    "likelyFiles",
    "testingPlan",
    "strengths",
    "weaknesses",
    "hiddenRisks",
  ],
};

const SCORE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    strategyName: { type: "string" },
    lens: { type: "string" },
    score: { type: "number" },
    fatalFlaws: { type: "array", items: { type: "string" } },
    bestIdeasToSteal: { type: "array", items: { type: "string" } },
    requiredChanges: { type: "array", items: { type: "string" } },
    verdict: { type: "string", enum: ["reject", "salvage", "candidate", "winner"] },
  },
  required: [
    "strategyName",
    "lens",
    "score",
    "fatalFlaws",
    "bestIdeasToSteal",
    "requiredChanges",
    "verdict",
  ],
};

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    championThesis: { type: "string" },
    architecture: { type: "string" },
    acceptanceCriteria: { type: "array", items: { type: "string" } },
    slices: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          objective: { type: "string" },
          files: { type: "array", items: { type: "string" } },
          instructions: { type: "string" },
          dependsOn: { type: "array", items: { type: "string" } },
          parallelSafe: { type: "boolean" },
          testCommands: { type: "array", items: { type: "string" } },
          risk: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: [
          "name",
          "objective",
          "files",
          "instructions",
          "dependsOn",
          "parallelSafe",
          "testCommands",
          "risk",
        ],
      },
    },
    rejectedIdeas: { type: "array", items: { type: "string" } },
  },
  required: ["championThesis", "architecture", "acceptanceCriteria", "slices", "rejectedIdeas"],
};

const REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    pass: { type: "boolean" },
    lens: { type: "string" },
    blockingIssues: { type: "array", items: { type: "string" } },
    nonBlockingRisks: { type: "array", items: { type: "string" } },
    requiredFixes: { type: "array", items: { type: "string" } },
  },
  required: ["pass", "lens", "blockingIssues", "nonBlockingRisks", "requiredFixes"],
};

phase("0. Brief");
const brief = await agent(
  `Normalize this implementation request.

Goal:
${goal}

User constraints:
${JSON.stringify(constraints, null, 2)}

Return crisp acceptance criteria, non-goals, and assumptions the workflow must verify before building.`,
  { label: "brief", phase: "0. Brief", schema: BRIEF_SCHEMA },
);

phase("1. Grounding");
const groundingLenses = [
  "architecture seams and dependency direction",
  "existing implementation patterns to copy",
  "data model, API contracts, persistence, and state/cache implications",
  "UI/UX/product flows, accessibility, loading/error/empty states",
  "tests, fixtures, mocks, build commands, and local validation",
  "security, auth, permissions, privacy, and input validation",
  "performance, bundle/runtime cost, concurrency, and scalability",
];

const context = await parallel(
  groundingLenses.map(
    (lens) => () =>
      agent(
        `Ground the feature through this lens: ${lens}

Brief:
${JSON.stringify(brief, null, 2)}

Read relevant files. Return evidence-backed context, reusable patterns, constraints, risks, and commands. Do not implement.`,
        { label: `ground:${lens}`, phase: "1. Grounding", schema: CONTEXT_SCHEMA },
      ),
  ),
);

phase("2. Strategy Tournament");
const strategyArchetypes = [
  "minimal idiomatic change using existing repo conventions",
  "domain-first clean architecture with explicit seams",
  "fastest coherent vertical slice with immediate user value",
  "future-proof extensible design with controlled abstraction",
  "test-first correctness-maximizing implementation",
  "product/UX-polish-first implementation",
  "security/performance-conservative implementation",
  "radical simplification that removes more code than it adds",
].slice(0, maxStrategies);

const strategies = await parallel(
  strategyArchetypes.map(
    (archetype) => () =>
      agent(
        `Create one concrete implementation strategy from this prior:
${archetype}

Brief:
${JSON.stringify(brief, null, 2)}

Grounding:
${JSON.stringify(context.filter(Boolean), null, 2)}

Be specific about architecture, files, steps, tests, strengths, weaknesses, and hidden risks. Do not implement.`,
        {
          label: `strategy:${archetype}`,
          phase: "2. Strategy Tournament",
          schema: STRATEGY_SCHEMA,
        },
      ),
  ),
);

phase("3. Judge Panel");
const judgeLenses = [
  "correctness and acceptance-criteria completeness",
  "architectural fit and maintainability",
  "implementation risk, blast radius, and reversibility",
  "testability and regression protection",
  "product/UX quality and edge states",
  "performance, security, accessibility, and operational safety",
];

const scoreBatches = await parallel(
  strategies.filter(Boolean).map(
    (strategy) => () =>
      parallel(
        judgeLenses.map(
          (lens) => () =>
            agent(
              `Score this strategy from 0-10 through this judge lens:
${lens}

Strategy:
${JSON.stringify(strategy, null, 2)}

Brief:
${JSON.stringify(brief, null, 2)}

Grounding:
${JSON.stringify(context.filter(Boolean), null, 2)}

Find fatal flaws, salvageable ideas, and required changes. Be adversarial.`,
              {
                label: `judge:${strategy.name}:${lens}`,
                phase: "3. Judge Panel",
                schema: SCORE_SCHEMA,
              },
            ),
        ),
      ),
  ),
);

const scores = scoreBatches.filter(Boolean).flat().filter(Boolean);

phase("4. Champion Synthesis");
const plan = await agent(
  `Synthesize the champion implementation plan.

Inputs:
Brief:
${JSON.stringify(brief, null, 2)}

Strategies:
${JSON.stringify(strategies.filter(Boolean), null, 2)}

Scores:
${JSON.stringify(scores, null, 2)}

Rules:
- Do not blindly pick one strategy. Steal the best parts and reject flawed parts.
- Produce dependency-ordered implementation slices.
- Mark slices parallelSafe only if file and semantic conflicts are unlikely.
- Include test commands and risk per slice.
- Preserve the user's constraints and acceptance criteria.`,
  { label: "champion", phase: "4. Champion Synthesis", schema: PLAN_SCHEMA },
);

const buildResults = [];

if (implement) {
  phase("5. Build");

  const done = new Set();
  let remaining = [...plan.slices];
  let round = 0;

  while (remaining.length && round < 10) {
    round++;
    const ready = remaining.filter((slice) =>
      (slice.dependsOn || []).every((dep) => done.has(dep)),
    );
    if (ready.length === 0) break;

    const parallelReady = ready.filter((slice) => slice.parallelSafe && slice.risk !== "high");
    const sequentialReady = ready.filter((slice) => !slice.parallelSafe && slice.risk !== "high");

    const parallelResults = await parallel(
      parallelReady.map(
        (slice) => () =>
          agent(
            `Implement this champion-plan slice.

Overall goal:
${brief.normalizedGoal}

Architecture:
${plan.architecture}

Slice:
${JSON.stringify(slice, null, 2)}

Acceptance criteria:
${JSON.stringify(plan.acceptanceCriteria, null, 2)}

Rules:
- Follow existing repo conventions discovered in grounding.
- Make minimal coherent edits.
- Add/update tests where valuable.
- Run listed testCommands if practical.
- Return changed files, commands run, and unresolved concerns.`,
            { label: `build:${slice.name}`, phase: "5. Build", isolation: "worktree" },
          ),
      ),
    );

    buildResults.push(...parallelResults.filter(Boolean));
    for (const slice of parallelReady) done.add(slice.name);

    for (const slice of sequentialReady) {
      const result = await agent(
        `Sequentially implement this champion-plan slice.

Overall goal:
${brief.normalizedGoal}

Architecture:
${plan.architecture}

Slice:
${JSON.stringify(slice, null, 2)}

Acceptance criteria:
${JSON.stringify(plan.acceptanceCriteria, null, 2)}`,
        { label: `build-seq:${slice.name}`, phase: "5. Build" },
      );
      buildResults.push(result);
      done.add(slice.name);
    }

    remaining = remaining.filter((slice) => !done.has(slice.name));
  }
}

phase("6. Attack");
const reviews = await parallel([
  () =>
    agent(
      `Attack the implementation for missing acceptance criteria, broken flows, edge cases, and runtime defects.

Brief:
${JSON.stringify(brief, null, 2)}

Plan:
${JSON.stringify(plan, null, 2)}

Build results:
${JSON.stringify(buildResults, null, 2)}`,
      { label: "attack:correctness", phase: "6. Attack", schema: REVIEW_SCHEMA },
    ),
  () =>
    agent(
      `Attack the implementation for architecture damage, duplication, leaky abstractions, and repo convention violations.

${JSON.stringify({ brief, plan, buildResults }, null, 2)}`,
      { label: "attack:architecture", phase: "6. Attack", schema: REVIEW_SCHEMA },
    ),
  () =>
    agent(
      `Attack the implementation for test gaps, security, performance, accessibility, and release risk.

${JSON.stringify({ brief, plan, buildResults }, null, 2)}`,
      { label: "attack:quality", phase: "6. Attack", schema: REVIEW_SCHEMA },
    ),
]);

phase("7. Finish");
const final = await agent(
  `Finish the implementation.

If attack reviewers found required fixes, apply minimal repairs and run relevant checks. If no edits were made, provide a precise implementation handoff.

Brief:
${JSON.stringify(brief, null, 2)}

Plan:
${JSON.stringify(plan, null, 2)}

Build results:
${JSON.stringify(buildResults, null, 2)}

Attack reviews:
${JSON.stringify(reviews.filter(Boolean), null, 2)}

Return:
- final status
- changed files
- commands run
- acceptance criteria coverage
- remaining risks
- next recommended workflow`,
  { label: "finish", phase: "7. Finish" },
);

return {
  goal: brief.normalizedGoal,
  strategies: strategies.filter(Boolean).length,
  scores: scores.length,
  slices: plan.slices.length,
  buildResults: buildResults.length,
  reviews: reviews.filter(Boolean),
  final,
};
