export const meta = {
  name: "uc-test-hardening",
  description:
    "Discovers or accepts TypeScript/React test files, spawns one focused audit agent per test file, detects stale/incorrect/weak/duplicated/inefficient/brittle tests, then collates findings into a ranked remediation plan.",
  phases: [
    {
      title: "Input Resolution",
      detail: "Use supplied test paths or discover test files from the repository root",
    },
    {
      title: "Test File Swarm",
      detail: "Audit each test file independently with focused TypeScript/React testing heuristics",
    },
    {
      title: "Finding Collation",
      detail:
        "Deduplicate findings, rank by severity and ROI, and produce a repo-level remediation plan",
    },
    { title: "Final Report", detail: "Return concise per-file and cross-repo findings" },
  ],
};

const input = typeof args === "object" && args ? args : {};

const suppliedFiles = Array.isArray(input.files)
  ? input.files
  : typeof input.files === "string"
    ? input.files
        .split(/\r?\n|,/)
        .map((file) => file.trim())
        .filter(Boolean)
    : Array.isArray(input.paths)
      ? input.paths
      : typeof input.path === "string"
        ? [input.path]
        : [];

const batchSize = Number.isInteger(input.batchSize) ? input.batchSize : 40;
const maxFindingsPerFile = Number.isInteger(input.maxFindingsPerFile)
  ? input.maxFindingsPerFile
  : 12;

const includeE2E = input.includeE2E === true;
const includeIntegration = input.includeIntegration !== false;
const allowNonStandardTestFiles = input.allowNonStandardTestFiles === true;
const mode = input.mode || "audit"; // audit | fix-plan

const testFileGlobs = [
  "**/*.spec.ts",
  "**/*.spec.tsx",
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.spec.js",
  "**/*.spec.jsx",
  "**/*.test.js",
  "**/*.test.jsx",
  "**/__tests__/**/*.ts",
  "**/__tests__/**/*.tsx",
  "**/__tests__/**/*.js",
  "**/__tests__/**/*.jsx",
];

const excludedPathHints = [
  "node_modules/",
  "dist/",
  "build/",
  "coverage/",
  ".next/",
  ".nuxt/",
  ".turbo/",
  ".cache/",
  "storybook-static/",
  "__snapshots__/",
  ".generated.",
  ".gen.",
  "/generated/",
  "/__generated__/",
];

const excludedBasenamePatterns = [
  /\.snap$/,
  /(^|[-_.])fixture(s)?\.[jt]sx?$/i,
  /(^|[-_.])mock(s)?\.[jt]sx?$/i,
  /(^|[-_.])helper(s)?\.[jt]sx?$/i,
  /(^|[-_.])util(s)?\.[jt]sx?$/i,
  /(^|[-_.])test-utils?\.[jt]sx?$/i,
  /(^|[-_.])setup(Test|Tests)?\.[jt]sx?$/i,
];

function j(value) {
  return JSON.stringify(value, null, 2);
}

function basename(path) {
  return String(path).split(/[\\/]/).pop() || "";
}

function isLikelyTestFile(path) {
  const normalized = String(path).replace(/\\/g, "/");
  const base = basename(normalized);

  if (!/\.[jt]sx?$/.test(base)) return false;
  if (/\.(spec|test)\.[jt]sx?$/.test(base)) return true;

  if (normalized.includes("/__tests__/")) {
    return !excludedBasenamePatterns.some((pattern) => pattern.test(base));
  }

  return false;
}

function isExcludedPath(path) {
  const normalized = String(path).replace(/\\/g, "/");
  const base = basename(normalized);

  return (
    excludedPathHints.some((hint) => normalized.includes(hint)) ||
    excludedBasenamePatterns.some((pattern) => pattern.test(base))
  );
}

function uniqueSorted(paths) {
  return [...new Set((paths || []).map((path) => String(path).trim()).filter(Boolean))]
    .map((path) => path.replace(/\\/g, "/"))
    .filter((path) => !isExcludedPath(path))
    .filter((path) => allowNonStandardTestFiles || isLikelyTestFile(path))
    .filter((path) => includeE2E || !/\.(e2e|cy)\.(spec|test)\.[jt]sx?$/.test(path))
    .filter((path) => includeIntegration || !/integration|\.int\./i.test(path))
    .sort();
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

const TEST_DISCOVERY_SCHEMA = {
  type: "object",
  properties: {
    testFiles: { type: "array", items: { type: "string" } },
    commandUsed: { type: "string" },
    discoveryNotes: { type: "array", items: { type: "string" } },
  },
  required: ["testFiles", "commandUsed", "discoveryNotes"],
};

const TEST_FILE_AUDIT_SCHEMA = {
  type: "object",
  properties: {
    filePath: { type: "string" },
    testedUnits: { type: "array", items: { type: "string" } },
    frameworkDetected: { type: "string" },
    testStyleDetected: { type: "string" },
    overallGrade: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          severity: { type: "string" },
          category: { type: "string" },
          title: { type: "string" },
          evidence: { type: "string" },
          whyItMatters: { type: "string" },
          recommendedFix: { type: "string" },
          affectedTestNames: { type: "array", items: { type: "string" } },
          likelyFixDifficulty: { type: "string" },
        },
        required: [
          "id",
          "severity",
          "category",
          "title",
          "evidence",
          "whyItMatters",
          "recommendedFix",
          "affectedTestNames",
          "likelyFixDifficulty",
        ],
      },
    },
    missingCoverage: { type: "array", items: { type: "string" } },
    duplicateOrOverlappingTests: { type: "array", items: { type: "string" } },
    highestRoiFixes: { type: "array", items: { type: "string" } },
    safeToAutofix: { type: "boolean" },
  },
  required: [
    "filePath",
    "testedUnits",
    "frameworkDetected",
    "testStyleDetected",
    "overallGrade",
    "findings",
    "missingCoverage",
    "duplicateOrOverlappingTests",
    "highestRoiFixes",
    "safeToAutofix",
  ],
};

const COLLATION_SCHEMA = {
  type: "object",
  properties: {
    auditedFileCount: { type: "number" },
    repoTestHealthSummary: { type: "string" },
    systemicProblems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          severity: { type: "string" },
          summary: { type: "string" },
          representativeFiles: { type: "array", items: { type: "string" } },
          recommendedRepoLevelFix: { type: "string" },
        },
        required: [
          "category",
          "severity",
          "summary",
          "representativeFiles",
          "recommendedRepoLevelFix",
        ],
      },
    },
    highestPriorityFileFixes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          filePath: { type: "string" },
          reason: { type: "string" },
          firstFix: { type: "string" },
        },
        required: ["filePath", "reason", "firstFix"],
      },
    },
    duplicateClusters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          files: { type: "array", items: { type: "string" } },
          duplicatedBehavior: { type: "string" },
          consolidationPlan: { type: "string" },
        },
        required: ["files", "duplicatedBehavior", "consolidationPlan"],
      },
    },
    remediationOrder: { type: "array", items: { type: "string" } },
    notesForFutureAgents: { type: "array", items: { type: "string" } },
  },
  required: [
    "auditedFileCount",
    "repoTestHealthSummary",
    "systemicProblems",
    "highestPriorityFileFixes",
    "duplicateClusters",
    "remediationOrder",
    "notesForFutureAgents",
  ],
};

phase("Input Resolution");

let testFiles = suppliedFiles;

if (!testFiles.length) {
  const discovery = await agent(
    `
Discover all TypeScript/React/common JS test files from the repository root.

Use the safest repo-root command available. Prefer:
1. git ls-files
2. find . if git is unavailable
3. package-manager-aware listing only if needed

Include common test file patterns:
${j(testFileGlobs)}

Exclude:
${j(excludedPathHints)}

For files inside \`__tests__\`, include likely test files but exclude obvious helpers, fixtures, mocks, setup files, utilities, snapshots, and generated files unless they themselves contain executable tests.

${includeE2E ? "Include E2E/Cypress/Playwright-style test files." : "Exclude E2E/Cypress-style test files unless they are normal component/unit tests."}
${includeIntegration ? "Include integration-style tests." : "Exclude obvious integration tests."}

Return a flat, unique, sorted list of repository-relative paths only.
Do not edit files.
`,
    {
      label: "discover-test-files",
      phase: "Input Resolution",
      schema: TEST_DISCOVERY_SCHEMA,
    },
  );

  testFiles = discovery.testFiles || [];
}

testFiles = uniqueSorted(testFiles);

if (!testFiles.length) {
  return {
    status: "aborted-no-test-files",
    reason: "No matching TypeScript/React/common JS test files were supplied or discovered."
  };
}

log(`Discovered ${testFiles.length} test files.`);

async function auditOneTestFile(filePath, index, total) {
  return agent(
    `
Audit one test file with extreme precision.

File ${index + 1} of ${total}:
${filePath}

Mode:
${mode}

Task:
Inspect this test file and, where needed, inspect the source units it tests, nearby fixtures, mocks, test utilities, providers, factories, and related tests.

Assess for:
1. Stale tests: tests asserting behavior that no longer matters, references to obsolete APIs, dead branches, outdated snapshots, legacy migration assumptions, or comments/titles that no longer match implementation.
2. Incorrect tests: false positives, assertions that do not prove the title, tests passing for the wrong reason, missing awaits, incorrect mocks, unhandled promises, invalid fake timers, race-prone async, wrong setup/teardown, or mismatched user behavior.
3. Weak or missing gold standards: tests that check implementation details instead of observable behavior, lack meaningful assertions, overuse snapshots, fail to assert accessibility/semantics, or do not encode business-critical invariants.
4. React Testing Library priority violations: prefer role/name queries, accessible labels, text only when appropriate, avoid brittle test ids unless justified, avoid container/querySelector, prefer userEvent over fireEvent for real interactions, assert visible user-observable outcomes.
5. Test isolation problems: shared mutable state, order dependence, leaked mocks, leaked timers, singleton pollution, missing cleanup, global setup doing too much, or tests that only pass as a group.
6. Overmocking and under-integration: mocks that erase the behavior under test, network mocks that do not match reality, provider/router/store mocks that hide real failures, or tests that should use MSW/factories instead.
7. Duplication and overlap: repeated tests covering the same behavior, copy-paste variants with no new signal, multiple files asserting the same implementation detail, or redundant snapshot + assertion pairs.
8. Inefficiency: slow tests from excessive rendering, repeated heavy setup, unnecessary integration scope, real timers, huge fixtures, repeated provider construction, or avoidable async waits.
9. Flake risks: waitFor misuse, arbitrary sleeps, timing assumptions, real network/storage/date/randomness, insufficient act boundaries, concurrent rendering assumptions, or environment leakage.
10. Coverage gaps: missing edge cases, error states, loading/empty states, permissions, accessibility states, keyboard interaction, form validation, boundary values, cancellation, retries, cache invalidation, and regression-prone branches.
11. Maintainability: unclear test names, Arrange/Act/Assert confusion, hidden helpers, magic fixtures, unreadable mocks, tests coupled to CSS/classes/private implementation, or poor failure messages.
12. Framework correctness: Vitest/Jest matcher misuse, React 18/19 rendering concerns, Testing Library async query misuse, fake timer mode mistakes, module mock hoisting issues, ESM/CJS mocking problems.

Severity rules:
- critical: test is wrong, false-positive, masks a real defect, or blocks trustworthy refactors.
- high: test is brittle/stale/weak around important behavior.
- medium: meaningful quality or maintainability issue.
- low: cleanup only.

Output requirements:
- Maximum ${maxFindingsPerFile} findings.
- Prefer concrete evidence with test names, line references if available, and source behavior.
- Do not include raw file dumps.
- Do not invent issues.
- Do not propose rewriting everything.
- If the file is mostly healthy, say so and list only the highest-value improvements.
- If mode is "audit", do not edit files.
- If mode is "fix-plan", still do not edit files; produce a precise fix plan only.
`,
    {
      label: `test-audit:${filePath}`,
      phase: "Test File Swarm",
      schema: TEST_FILE_AUDIT_SCHEMA,
    },
  );
}

phase("Test File Swarm");

const allReports = [];
const batches = chunk(testFiles, batchSize);

for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
  const batch = batches[batchIndex];

  log(`Auditing batch ${batchIndex + 1}/${batches.length}: ${batch.length} files`);

  const batchReports = await parallel(
    batch.map(
      (filePath, localIndex) => () =>
        auditOneTestFile(filePath, batchIndex * batchSize + localIndex, testFiles.length),
    ),
  );

  allReports.push(...batchReports.filter(Boolean));
}

phase("Finding Collation");

const compactReports = allReports.map((report) => ({
  filePath: report.filePath,
  frameworkDetected: report.frameworkDetected,
  overallGrade: report.overallGrade,
  findingCount: (report.findings || []).length,
  criticalHighFindings: (report.findings || [])
    .filter((finding) => ["critical", "high"].includes(String(finding.severity).toLowerCase()))
    .slice(0, 8),
  missingCoverage: (report.missingCoverage || []).slice(0, 8),
  duplicateOrOverlappingTests: (report.duplicateOrOverlappingTests || []).slice(0, 8),
  highestRoiFixes: (report.highestRoiFixes || []).slice(0, 5),
  safeToAutofix: report.safeToAutofix,
}));

const collation = await agent(
  `
Collate all per-file test audit reports into a repo-level remediation plan.

Audited files:
${testFiles.length}

Compact reports:
${j(compactReports)}

Rules:
- Deduplicate repeated findings.
- Identify systemic patterns across files.
- Rank by trust impact first, then refactor safety, then developer ROI, then speed.
- Prioritize incorrect/false-positive/stale tests over style cleanup.
- Distinguish file-local fixes from repo-level test harness improvements.
- Do not dump every finding. Summarize with representative files.
- Preserve exact file paths.
- Produce a remediation order suitable for a follow-up coding workflow.
`,
  {
    label: "collate-test-audit",
    phase: "Finding Collation",
    schema: COLLATION_SCHEMA,
  },
);

phase("Final Report");

return {
  status: "test-audit-complete",
  mode,
  auditedFileCount: testFiles.length,
  batchSize,
  collation,
  reports: allReports
};
