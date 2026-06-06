---
name: incident-rca
description: Root-cause a hard incident by generating competing hypotheses, gathering evidence for each in parallel, adversarially refuting them, and synthesizing the surviving root cause with a minimal fix and a verification plan. Use this WHENEVER the user is debugging a production incident, a flaky/intermittent failure, a regression, a mysterious stack trace, or asks "why is this happening / what's the root cause" — even without the word "workflow". Prefer this over a single linear debugging pass whenever the cause is non-obvious and the stakes are high.
---

# Incident Root-Cause Analysis

Run this as a **dynamic workflow** (say "ultracode" / "run a workflow"). Instead of betting on one explanation, it tests several competing hypotheses against evidence and lets adversaries kill the weak ones.

## When to reach for it
Non-obvious incidents, flaky failures, regressions where a single guess is risky. For an obvious typo'd error, just fix it inline.

## Inputs to resolve first
- **symptom** (REQUIRED) — what's failing and how it shows up.
- **logs / stack** — paste any error output or trace (the workflow can't read your clock or live logs, so pass evidence in).
- **suspectRange** — an optional git range / recent commit window to blame.
- **repoRoot** (default `.`).

## Shape (frame → investigate → refute → diagnose)
1. **Frame** — turn the symptom + evidence into 4–6 *distinct, falsifiable* hypotheses (recent change, dependency/version, config/env, data edge case, concurrency/timing, resource exhaustion). Each names its mechanism and where to look.
2. **Investigate** — one evidence-gatherer per hypothesis, in parallel: read the code, use git blame/log on the suspect area, report concrete file:line / commit evidence and whether it confirms / partially supports / contradicts.
3. **Refute (adversarial)** — for each hypothesis with support, 2 adversaries try to disprove it. Keep only those that survive.
4. **Diagnose** — rank survivors by confidence and write the RCA: 🎯 most likely root cause (with the evidence chain), 🧪 how to confirm decisively, 🩹 minimal fix (address the cause, not the symptom), 🛡 prevention, and a brief "ruled out".

## Guardrails
- Hypotheses must be genuinely different and falsifiable — not rephrasings.
- Ground every claim in real evidence (file:line, commit, log line); no speculation in the final RCA.
- Fix the cause minimally; don't paper over the symptom.

## When you want it identical every time
Use `.claude/workflows/incident-rca.js` (`Run the incident-rca workflow with args {"symptom":"...","stack":"...","suspectRange":"HEAD~20..HEAD"}`).
