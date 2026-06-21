export const meta = {
  name: "uc-bug-hunt",
  description:
    "Sweep a codebase for real bugs using diverse finder agents in a loop-until-dry, then confirm each via a multi-lens majority vote so only reproducible, real bugs are reported.",
  whenToUse:
    'A codebase-wide bug hunt where coverage matters and you only want confirmed, non-duplicate bugs with repro steps. Pass args {root, include, maxRounds, focus}. root defaults to "src", include is an optional glob filter, maxRounds caps discovery rounds (default 6), focus biases finders (e.g. "concurrency", "auth"). Honors the run token budget when set.',
  phases: [
    { title: "Map", detail: "inventory the code surface into hunt targets" },
    { title: "Find", detail: "diverse finders sweep targets each round" },
    { title: "Verify", detail: "multi-lens skeptics majority-vote each fresh bug" },
    { title: "Report", detail: "rank confirmed bugs and write the report" },
  ],
};

const root = args?.root || "src";
const include = args?.include || "";
const maxRounds = args?.maxRounds || 6;
const focus =
  args?.focus ||
  "logic errors, null/undefined handling, async/await mistakes, off-by-one, resource leaks, and unsafe input handling";

const TARGETS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    targets: {
      type: "array",
      items: { type: "string" },
      description: "directories or files to assign to finders",
    },
  },
  required: ["targets"],
};

const BUGS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    bugs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          file: { type: "string" },
          symbol: { type: "string", description: "function/class/region where the bug lives" },
          desc: { type: "string", description: "what is wrong and the conditions that trigger it" },
          severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
          repro: { type: "string", description: "concrete steps or inputs that trigger the bug" },
        },
        required: ["file", "symbol", "desc", "severity", "repro"],
      },
    },
  },
  required: ["bugs"],
};

const VERDICT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    real: { type: "boolean" },
    reasoning: { type: "string", description: "why it is or is not a genuine, reachable bug" },
    fixSketch: { type: "string", description: "one-line fix idea if real" },
  },
  required: ["real", "reasoning", "fixSketch"],
};

// Distinct finder personas so coverage isn't redundant.
const FINDERS = [
  { key: "control-flow", lens: "control flow, branching, early returns, and error paths" },
  {
    key: "state-async",
    lens: "state mutation, async/await ordering, race conditions, and unhandled rejections",
  },
  {
    key: "boundaries",
    lens: "null/undefined, empty collections, off-by-one, and boundary conditions",
  },
  { key: "io-input", lens: "untrusted input, parsing, injection, and resource/handle leaks" },
];
const VERIFY_LENSES = ["is-it-reachable", "correctness", "security-or-data-loss"];

const key = (b) =>
  `${b.file}::${b.symbol}::${b.desc.slice(0, 60)}`.toLowerCase().replace(/\s+/g, " ");
const budgetExhausted = () =>
  !!(budget?.total && budget.total > 0 && budget.used >= budget.total * 0.85);

// 1. Map ---------------------------------------------------------------
phase("Map");
const mapped = await agent(
  `List concrete hunt targets under \`${root}\`${include ? ` matching ${include}` : ""} — group source files into ~8-16 coherent targets ` +
    `(by directory or feature) so finders can divide and conquer. Exclude tests, generated, and vendored code.`,
  { phase: "Map", schema: TARGETS_SCHEMA, agentType: "general-purpose" },
);
const targets = mapped?.targets || [root];
log(`Hunting across ${targets.length} targets`);

// 2-3. Loop-until-dry: find -> verify, dedupe against everything SEEN ---
const seen = new Set();
const confirmed = [];
let dry = 0;
let round = 0;
while (dry < 2 && round < maxRounds && !budgetExhausted()) {
  round++;
  phase("Find");
  const found = (
    await parallel(
      targets.flatMap((t) =>
        FINDERS.map(
          (f) => () =>
            agent(
              `Round ${round}. Hunt for bugs in \`${t}\` through the lens of ${f.lens}. Overall focus: ${focus}. ` +
                `Read the code. Report only concrete, reachable bugs with real repro conditions — never speculative "could be improved" notes. ` +
                `If you find nothing new, return an empty array.`,
              {
                label: `find:${f.key}`,
                phase: "Find",
                schema: BUGS_SCHEMA,
                agentType: "general-purpose",
              },
            ),
        ),
      ),
    )
  )
    .filter(Boolean)
    .flatMap((r) => r.bugs || []);

  const fresh = found.filter((b) => !seen.has(key(b)));
  if (!fresh.length) {
    dry++;
    log(`Round ${round}: no new bugs (dry streak ${dry}/2)`);
    continue;
  }
  dry = 0;
  fresh.forEach((b) => seen.add(key(b))); // dedupe against SEEN, not just confirmed — or rejects reappear forever

  phase("Verify");
  const judged = await parallel(
    fresh.map(
      (b) => () =>
        parallel(
          VERIFY_LENSES.map(
            (lens) => () =>
              agent(
                `Through the "${lens}" lens, decide if this is a genuine bug. Read the actual code in \`${b.file}\` around \`${b.symbol}\`.\n` +
                  `Claim: ${b.desc}\nClaimed repro: ${b.repro}\n` +
                  `Be a skeptic: set real=false unless the code truly exhibits this and it is reachable.`,
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
          const yes = v.filter((x) => x.real);
          return {
            bug: b,
            real: yes.length * 2 > v.length,
            fixSketch: yes[0]?.fixSketch || "",
          };
        }),
    ),
  );
  const newlyConfirmed = judged
    .filter((j) => j.real)
    .map((j) => ({ ...j.bug, fixSketch: j.fixSketch }));
  confirmed.push(...newlyConfirmed);
  log(`Round ${round}: +${newlyConfirmed.length} confirmed (total ${confirmed.length})`);
}

// 4. Report ------------------------------------------------------------
phase("Report");
const report = await agent(
  `Write a bug-hunt report in Markdown from these confirmed bugs (each survived a multi-lens majority vote):\n\n` +
    `${JSON.stringify(confirmed, null, 2)}\n\n` +
    `Order by severity (critical first). Each entry: \`file\` — symbol, the bug, the repro, and the one-line fix sketch. ` +
    `Open with a count-by-severity summary table. If there are zero bugs, say so plainly and note what was swept. Output only markdown.`,
  { phase: "Report" },
);

return { report, rounds: round, confirmedCount: confirmed.length, confirmed }
