---
name: repo-offensive
description: Run a repo-wide quality offensive for <SCOPE>. Use when the user says "ultracode", "repo offensive", "quality offensive", "codebase cleanup", or explicitly requests a full-coverage quality offensive, pre-release hardening, or inherited-codebase cleanup.
disable-model-invocation: true
---

# Repo Offensive — Repo-Wide Quality Offensive

> **Default posture:** Maximum throughput. Disregard cost. Exhaustiveness and correctness over efficiency.
> This skill loads into the main conversation. The deterministic workflow lives in `.claude/workflows/repo-offensive.js` and is invoked manually via the Workflow tool.

## How to Invoke

**Run the skill (loads instructions):**
```
/repo-offensive
```

**Run the workflow (deterministic execution):**
```
/repo-offensive-workflow
```
Or invoke the script directly via the Workflow tool:
```
Workflow({ scriptPath: ".claude/workflows/repo-offensive.js" })
```

## Ad-Hoc Orchestration Guide

When the user asks for a repo offensive, follow this pattern. Treat this as a deterministic workflow, not a normal chat.

### 1. Mission Framing

First frame the mission:
- Quality bar
- Non-goals
- Stop conditions
- Minimum severity
- Unsafe paths

### 2. Recon

Recon the repo:
- Stack and package manager
- Canonical install/dev/build/test/lint/typecheck/format commands
- Architecture map
- Generated files
- Likely hotspots

### 3. Discovery Waves

Run repeated discovery waves until dry. Each wave fans out independent specialist agents across:
- Type soundness
- Runtime crashes
- Async/concurrency
- Security/auth/input validation/secrets
- Tests/flakiness
- Performance
- UI/accessibility
- API/data contracts
- Dead code/duplication
- Dependency/config/CI drift
- Error handling/observability
- Architecture boundaries
- Docs/spec drift

Every finding must include:
- Files
- Evidence
- Why it matters
- Proof/repro
- Severity
- Fix strategy
- Risk

Dedupe aggressively. Send each surviving P0/P1/P2 through an evidence court.

### 4. Evidence Court

For every P0/P1/P2 finding, spawn 3 skeptics in parallel:
- **correctness skeptic**: Is the claim actually true?
- **reproduction/tooling skeptic**: Attack command assumptions, generated files, stale docs, false positives, missing context.
- **regression skeptic**: Attack the proposed fix. Would it break behavior, tests, public API, performance, or UX?

Accept only findings with 2/3 non-low-confidence real votes.

### 5. Battle Plan

Convert verified findings into conflict-aware implementation slices:
- Group by independent implementation slice, not by category.
- Defer anything speculative, high-risk without user intent, or not locally verifiable.
- Mark conflicts with `dependsOn` and `parallelSafe`.
- Prefer small, coherent patches with tests/checks.

### 6. Surgical Fixes

Implement only low/medium-risk slices unless explicitly told otherwise.
- Parallelize independent slices with worktree isolation.
- Run relevant checks.
- Repair introduced failures.

### 7. Validation Gauntlet

Finish with a validation gauntlet:
- Commands run
- Changed files
- Fixes made
- Remaining failures
- Residual risk ledger
- Next recommended workflow

## Safety Rules

- **Never** auto-invoke. This is manual-only (`/repo-offensive`).
- **Never** fix high-risk (P0 refactor) issues automatically. Always defer.
- **Always** use worktree isolation for parallel implementation slices.
- **Always** run real checks after edits. If checks fail, attempt repair; if repair fails, revert and mark as pre-existing.
- **Never** modify CI/CD configs, auth secrets, or infrastructure definitions during this offensive.
- **Always** respect `maxWaves: 4` — no infinite loops.

## Workflow Script

The deterministic workflow is at `.claude/workflows/repo-offensive.js`. It is a resume-safe, loop-until-dry multi-agent offensive. Reference it from this skill when orchestrating.
