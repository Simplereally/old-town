---
name: implementation-tournament
description: Implement a feature using an implementation tournament with competing designs, judge scoring, and champion synthesis. Use when the user says "ultracode", "implementation tournament", "tournament", "design competition", or explicitly requests /implementation-tournament or a feature-building workflow with multiple competing strategies.
disable-model-invocation: true
---

# Implementation Tournament — Feature-Building with Competing Designs

> **Default posture:** Maximum throughput. Disregard cost. The first obvious plan is probably not the best plan.
> This skill loads into the main conversation. The deterministic workflow lives in `.claude/workflows/implementation-tournament.js` and is invoked manually via the Workflow tool.

## How to Invoke

**Run the skill (loads instructions):**
```
/implementation-tournament
```

**Run the workflow (deterministic execution):**
```
/implementation-tournament-workflow
```
Or invoke the script directly via the Workflow tool:
```
Workflow({ scriptPath: ".claude/workflows/implementation-tournament.js" })
```

## Ad-Hoc Orchestration Guide

When the user asks for an implementation tournament, follow this pattern. Start by normalizing the brief, then force multiple independent designs to compete.

### 1. Brief

Normalize the brief:
- Acceptance criteria
- Constraints
- Non-goals
- Assumptions to verify

### 2. Grounding

Run parallel grounding readers over:
- Architecture seams and dependency direction
- Existing implementation patterns to copy
- Data model, API contracts, persistence, state/cache implications
- UI/UX/product flows, accessibility, loading/error/empty states
- Tests, fixtures, mocks, build commands, local validation
- Security, auth, permissions, privacy, input validation
- Performance, bundle/runtime cost, concurrency, scalability

### 3. Strategy Tournament

Generate competing strategies from deliberately different priors:
1. Minimal idiomatic change
2. Domain-first clean architecture
3. Fastest coherent vertical slice
4. Future-proof extensible design
5. Test-first correctness-maximizing design
6. Product/UX-polish-first design
7. Security/performance-conservative design
8. Radical simplification that removes more code than it adds

Be specific about architecture, files, steps, tests, strengths, weaknesses, and hidden risks.

### 4. Judge Panel

Score every strategy through judges for:
- Correctness and acceptance-criteria completeness
- Architectural fit and maintainability
- Implementation risk, blast radius, and reversibility
- Testability and regression protection
- Product/UX quality and edge states
- Performance, security, accessibility, and operational safety

Do not simply pick a winner. Find fatal flaws, salvageable ideas, and required changes.

### 5. Champion Synthesis

Synthesize a champion plan that:
- Steals the best ideas
- Rejects fatal flaws
- Produces dependency-ordered slices with files, instructions, test commands, risks, and parallel-safety.

### 6. Build

Implement slices in dependency order:
- Use worktree isolation for independent low/medium-risk slices.
- Follow existing repo conventions discovered in grounding.
- Make minimal coherent edits.
- Add/update tests where valuable.
- Run listed testCommands if practical.

### 7. Attack

Adversarially review the implementation against acceptance criteria and hidden risks:
- Attack for missing acceptance criteria, broken flows, edge cases, runtime defects.
- Attack for architecture damage, duplication, leaky abstractions, repo convention violations.
- Attack for test gaps, security, performance, accessibility, release risk.

### 8. Finish

Repair required issues, validate against acceptance criteria, and return:
- Changed files
- Commands run
- Acceptance criteria coverage
- Remaining risks
- Next best follow-up

## Safety Rules

- **Never** auto-invoke. This is manual-only (`/implementation-tournament`).
- **Always** generate at least 4 competing strategies before scoring.
- **Always** use worktree isolation for parallel implementation slices.
- **Always** run real checks after edits.
- **Never** implement high-risk slices without explicit user intent.

## Workflow Script

The deterministic workflow is at `.claude/workflows/implementation-tournament.js`. It is a resume-safe, multi-phase tournament workflow. Reference it from this skill when orchestrating.
