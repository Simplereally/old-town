export const meta = {
  name: "uc-quality-gate-council",
  description:
    "A reusable pre-push/pre-merge release council: discover checks, run validation lanes, diagnose failures, repair safely, then produce a grounded ship/no-ship verdict.",
  whenToUse:
    "Run before commits, PRs, release cuts, deploys, or after agentic code changes. Args: {focus?: string, fix?: boolean, extraCommands?: string[], strict?: boolean}",
  phases: [
    {
      title: "0. Gate Definition",
      detail: "Define what must be true for this branch/change to ship.",
    },
    {
      title: "1. Command Discovery",
      detail: "Find real validation commands and classify required vs optional checks.",
    },
    {
      title: "2. Validation Lanes",
      detail: "Run independent check lanes in parallel with exact command evidence.",
    },
    {
      title: "3. Failure Triage",
      detail: "Classify failures as changed-code, pre-existing, environment, or unknown.",
    },
    { title: "4. Repair Loop", detail: "Apply minimal safe fixes and re-run affected lanes." },
    {
      title: "5. Council Verdict",
      detail: "Correctness, reliability/security, and maintainer judges decide ship/no-ship.",
    },
  ],
};

const input = typeof args === "string" ? JSON.parse(args || "{}") : args || {};
const focus = input.focus || "the current branch / working tree";
const fix = input.fix !== false;
const strict = input.strict !== false;
const extraCommands = input.extraCommands || [];

const GATE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    shipDefinition: { type: "array", items: { type: "string" } },
    blockingFailureTypes: { type: "array", items: { type: "string" } },
    allowedDeferrals: { type: "array", items: { type: "string" } },
  },
  required: ["shipDefinition", "blockingFailureTypes", "allowedDeferrals"],
};

const COMMAND_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    commands: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          command: { type: "string" },
          lane: { type: "string" },
          purpose: { type: "string" },
          required: { type: "boolean" },
          expectedCost: { type: "string", enum: ["cheap", "medium", "expensive", "unknown"] },
        },
        required: ["name", "command", "lane", "purpose", "required", "expectedCost"],
      },
    },
  },
  required: ["commands"],
};

const CHECK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    lane: { type: "string" },
    commandsRun: { type: "array", items: { type: "string" } },
    pass: { type: "boolean" },
    failures: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          command: { type: "string" },
          summary: { type: "string" },
          evidence: { type: "array", items: { type: "string" } },
          files: { type: "array", items: { type: "string" } },
          likelyCause: {
            type: "string",
            enum: ["changed-code", "pre-existing", "environment", "unknown"],
          },
          blocking: { type: "boolean" },
          fixStrategy: { type: "string" },
        },
        required: [
          "command",
          "summary",
          "evidence",
          "files",
          "likelyCause",
          "blocking",
          "fixStrategy",
        ],
      },
    },
    warnings: { type: "array", items: { type: "string" } },
  },
  required: ["lane", "commandsRun", "pass", "failures", "warnings"],
};

const TRIAGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    fixSlices: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          objective: { type: "string" },
          files: { type: "array", items: { type: "string" } },
          strategy: { type: "string" },
          commandsAfter: { type: "array", items: { type: "string" } },
          risk: { type: "string", enum: ["low", "medium", "high"] },
          parallelSafe: { type: "boolean" },
        },
        required: [
          "name",
          "objective",
          "files",
          "strategy",
          "commandsAfter",
          "risk",
          "parallelSafe",
        ],
      },
    },
    deferrals: { type: "array", items: { type: "string" } },
    suspectedPreExisting: { type: "array", items: { type: "string" } },
    suspectedEnvironment: { type: "array", items: { type: "string" } },
  },
  required: ["fixSlices", "deferrals", "suspectedPreExisting", "suspectedEnvironment"],
};

const VERDICT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ship: { type: "boolean" },
    judge: { type: "string" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    blockingReasons: { type: "array", items: { type: "string" } },
    nonBlockingRisks: { type: "array", items: { type: "string" } },
    requiredBeforeShip: { type: "array", items: { type: "string" } },
  },
  required: [
    "ship",
    "judge",
    "confidence",
    "blockingReasons",
    "nonBlockingRisks",
    "requiredBeforeShip",
  ],
};

phase("0. Gate Definition");
const gate = await agent(
  `Define the quality gate for ${focus}.

Strict mode: ${strict}

The gate should be practical but serious: code should build, typecheck, test, lint/format where applicable, avoid obvious security/config regressions, and not degrade maintainability. Return blocking failure types and allowed deferrals.`,
  { label: "gate", phase: "0. Gate Definition", schema: GATE_SCHEMA },
);

phase("1. Command Discovery");
const discovered = await agent(
  `Discover validation commands for ${focus}.

Find package manager scripts, CI commands, build/typecheck/lint/test/format/e2e/audit commands, and any project-specific smoke checks. Include only commands likely to run locally unless clearly marked expensive. Include user-supplied extra commands:
${JSON.stringify(extraCommands, null, 2)}`,
  { label: "commands", phase: "1. Command Discovery", schema: COMMAND_SCHEMA },
);

const commands = [
  ...discovered.commands,
  ...extraCommands.map((command) => ({
    name: command,
    command,
    lane: "user-supplied",
    purpose: "user-supplied validation",
    required: true,
    expectedCost: "unknown",
  })),
];

const lanes = [
  {
    name: "types-and-build",
    brief: "typecheck, compile, bundling, generated types, module resolution, production build",
  },
  {
    name: "tests",
    brief: "unit, integration, component, e2e, changed-area regression tests",
  },
  {
    name: "lint-format-static",
    brief: "lint, format check, static analysis, dead imports, obvious code quality gates",
  },
  {
    name: "runtime-smoke",
    brief: "app startup, CLI smoke, route/module import smoke, obvious runtime wiring failures",
  },
  {
    name: "security-config",
    brief: "secrets, env handling, dependency audit where available, auth/config regression risk",
  },
  {
    name: "changed-files-review",
    brief: "review current diff/changed files for release blockers not covered by commands",
  },
];

phase("2. Validation Lanes");
const initialChecks = await parallel(
  lanes.map(
    (lane) => () =>
      agent(
        `Run validation lane: ${lane.name}

Lane brief:
${lane.brief}

Focus:
${focus}

Gate:
${JSON.stringify(gate, null, 2)}

Available commands:
${JSON.stringify(commands, null, 2)}

Rules:
- Run the relevant cheap/required commands when practical.
- Capture exact commands and evidence.
- Do not edit.
- Classify failures as changed-code, pre-existing, environment, or unknown.
- Mark blocking according to the gate.`,
        { label: `lane:${lane.name}`, phase: "2. Validation Lanes", schema: CHECK_SCHEMA },
      ),
  ),
);

phase("3. Failure Triage");
const triage = await agent(
  `Triage validation failures into minimal repair slices.

Gate:
${JSON.stringify(gate, null, 2)}

Initial checks:
${JSON.stringify(initialChecks.filter(Boolean), null, 2)}

Rules:
- Do not plan to weaken or skip checks unless replacing an objectively wrong check with a stronger correct one.
- Separate unrelated failures.
- Keep fixes minimal and low-risk.
- Mark pre-existing/environmental issues separately with evidence.`,
  { label: "triage", phase: "3. Failure Triage", schema: TRIAGE_SCHEMA },
);

const repairs = [];
let latestChecks = initialChecks.filter(Boolean);

if (fix) {
  phase("4. Repair Loop");

  let open = triage.fixSlices.filter((slice) => slice.risk !== "high");
  let iteration = 0;

  while (open.length && iteration < 3) {
    iteration++;
    log(`Repair iteration ${iteration}: ${open.length} candidate slices`);

    const parallelSafe = open.filter((slice) => slice.parallelSafe);
    const sequential = open.filter((slice) => !slice.parallelSafe);

    const parallelRepairs = await parallel(
      parallelSafe.map(
        (slice) => () =>
          agent(
            `Repair this quality-gate failure slice.

Slice:
${JSON.stringify(slice, null, 2)}

Rules:
- Minimal edits only.
- Do not hide, delete, or weaken tests/checks.
- Preserve intended behavior.
- Run commandsAfter if practical.
- Return changed files, commands run, and remaining concerns.`,
            {
              label: `repair:${iteration}:${slice.name}`,
              phase: "4. Repair Loop",
              isolation: "worktree",
            },
          ),
      ),
    );

    repairs.push(...parallelRepairs.filter(Boolean));

    for (const slice of sequential) {
      const result = await agent(
        `Sequentially repair this quality-gate failure slice.

Slice:
${JSON.stringify(slice, null, 2)}

Same repair rules apply.`,
        { label: `repair-seq:${iteration}:${slice.name}`, phase: "4. Repair Loop" },
      );
      repairs.push(result);
    }

    latestChecks = await parallel(
      lanes.map(
        (lane) => () =>
          agent(
            `Re-run or re-assess validation lane after repairs: ${lane.name}

Available commands:
${JSON.stringify(commands, null, 2)}

Return only current status. If failures remain, include evidence and likely cause.`,
            {
              label: `recheck:${iteration}:${lane.name}`,
              phase: "4. Repair Loop",
              schema: CHECK_SCHEMA,
            },
          ),
      ),
    ).then((x) => x.filter(Boolean));

    const nextFailures = latestChecks
      .flatMap((check) => check.failures || [])
      .filter((f) => f.blocking && f.likelyCause !== "environment");
    if (nextFailures.length === 0) break;

    const nextPlan = await agent(
      `Create the next repair plan for remaining blocking failures.

Remaining failures:
${JSON.stringify(nextFailures, null, 2)}

Previous repairs:
${JSON.stringify(repairs, null, 2)}`,
      { label: `next-triage:${iteration}`, phase: "4. Repair Loop", schema: TRIAGE_SCHEMA },
    );

    open = nextPlan.fixSlices.filter((slice) => slice.risk !== "high");
  }
}

phase("5. Council Verdict");
const verdicts = await parallel([
  () =>
    agent(
      `You are the correctness judge. Decide if ${focus} can ship.

Gate:
${JSON.stringify(gate, null, 2)}

Latest checks:
${JSON.stringify(latestChecks, null, 2)}

Repairs:
${JSON.stringify(repairs, null, 2)}`,
      { label: "judge:correctness", phase: "5. Council Verdict", schema: VERDICT_SCHEMA },
    ),
  () =>
    agent(
      `You are the reliability/security judge. Decide if ${focus} can ship. Be adversarial.

${JSON.stringify({ gate, latestChecks, repairs }, null, 2)}`,
      { label: "judge:reliability-security", phase: "5. Council Verdict", schema: VERDICT_SCHEMA },
    ),
  () =>
    agent(
      `You are the maintainer/DX judge. Decide if ${focus} can ship without creating long-term mess.

${JSON.stringify({ gate, latestChecks, repairs }, null, 2)}`,
      { label: "judge:maintainer-dx", phase: "5. Council Verdict", schema: VERDICT_SCHEMA },
    ),
]);

const confidentShipVotes = verdicts
  .filter(Boolean)
  .filter((v) => v.ship && v.confidence !== "low").length;
const blockingReasons = verdicts.filter(Boolean).flatMap((v) => v.blockingReasons || []);
const ship = strict ? confidentShipVotes === 3 : confidentShipVotes >= 2;

return {
  focus,
  strict,
  commandsDiscovered: commands.length,
  initialChecks: initialChecks.filter(Boolean).length,
  repairs: repairs.length,
  ship,
  blockingReasons,
  verdicts: verdicts.filter(Boolean),
};
