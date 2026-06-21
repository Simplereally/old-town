export const meta = {
  name: "uc-pr-review-adversarial",
  description:
    "Review a diff/PR by fanning one reviewer agent per changed file, then adversarially verifying every issue with independent skeptics before it reaches the report.",
  whenToUse:
    'Reviewing a PR or a large diff where you want every flagged issue independently confirmed so you only see real, high-signal findings. Pass args {base, head, paths, focus}. base/head are git refs (default {base:"origin/main", head:"HEAD"}). paths optionally narrows the review. focus is free text ("security", "concurrency", etc.) to bias the lenses.',
  phases: [
    { title: "Scope", detail: "list changed files in the diff and bucket them" },
    { title: "Review", detail: "one reviewer agent per changed file -> raw issues" },
    { title: "Verify", detail: "adversarial skeptics try to refute each issue" },
    { title: "Synthesize", detail: "write a severity-ranked review of surviving issues" },
  ],
};

const base = args?.base || "origin/main";
const head = args?.head || "HEAD";
const pathFilter = args?.paths || "";
const focus = args?.focus || "general correctness, security, and maintainability";

const FILE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { files: { type: "array", items: { type: "string" } } },
  required: ["files"],
};

const ISSUE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    file: { type: "string" },
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          line: { type: "string", description: 'line or hunk reference, e.g. "L42" or "L88-95"' },
          category: {
            type: "string",
            enum: ["bug", "security", "performance", "correctness", "style", "test-gap", "design"],
          },
          severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
          rationale: {
            type: "string",
            description: "why this is a real problem, grounded in the diff",
          },
          suggestion: { type: "string", description: "concrete fix" },
        },
        required: ["title", "line", "category", "severity", "rationale", "suggestion"],
      },
    },
  },
  required: ["file", "issues"],
};

const VERDICT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    real: { type: "boolean", description: "true only if you could NOT refute the issue" },
    refutation: {
      type: "string",
      description: "the strongest argument the issue is wrong, a non-issue, or already handled",
    },
    adjustedSeverity: { type: "string", enum: ["critical", "high", "medium", "low", "none"] },
  },
  required: ["real", "refutation", "adjustedSeverity"],
};

// 1. Scope --------------------------------------------------------------
phase("Scope");
const scoped = await agent(
  `Run \`git diff --name-only ${base}...${head}\`${pathFilter ? ` and keep only paths matching: ${pathFilter}` : ""}. ` +
    `Exclude lockfiles, generated code, vendored deps, and snapshots. Return the reviewable source files only.`,
  { phase: "Scope", schema: FILE_SCHEMA, agentType: "general-purpose" },
);
const files = scoped?.files || [];
log(`Reviewing ${files.length} changed files (${base}...${head})`);
if (!files.length) return { summary: 'No reviewable files in this diff.', issues: [] }

// 2. Review: one agent per file ----------------------------------------
phase("Review");
const reviewed = await parallel(
  files.map(
    (f) => () =>
      agent(
        `You are a meticulous senior engineer reviewing ONLY the changes to \`${f}\` in the diff ${base}...${head}. ` +
          `Read the file and run \`git diff ${base}...${head} -- ${f}\` for the hunks. Focus on: ${focus}. ` +
          `Flag concrete, line-anchored problems introduced or exposed by THIS diff. Do not invent issues to fill a quota; an empty list is a valid, good answer. ` +
          `Ignore pre-existing problems untouched by the diff.`,
        {
          label: `review:${f}`,
          phase: "Review",
          schema: ISSUE_SCHEMA,
          agentType: "general-purpose",
        },
      ),
  ),
);

const allIssues = reviewed
  .filter(Boolean)
  .flatMap((r) => (r.issues || []).map((i) => ({ ...i, file: r.file })));
log(`Collected ${allIssues.length} candidate issues; verifying adversarially`);

// 3. Verify: 3 independent skeptics per issue, majority must fail to refute
phase("Verify");
const LENSES = ["correctness", "security", "does-this-actually-break-at-runtime"];
const verified = await parallel(
  allIssues.map(
    (issue) => () =>
      parallel(
        LENSES.map(
          (lens) => () =>
            agent(
              `A reviewer claims this issue in \`${issue.file}\` (${issue.line}):\n` +
                `"${issue.title}" — ${issue.rationale}\n\n` +
                `Through the ${lens} lens, try HARD to REFUTE it. Read the actual code/diff (\`git diff ${base}...${head} -- ${issue.file}\`). ` +
                `Is it wrong, a non-issue in context, or already handled elsewhere? Set real=false if you can refute it; real=true only if it genuinely holds.`,
              {
                label: `verify:${lens}`,
                phase: "Verify",
                schema: VERDICT_SCHEMA,
                agentType: "general-purpose",
              },
            ),
        ),
      ).then((votes) => {
        const v = votes.filter(Boolean);
        const survived = v.filter((x) => x.real).length;
        const refutations = v.filter((x) => !x.real).map((x) => x.refutation);
        return { issue, survived, total: v.length, refutations };
      }),
  ),
);

const confirmed = verified
  .filter((v) => v.survived * 2 > v.total) // strict majority of skeptics could not refute
  .map((v) => v.issue);
log(`${confirmed.length}/${allIssues.length} issues survived adversarial verification`);

// 4. Synthesize --------------------------------------------------------
phase("Synthesize");
const review = await agent(
  `Write a focused PR review in Markdown from these verified issues (every one survived independent adversarial checks, so do NOT hedge them):\n\n` +
    `${JSON.stringify(confirmed, null, 2)}\n\n` +
    `Structure: a one-line verdict (block / approve-with-nits / approve), then "🔴 Blocking", "🟠 Should-fix", "🟡 Nits" grouped by severity. ` +
    `Each item: file:line, one-sentence problem, concrete suggested fix. If a section is empty, omit it. End with a 2-3 sentence summary. Output only the markdown.`,
  { phase: "Synthesize" },
);

return { review, candidateCount: allIssues.length, confirmedCount: confirmed.length, confirmed }
