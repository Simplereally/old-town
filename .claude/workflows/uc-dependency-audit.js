export const meta = {
  name: "uc-dependency-audit",
  description:
    "Audit every dependency in parallel — one agent per package checks CVEs, breaking changes, maintenance health, and whether it is actually used — then rank by risk and write a remediation plan.",
  whenToUse:
    'A full dependency audit of a project: security, staleness, abandonment, and dead dependencies, with an actionable upgrade plan. Pass args {manifest, ecosystem, includeTransitive}. manifest defaults to "package.json"; ecosystem is "npm"|"pip"|"cargo"|"go"|"maven" (default "npm"); includeTransitive (default false) widens the sweep. Uses web search per package for current advisories.',
  phases: [
    { title: "Inventory", detail: "parse the manifest into a dependency list" },
    { title: "Investigate", detail: "one agent per dependency: CVEs, breaking, health, usage" },
    { title: "Rank", detail: "score and order by risk" },
    { title: "Plan", detail: "write the remediation / upgrade plan" },
  ],
};

const manifest = (args && args.manifest) || "package.json";
const ecosystem = (args && args.ecosystem) || "npm";
const includeTransitive = !!(args && args.includeTransitive);

const DEPS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    deps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          version: { type: "string" },
          kind: { type: "string", enum: ["prod", "dev", "peer", "optional", "transitive"] },
        },
        required: ["name", "version", "kind"],
      },
    },
  },
  required: ["deps"],
};

const FINDING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    current: { type: "string" },
    latest: { type: "string", description: "latest stable, empty if unknown" },
    cves: {
      type: "array",
      items: { type: "string" },
      description: "CVE/advisory ids affecting the current version",
    },
    breakingToLatest: {
      type: "boolean",
      description: "does upgrading to latest cross a major / documented breaking change",
    },
    maintenance: { type: "string", enum: ["healthy", "slowing", "stale", "abandoned", "unknown"] },
    usedInRepo: {
      type: "boolean",
      description: "is it actually imported/required anywhere in the code",
    },
    notes: { type: "string" },
  },
  required: ["name", "current", "cves", "breakingToLatest", "maintenance", "usedInRepo", "notes"],
};

// 1. Inventory ---------------------------------------------------------
phase("Inventory");
const inv = await agent(
  `Parse \`${manifest}\` for the ${ecosystem} project and list its dependencies with versions and kind (prod/dev/peer/optional). ` +
    `${includeTransitive ? "Also include notable transitive deps from the lockfile." : "Direct dependencies only."}`,
  { phase: "Inventory", schema: DEPS_SCHEMA, agentType: "general-purpose" },
);
const deps = (inv && inv.deps) || [];
log(`Auditing ${deps.length} dependencies (${ecosystem})`);
if (!deps.length) return { summary: 'No dependencies found.', findings: [] }

// 2. Investigate: one agent per dependency -----------------------------
phase("Investigate");
const findings = (
  await parallel(
    deps.map(
      (d) => () =>
        agent(
          `Audit the ${ecosystem} package "${d.name}" currently pinned at ${d.version}.\n` +
            `1) Use web search to find the latest stable version and any known CVEs/advisories affecting ${d.version}.\n` +
            `2) Judge maintenance health from recent release cadence and repo activity.\n` +
            `3) Determine whether upgrading to latest crosses a major/breaking boundary (check the changelog).\n` +
            `4) Grep the repo to see if "${d.name}" is actually imported/required anywhere (dead-dep check).\n` +
            `Report verifiable facts only; never invent CVE ids.`,
          {
            label: `audit:${d.name}`,
            phase: "Investigate",
            schema: FINDING_SCHEMA,
            agentType: "general-purpose",
          },
        ),
    ),
  )
).filter(Boolean);

// 3. Rank — plain JS scoring, no agent needed --------------------------
phase("Rank");
const score = (f) => {
  let s = 0;
  s += (f.cves ? f.cves.length : 0) * 40;
  s += { abandoned: 25, stale: 15, slowing: 6, healthy: 0, unknown: 8 }[f.maintenance] || 0;
  if (!f.usedInRepo) s += 12; // dead deps are cheap, high-value cleanup
  if (f.breakingToLatest) s += 4;
  return s;
};
const ranked = findings.map((f) => ({ ...f, risk: score(f) })).sort((a, b) => b.risk - a.risk);
const unused = ranked.filter((f) => !f.usedInRepo).map((f) => f.name);
log(
  `Ranked. ${ranked.filter((f) => f.cves && f.cves.length).length} with advisories, ${unused.length} unused`,
);

// 4. Plan --------------------------------------------------------------
phase("Plan");
const plan = await agent(
  `Write a dependency remediation plan in Markdown from this ranked, risk-scored audit:\n\n${JSON.stringify(ranked, null, 2)}\n\n` +
    `Sections: "🚨 Security (patch now)" — packages with CVEs and the exact safe version to move to; ` +
    `"🧹 Remove (unused)" — dead dependencies to drop; "⬆️ Upgrades" split into safe (no breaking) vs needs-migration; ` +
    `"💀 Maintenance risk" — stale/abandoned packages and suggested replacements. ` +
    `Give the concrete install/remove commands per item. Open with a one-paragraph risk summary. Output only markdown.`,
  { phase: "Plan" },
);

return { plan, count: ranked.length, withCVEs: ranked.filter((f) => f.cves && f.cves.length).length, unused, ranked }
