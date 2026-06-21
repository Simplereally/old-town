---
name: quality-gate-council
description: Run a quality gate council before shipping. Use when the user says "ultracode", "quality gate", "gate council", "ship check", "pre-ship review", "before this ships", or explicitly requests /quality-gate-council or a pre-push/pre-merge validation council.
disable-model-invocation: true
---

# Quality Gate Council — Pre-Ship Validation Council

> **Default posture:** Maximum throughput. Disregard cost. Ship only when the council approves.
> This skill loads into the main conversation. The deterministic workflow lives in `.claude/workflows/quality-gate-council.js` and is invoked manually via the Workflow tool.

## How to Invoke

**Run the skill (loads instructions):**
```
/quality-gate-council
```

**Run the workflow (deterministic execution):**
```
/quality-gate-council-workflow
```
Or invoke the script directly via the Workflow tool:
```
Workflow({ scriptPath: ".claude/workflows/quality-gate-council.js" })
```

## Ad-Hoc Orchestration Guide

When the user asks for a quality gate council, follow this pattern. First define the gate, then run independent validation lanes.

### 1. Gate Definition

Define the gate:
- What must be true to ship
- Which failure types block
- What can be deferred

### 2. Command Discovery

Discover real validation commands from:
- Package scripts
- CI configs
- Project conventions
- Docs

Classify commands by lane, purpose, required/optional, and expected cost.

### 3. Validation Lanes

Run independent validation lanes in parallel:
- Types and build
- Tests
- Lint/format/static analysis
- Runtime smoke
- Security/config
- Changed-files review

Each lane must return:
- Exact commands
- Pass/fail
- Evidence
- Affected files
- Likely cause
- Blocking status
- Fix strategy

### 4. Failure Triage

Triage failures into minimal repair slices:
- Never weaken or skip checks unless replacing an objectively wrong check with a stronger correct one.
- Mark pre-existing and environmental failures separately with evidence.

### 5. Repair Loop

Repair low/medium-risk changed-code failures in a loop:
- Parallelize safe slices.
- Re-run affected lanes after each iteration.
- Do not plan to weaken or skip checks.

### 6. Council Verdict

Finish with a three-judge verdict:
- **correctness**: Does the code meet acceptance criteria?
- **reliability/security**: Is it safe to ship?
- **maintainer/DX**: Does it create long-term mess?

In strict mode, all three must approve.

Return:
- Ship/no-ship
- Blocking reasons
- Non-blocking risks
- Commands run
- Repairs made
- Required work before ship

## Safety Rules

- **Never** auto-invoke. This is manual-only (`/quality-gate-council`).
- **Never** weaken or skip checks to make them pass.
- **Always** separate pre-existing and environmental failures from changed-code failures.
- **Always** require evidence for every failure classification.
- **Always** use strict mode by default unless explicitly relaxed.

## Workflow Script

The deterministic workflow is at `.claude/workflows/quality-gate-council.js`. It is a resume-safe, multi-phase validation council workflow. Reference it from this skill when orchestrating.
