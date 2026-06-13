export const meta = {
  name: "uc-perf-audit",
  description:
    "Profiler-guided optimization audit: find hotspots, fan out one analyst per hotspot to propose concrete optimizations, then a judge panel ranks by impact × confidence ÷ effort and adversarially checks each will not regress correctness.",
  whenToUse:
    'A performance audit of a service or codebase where you want a ranked, verified list of optimizations rather than guesses. Pass args {root, profileCmd, focus}. root defaults to "src"; profileCmd is an optional command to gather real profiling data (e.g. a benchmark or profiler run); focus biases the hunt ("startup time", "memory", "p99 latency", "bundle size"). If no profileCmd, agents reason from code + complexity.',
  phases: [
    { title: "Profile", detail: "identify the real hotspots / bottlenecks" },
    { title: "Analyze", detail: "one analyst per hotspot proposes optimizations" },
    { title: "Judge", detail: "rank by impact/effort and refute correctness risks" },
    { title: "Plan", detail: "write the prioritized optimization plan" },
  ],
};

const root = args?.root || "src";
const profileCmd = args?.profileCmd || "";
const focus = args?.focus || "CPU time, allocations, and algorithmic complexity";

const HOTSPOTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    hotspots: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          file: { type: "string" },
          symbol: { type: "string" },
          evidence: { type: "string", description: "profiler line, big-O, hot loop, N+1, etc." },
          suspectedCost: {
            type: "string",
            enum: ["cpu", "memory", "io", "network", "render", "startup"],
          },
        },
        required: ["file", "symbol", "evidence", "suspectedCost"],
      },
    },
  },
  required: ["hotspots"],
};

const PROPOSAL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    hotspot: { type: "string" },
    optimizations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          change: { type: "string", description: "the concrete optimization" },
          expectedImpact: { type: "string", enum: ["large", "moderate", "small"] },
          effort: { type: "string", enum: ["trivial", "moderate", "large"] },
          risk: {
            type: "string",
            description: "how it could change behavior or what it trades off",
          },
        },
        required: ["change", "expectedImpact", "effort", "risk"],
      },
    },
  },
  required: ["hotspot", "optimizations"],
};

const JUDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    realGain: {
      type: "boolean",
      description: "will this genuinely improve perf in a hot path (not a micro-opt on cold code)",
    },
    safe: {
      type: "boolean",
      description: "does it preserve correctness / not introduce a subtle regression",
    },
    impactScore: { type: "integer", description: "0-10 expected real-world impact" },
    note: { type: "string" },
  },
  required: ["realGain", "safe", "impactScore", "note"],
};

// 1. Profile -----------------------------------------------------------
phase("Profile");
const prof = await agent(
  `Identify the genuine performance hotspots under \`${root}\`, focusing on ${focus}. ` +
    `${profileCmd ? `First gather real data by running \`${profileCmd}\` and read its output.` : "Reason from the code: hot loops, quadratic patterns, N+1 queries, repeated work, large allocations."} ` +
    `Return the top ~10 hotspots with evidence — not stylistic nitpicks.`,
  { phase: "Profile", schema: HOTSPOTS_SCHEMA, agentType: "general-purpose" },
);
const hotspots = prof?.hotspots || [];
log(`Found ${hotspots.length} hotspots`);
if (!hotspots.length) return { summary: 'No significant hotspots identified.', plan: '' }

// 2. Analyze: one analyst per hotspot ----------------------------------
phase("Analyze");
const proposals = (
  await parallel(
    hotspots.map(
      (h) => () =>
        agent(
          `Analyze the hotspot \`${h.symbol}\` in \`${h.file}\` (evidence: ${h.evidence}; cost type: ${h.suspectedCost}). ` +
            `Propose 1-3 concrete optimizations. For each, estimate impact and effort honestly and name the behavioral risk/tradeoff. ` +
            `Read the real code; prefer algorithmic wins over micro-optimizations.`,
          {
            label: `analyze:${h.symbol}`,
            phase: "Analyze",
            schema: PROPOSAL_SCHEMA,
            agentType: "general-purpose",
          },
        ),
    ),
  )
).filter(Boolean);

// Flatten to individual candidate optimizations
const candidates = proposals.flatMap((p) =>
  (p.optimizations || []).map((o) => ({ ...o, hotspot: p.hotspot })),
);
log(`Judging ${candidates.length} candidate optimizations`);

// 3. Judge panel — 2 judges per candidate; refute weak/unsafe ones -----
phase("Judge");
const judged = await parallel(
  candidates.map(
    (c) => () =>
      parallel(
        [0, 1].map(
          (n) => () =>
            agent(
              `Judge optimization #${n + 1} for hotspot "${c.hotspot}": "${c.change}" (claimed impact ${c.expectedImpact}, effort ${c.effort}, risk: ${c.risk}). ` +
                `Will it produce a REAL gain on a genuinely hot path, and is it SAFE (no correctness regression)? Be skeptical of micro-optimizations on cold code. Score real-world impact 0-10.`,
              {
                label: "judge",
                phase: "Judge",
                schema: JUDGE_SCHEMA,
                agentType: "general-purpose",
              },
            ),
        ),
      ).then((votes) => {
        const v = votes.filter(Boolean);
        const impact = v.reduce((s, x) => s + x.impactScore, 0) / (v.length || 1);
        const ok = v.length > 0 && v.every((x) => x.safe) && v.some((x) => x.realGain);
        const effortW = { trivial: 1, moderate: 2, large: 4 }[c.effort] || 2;
        return {
          cand: c,
          keep: ok,
          impact: Math.round(impact * 10) / 10,
          score: Math.round((impact / effortW) * 10) / 10,
        };
      }),
  ),
);
const ranked = judged.filter((j) => j.keep).sort((a, b) => b.score - a.score);
log(`${ranked.length}/${candidates.length} optimizations passed the safety + impact bar`);

// 4. Plan --------------------------------------------------------------
phase("Plan");
const plan = await agent(
  `Write a prioritized performance plan in Markdown from these verified, ranked optimizations (sorted by impact/effort):\n\n` +
    `${JSON.stringify(
      ranked.map((r) => ({
        hotspot: r.cand.hotspot,
        change: r.cand.change,
        impact: r.impact,
        effort: r.cand.effort,
        risk: r.cand.risk,
        score: r.score,
      })),
      null,
      2,
    )}\n\n` +
    `Group as "🚀 Quick wins (high impact, low effort)", "🏗 Bigger bets", and "⚠️ Watch the tradeoff". ` +
    `For each: where, the change, expected gain, effort, and how to measure it before/after. Output only markdown.`,
  { phase: "Plan" },
);

return { plan, hotspots: hotspots.length, candidates: candidates.length, kept: ranked.length, ranked: ranked.map((r) => r.cand) }
