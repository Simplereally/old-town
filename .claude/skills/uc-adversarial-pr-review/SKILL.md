---
name: adversarial-pr-review
description: Review a pull request or diff by fanning out one reviewer per changed file and adversarially verifying every issue before reporting. Use this WHENEVER the user asks to review a PR, review a diff, "look over these changes", check a branch before merge, or do a code review of more than a couple of files — even if they don't say the word "workflow". Prefer this over a single-pass review whenever the diff spans several files or the cost of missing a bug is high.
---

# Adversarial PR Review

Run this as a **dynamic workflow** (say "ultracode" or "run a workflow" so it fans out instead of reviewing turn-by-turn). The goal is a high-signal review where every reported issue has survived independent skeptics, so the user isn't drowned in false positives.

## When to reach for it
A diff touching several files, a pre-merge gate, or any review where precision matters more than speed. For a one-file tweak, just review inline — don't spin up agents.

## Inputs to resolve first
- **base / head** git refs (default `origin/main`...`HEAD`). If the user names a PR number or branch, resolve it.
- **focus** (optional): security, concurrency, performance, API contracts, etc. Bias the lenses accordingly.
- Scope down: ignore lockfiles, generated code, vendored deps, snapshots.

## Shape (fan out → verify → synthesize)
1. **Scope** — get the changed source files (`git diff --name-only base...head`), drop noise.
2. **Review** — one agent per file, reading only that file's hunks. Each returns concrete, line-anchored issues with severity, rationale, and a fix. An empty list is a good answer; never invent issues to fill a quota.
3. **Verify (adversarial)** — for each candidate issue, spawn ~3 independent skeptics, each with a different lens (correctness / security / does-it-actually-break-at-runtime), prompted to **refute** it. Keep the issue only if a majority cannot.
4. **Synthesize** — write a review grouped 🔴 Blocking / 🟠 Should-fix / 🟡 Nits, with a one-line verdict and a 2–3 sentence summary. Don't hedge confirmed issues — they passed the gauntlet.

## Guardrails
- Review only what the diff changed; ignore pre-existing issues it didn't touch.
- Read the real code (`git diff base...head -- <file>`), don't review from filenames.
- Use validated structured output for issues and verdicts so the merge step is mechanical.

## When you want it identical every time
Use the pinned script `.claude/workflows/pr-review-adversarial.js` (`Run the pr-review-adversarial workflow with args {"base":"origin/main","head":"HEAD","focus":"security"}`). This skill is the looser, plain-English path; the script is the deterministic one.
