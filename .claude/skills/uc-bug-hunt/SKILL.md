---
name: bug-hunt
description: Sweep a codebase for real, reproducible bugs using diverse finder agents in a loop-until-dry, with every candidate confirmed by a multi-lens majority vote. Use this WHENEVER the user wants to "find bugs", do a bug hunt, audit a service/module for defects, hunt for a class of bug (races, null derefs, leaks, off-by-one), or shake out problems before a release — even without the word "workflow". Prefer this over reading files one-by-one whenever coverage across many files matters.
---

# Codebase Bug Hunt

Run this as a **dynamic workflow** (say "ultracode" / "run a workflow"). The point is broad coverage with low false positives: many finders sweep in parallel and skeptics confirm before anything is reported.

## When to reach for it
Service- or module-wide defect hunts where one agent would lose the thread halfway through. For a single suspected bug, debug inline instead.

## Inputs to resolve first
- **root** (default `src`) and an optional **include** glob.
- **focus** (optional): a bug class to bias toward — concurrency, auth, memory, input handling.
- Exclude tests, generated, and vendored code.

## Shape (loop-until-dry → multi-lens verify)
1. **Map** — bucket the code into ~8–16 hunt targets.
2. **Find (loop)** — each round, run diverse finder personas across every target in parallel: control-flow, state/async, boundaries, untrusted-input/leaks. Collect concrete bugs with repro conditions.
3. **Dedupe against everything SEEN** — not just confirmed bugs. This is the make-or-break detail: if you only dedupe against confirmed ones, rejected candidates resurface every round and the loop never converges.
4. **Verify** — for each *fresh* bug, ~3 skeptics on different lenses (reachable? / correctness / security-or-data-loss) majority-vote. Keep only survivors, attach a one-line fix sketch.
5. **Stop** when two consecutive rounds surface nothing new (or the token budget is ~85% spent), then write a severity-ordered report with a count-by-severity table.

## Guardrails
- Only concrete, reachable bugs with real repro steps — no "could be cleaner" notes.
- Read the actual code before confirming; a skeptic's default is "not a bug".
- Cap discovery rounds (default ~6) so an adversarial codebase can't run forever.

## When you want it identical every time
Use `.claude/workflows/bug-hunt.js` (`Run the bug-hunt workflow with args {"root":"src","focus":"concurrency","maxRounds":6}`).
