export const meta = {
  name: "uc-incident-rca",
  description:
    "Root-cause an incident by generating competing hypotheses, gathering evidence for each in parallel, adversarially refuting them, then synthesizing the surviving root cause with a minimal fix and a verification plan.",
  whenToUse:
    'Debugging a hard production incident, flaky failure, or regression where the cause is non-obvious and you want hypotheses tested against evidence instead of a single guess. Pass args {symptom, logs, stack, suspectRange, repoRoot}. symptom (REQUIRED) describes the failure; logs/stack are pasted evidence; suspectRange is an optional git range or recent commit window; repoRoot defaults to ".". Pass any timestamps/log text through args — the script cannot read the clock.',
  phases: [
    { title: "Frame", detail: "turn the symptom + evidence into distinct hypotheses" },
    { title: "Investigate", detail: "one investigator gathers evidence per hypothesis" },
    { title: "Refute", detail: "adversaries try to kill each hypothesis" },
    { title: "Diagnose", detail: "rank survivors, write RCA + minimal fix" },
  ],
};

const symptom = (args && args.symptom) || "Unspecified failure — infer from logs/stack";
const logs = (args && args.logs) || "";
const stack = (args && args.stack) || "";
const suspectRange = (args && args.suspectRange) || "";
const repoRoot = (args && args.repoRoot) || ".";

const HYP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    hypotheses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          claim: { type: "string", description: "a specific, falsifiable root-cause hypothesis" },
          mechanism: { type: "string", description: "how this would produce the observed symptom" },
          whereToLook: {
            type: "string",
            description: "files/areas/commits that would confirm or deny it",
          },
        },
        required: ["id", "claim", "mechanism", "whereToLook"],
      },
    },
  },
  required: ["hypotheses"],
};

const EVIDENCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    supports: { type: "string", enum: ["confirms", "partial", "contradicts", "inconclusive"] },
    evidence: {
      type: "string",
      description: "concrete code/log/commit findings, with file:line or commit refs",
    },
    confidence: { type: "integer", description: "0-10" },
  },
  required: ["id", "supports", "evidence", "confidence"],
};

const REFUTE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    survives: { type: "boolean", description: "true if you could NOT refute it" },
    counter: { type: "string", description: "the strongest argument it is NOT the cause" },
  },
  required: ["id", "survives", "counter"],
};

const evidenceBlock =
  `SYMPTOM: ${symptom}\n` +
  (stack ? `\nSTACK/ERROR:\n${stack}\n` : "") +
  (logs ? `\nLOGS:\n${logs}\n` : "") +
  (suspectRange ? `\nSUSPECT COMMIT RANGE: ${suspectRange}\n` : "");

// 1. Frame -------------------------------------------------------------
phase("Frame");
const framed = await agent(
  `You are leading an incident RCA in the repo at \`${repoRoot}\`.\n\n${evidenceBlock}\n` +
    `Generate 4-6 DISTINCT, falsifiable root-cause hypotheses that could produce this symptom (e.g. recent code change, dependency/version, config/env, data/edge case, concurrency/timing, resource exhaustion). ` +
    `For each, state the mechanism and exactly where to look to confirm or deny it. Make them genuinely different, not rephrasings.`,
  { phase: "Frame", schema: HYP_SCHEMA, agentType: "general-purpose" },
);
const hypotheses = (framed && framed.hypotheses) || [];
log(`Framed ${hypotheses.length} hypotheses`);
if (!hypotheses.length)
  return { rca: 'Could not form hypotheses from the given evidence.', root: null }

// 2. Investigate: one evidence-gatherer per hypothesis -----------------
phase("Investigate");
const evidence = (
  await parallel(
    hypotheses.map(
      (h) => () =>
        agent(
          `Investigate hypothesis ${h.id}: "${h.claim}" (mechanism: ${h.mechanism}). Look here: ${h.whereToLook}. Repo root: \`${repoRoot}\`.\n\n` +
            `Context:\n${evidenceBlock}\n` +
            `Read the relevant code; use git blame/log on the suspect area${suspectRange ? ` (range ${suspectRange})` : ""}. ` +
            `Report concrete evidence with file:line or commit refs and whether it confirms, partially supports, contradicts, or is inconclusive.`,
          {
            label: `investigate:${h.id}`,
            phase: "Investigate",
            schema: EVIDENCE_SCHEMA,
            agentType: "general-purpose",
          },
        ),
    ),
  )
).filter(Boolean);

const byId = Object.fromEntries(hypotheses.map((h) => [h.id, h]));
const evById = Object.fromEntries(evidence.map((e) => [e.id, e]));
// Carry forward only hypotheses with supporting evidence
const live = evidence.filter((e) => e.supports === "confirms" || e.supports === "partial");
log(`${live.length} hypotheses have supporting evidence; refuting`);

// 3. Refute: 2 adversaries per surviving hypothesis --------------------
phase("Refute");
const refuted = await parallel(
  live.map((e) => () => {
    const h = byId[e.id];
    return parallel(
      [0, 1].map(
        (n) => () =>
          agent(
            `Adversary #${n + 1}. Try to DISPROVE that hypothesis ${h.id} is the root cause of: ${symptom}.\n` +
              `Hypothesis: "${h.claim}". Evidence gathered for it: ${e.evidence}.\n` +
              `Look for contradicting facts in the code/logs/commits (repo \`${repoRoot}\`). Set survives=false if you can refute it; survives=true only if it genuinely holds up.`,
            {
              label: `refute:${h.id}`,
              phase: "Refute",
              schema: REFUTE_SCHEMA,
              agentType: "general-purpose",
            },
          ),
      ),
    ).then((votes) => {
      const v = votes.filter(Boolean);
      const survives = v.length > 0 && v.every((x) => x.survives);
      return {
        id: h.id,
        survives,
        confidence: e.confidence,
        counters: v.filter((x) => !x.survives).map((x) => x.counter),
      };
    });
  }),
);

const survivors = refuted
  .filter((r) => r.survives)
  .map((r) => ({ ...byId[r.id], confidence: r.confidence, evidence: evById[r.id].evidence }))
  .sort((a, b) => b.confidence - a.confidence);
log(`${survivors.length} hypotheses survived adversarial refutation`);

// 4. Diagnose ----------------------------------------------------------
phase("Diagnose");
const rca = await agent(
  `Write an incident RCA in Markdown.\n\nSymptom:\n${evidenceBlock}\n\n` +
    `Surviving root-cause hypotheses (ranked by confidence, each backed by evidence and unrefuted):\n${JSON.stringify(survivors, null, 2)}\n\n` +
    `Refuted hypotheses (for completeness):\n${JSON.stringify(
      refuted.filter((r) => !r.survives),
      null,
      2,
    )}\n\n` +
    `Structure: "🎯 Most likely root cause" (the top survivor, with the evidence chain), "🧪 How to confirm" (a decisive test/check), ` +
    `"🩹 Minimal fix" (smallest change that addresses the cause, not the symptom), "🛡 Prevention" (guard/test to stop recurrence), and "Ruled out" (briefly). Output only markdown.`,
  { phase: "Diagnose" },
);

return { rca, hypothesisCount: hypotheses.length, survivorCount: survivors.length, survivors }
