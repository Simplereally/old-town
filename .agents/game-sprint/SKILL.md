# Game Sprint Skill

Turn a single AI agent session into a full autonomous game development studio for building an OSRS-like MMO. This skill is a **dynamic workflow** that orchestrates multiple specialist agents through a deterministic sprint workflow with autonomous quality gates. Use `ultracode` to trigger it.

## When to use

- You are building a game (especially an old-school MMO-inspired project)
- You need to run a structured sprint with discovery, design, verification, implementation, and shipping phases
- You want an autonomous quality gate (Game Owner agent) to enforce taste and faithfulness without human bottlenecks
- You have a `POC_SPEC.md` and a `tasks/` tree that defines your work

## How to invoke

The orchestrator loads this skill and **immediately** executes the full 6-phase sprint without asking for permission. The Game Owner agent handles all quality decisions. The human is informed, not consulted.

## Autonomy Rules

The orchestrator **never** asks the user for:
- Permission to start a sprint
- Clarification about what to build
- Approval of designs
- Sign-off on implementations
- Confirmation to merge or ship

**The Game Owner agent is the sole quality gate.** All taste decisions, design approvals, and rejections are handled by the autonomous Game Owner persona. The human user receives reports and can intervene if they choose, but the default is full autonomy.

**The orchestrator makes all routing decisions:**
- Which epic to work on
- Which stories to implement
- Which agents to dispatch
- When to loop back for revisions
- When to ship

## Architecture

The skill follows a **persona + task** pattern. Each agent role has a dedicated `.md` persona file that defines its static behavior and philosophy. When the orchestrator invokes an agent, it:

1. **Loads the persona file** (e.g., `game-owner.md`) — this defines *how* the agent thinks
2. **Appends the specific task** — this defines *what* the agent does on this invocation

This separation means:
- Persona files are reusable across all sprints
- Task details are specific to the current story
- The orchestrator composes them deterministically

## Delegation Hierarchy

This skill operates a **three-tier delegation model**:

```
Main Agent (Orchestrator)
  ↓ dispatches
Orchestration Agents (domain coordinators)
  ↓ spawn
Subagents (task executors)
```

**Tier 1 — Main Agent:** The orchestrator holds the global context. It does not execute work. It reads the sprint workflow, decides which orchestration agents to dispatch, and synthesizes their outputs. It never asks the user for clarification.

**Tier 2 — Orchestration Agents:** These are specialist coordinators that each manage a domain. They receive a domain context from the main agent, then spawn and manage their own subagents. They handle dependency mapping, parallelization, and aggregation within their domain.

**Tier 3 — Subagents:** These are the leaf workers. They execute the actual tasks: reading files, writing code, validating content, auditing designs. They are stateless and receive their full context from the orchestration agent that spawned them.

### Domain Mapping

| Domain | Orchestration Agent | Subagents It Spawns |
|--------|---------------------|---------------------|
| Discovery | `discovery-orchestrator` | `codebase-explorer`, `architecture-analyst`, `content-auditor` |
| Design | `design-orchestrator` | `designer` (one per story) |
| Quality Gate | `game-owner` | `game-owner` (self, or multiple for perspective-diverse review) |
| Implementation | `implementation-orchestrator` | `implementer` (one per story), `fix-agent` (on failure) |
| Verification | `verification-orchestrator` | `qa-verifier`, `integration-verifier`, `game-owner` (final pass) |

The orchestration agents are responsible for:
- **Dependency mapping** — Identifying which subagents can run in parallel and which must wait
- **Context routing** — Passing the right context to each subagent so they don't need to rediscover it
- **Aggregation** — Collecting subagent outputs, deduplicating, and synthesizing into a single report
- **Loop control** — Deciding when to retry, when to escalate, and when to move forward

## Agent Roles

### Tier 2 — Orchestration Agents

| Role | File | Purpose | When Invoked |
|------|------|---------|--------------|
| **Planning Coordinator** | `planning-coordinator.md` | High-level scoping, strategy, and dependency mapping. | Before Phase 1 |
| **Dependency Mapper** | `dependency-mapper.md` | Maps dependencies between tasks, stories, and systems. | Before Phase 1 |
| **Task Delegator** | `task-delegator.md` | Routes tasks to the right orchestration agents with full context. | Between all phases |
| **Synthesis Coordinator** | `synthesis-coordinator.md` | Collects, deduplicates, and synthesizes subagent outputs. | After all parallel phases |
| **Cleanup Orchestrator** | `cleanup-orchestrator.md` | Destroys isolated contexts and verifies no orphans remain. | Phase 6 |
| **Next Epic Ideator** | `next-epic-ideator.md` | Writes the next epic when all predefined epics are exhausted. | Phase 0 (ideation) |

### Tier 3 — Domain Agents

| Role | File | Purpose | When Invoked |
|------|------|---------|--------------|
| **Game Owner** | `game-owner.md` | Taste & faithfulness gate. Veto power over designs. | After every design phase, after implementation |
| **Architecture Analyst** | `architecture-analyst.md` | Audits ECS, renderer, protocol, and identifies gaps. | Phase 1 (Discovery) |
| **Codebase Explorer** | `codebase-explorer.md` | Maps repo structure, reads `POC_SPEC.md`, identifies epics. | Phase 1 (Discovery) |
| **Content Auditor** | `content-auditor.md` | Validates JSON schemas, checks economy balance, finds broken refs. | Phase 1 (Discovery) |
| **Designer** | `designer.md` | Creates detailed design docs: data model, protocol, UI, server logic. | Phase 2 (Design) |
| **Implementer** | `implementer.md` | Writes code, respects invariants, runs tests. | Phase 4 (Implement) |
| **QA Verifier** | `qa-verifier.md` | Verifies implementations match approved designs. | Phase 5 (Verify) |
| **Integration Verifier** | `integration-verifier.md` | Verifies all stories work together end-to-end. | Phase 5 (Verify) |
| **Story Decomposer** | `story-decomposer.md` | Breaks empty epics into implementable stories. | Phase 0 (Empty Epic) |

## The Sprint Workflow

The full workflow is defined in `sprint-workflow.md`. It runs in 7 phases:

0. **State Detection & Ideation** — Detect repo state, identify active epic, or ideate next epic if all predefined epics are exhausted
1. **Discover** — Parallel agents map the codebase, audit architecture, and validate content
2. **Design** — Parallel designers create story designs referencing `POC_SPEC.md`
3. **Game Owner Gate** — The Game Owner agent approves/rejects/revises each design
4. **Implement** — Approved designs are implemented in parallel with isolated contexts
5. **Verify** — QA, integration, and Game Owner final pass
6. **Ship** — Merge, test, update task tracking, cleanup, report

## Agent Invocation Protocol

When the orchestrator needs an agent, it loads the persona file and appends the specific task. The orchestrator dispatches the agent using the host framework's subagent mechanism.

The pattern is:

1. Read the persona file (static behavior)
2. Append the specific task (dynamic mission)
3. Dispatch the combined prompt to the agent

This ensures:
- Every agent invocation is self-contained
- No state is assumed between invocations
- The persona defines *how* to think; the task defines *what* to do

## Files

- `SKILL.md` — This file. The orchestrator entry point.
- `sprint-workflow.md` — The full 7-phase sprint orchestration (including state detection & ideation).
- `game-owner.md` — The autonomous quality gate persona.
- `architecture-analyst.md` — System architecture audit persona.
- `codebase-explorer.md` — Repo discovery and mapping persona.
- `content-auditor.md` — Content JSON validation persona.
- `designer.md` — Feature design document persona.
- `implementer.md` — Code implementation persona.
- `qa-verifier.md` — Implementation quality check persona.
- `integration-verifier.md` — End-to-end integration check persona.
- `next-epic-ideator.md` — The autonomous epic writer when predefined epics are exhausted.

## Invariants

This skill enforces the following invariants:
- **The orchestrator is autonomous.** No human permission required to start, execute, or ship.
- **State detection runs first.** The main agent always detects the repo state before dispatching work.
- **Ideation is autonomous.** When predefined epics are exhausted, the `next-epic-ideator` writes new epics without human approval.
- **The Game Owner is the only approval gate.** No human approval required during the sprint.
- **Designs must be approved before implementation.** The workflow loops until approval.
- **Isolated contexts for parallel implementation.** Agents work in isolated contexts to avoid conflicts.
- **Cleanup is mandatory after shipping.** All isolated contexts are destroyed when the sprint completes. No dangling work remains.
- **Tests must pass before shipping.** `bun run test` and `bun run content:validate` are mandatory.
- **POC_SPEC.md is the single source of truth.** All designs reference section numbers.

## Orchestrator Mandate

When this skill is loaded, the orchestrator must:

1. **Detect State (Filesystem-First)** — Scan the filesystem to determine the repo state. The manifest is secondary; the filesystem is the ground truth.
2. **Handle Drift** — If files exist in both active and completed directories, log the drift, treat the active copy as authoritative, and proceed. Do not halt on drift.
3. **Route to Next Action** — Based on state:
   - **Active epic exists** → Proceed to the sprint workflow
   - **No active epic, empty epics exist** → Dispatch `story-decomposer` to write stories
   - **No active epic, uncompleted future epics exist** → Activate the next epic (write stories, add to manifest)
   - **No active epic, all predefined epics exhausted** → Dispatch `next-epic-ideator` to write the next epic
   - **Mixed state** — Some stories complete, some not → Continue with remaining stories
4. **Immediately execute** — Do not ask the user if they want to start. Do not ask what to build.
5. **Self-direct** — Make all decisions about routing, parallelization, and iteration.
6. **Report, don't ask** — Inform the user of progress, rejections, and completions. Never ask for input.
7. **Loop autonomously** — If a design is rejected, loop back to Phase 2 without human intervention. If verification fails, loop back to Phase 4 without human intervention.
8. **Ship when ready** — When all stories are approved, verified, and tested, merge and ship without asking.

## State Detection Protocol

The orchestrator must run state detection before the sprint. **The filesystem is the ground truth; the manifest is a secondary index.**

```
1. Scan the filesystem:
   a. List all epic files in `tasks/epics/` (active epics)
   b. List all epic files in `tasks/completed/epics/` (completed epics)
   c. For each active epic, list all story files in `tasks/stories/E##/`
   d. For each epic, list all story files in `tasks/completed/stories/E##/`
   e. Read each epic file's checklist to count unchecked items
   f. Read each active story file's checklist to count unchecked items

2. Build a ground-truth registry per epic:
   - activeEpicFile: exists in `tasks/epics/`
   - completedEpicFile: exists in `tasks/completed/epics/`
   - activeStories: files in `tasks/stories/E##/`
   - completedStories: files in `tasks/completed/stories/E##/`
   - uncheckedEpicItems: count of unchecked checklist items in the epic file
   - uncheckedStoryItems: count of unchecked items across active stories

3. Detect drift (files in both active and completed directories):
   - If an epic file exists in BOTH `tasks/epics/` AND `tasks/completed/epics/`: Drift
   - If a story file exists in BOTH `tasks/stories/E##/` AND `tasks/completed/stories/E##/`: Drift
   - If drift detected: Report it, but DO NOT HALT. Treat the file as active and move the duplicate from completed/ to avoid blocking the sprint.

4. Read `tasks/TASK_MANIFEST.json` (if it exists)
   - If missing or malformed: Log a warning, use filesystem-only mode
   - Cross-check manifest entries against the filesystem registry
   - Flag discrepancies but do not let them block the sprint

5. Classify each epic:
   - **Active Epic**: Has active epic file, has active stories with unchecked items
   - **Completed Epic**: Has completed epic file, no active stories, all checkboxes checked
   - **Future Epic**: Has active epic file, but no active stories (or all stories are empty/unchecked)
   - **Empty Epic**: Has active epic file, but `tasks/stories/E##/` directory is missing or empty

6. Determine the next action:
   a. Find the lowest-numbered epic with active stories and unchecked items → This is the active epic
   b. If active epic found: Proceed with sprint on its incomplete stories
   c. If no active epic: Check for empty epics → Dispatch `story-decomposer` to write stories
   d. If no empty epics: Check for future epics (epic exists but no active stories) → Activate it (write stories)
   e. If no future epics: Dispatch `next-epic-ideator` to write the next epic
```

## Mixed State Handling

The orchestrator handles these states:

- **State A: Active Epic with Incomplete Stories** (most common)
  - Example: E25 has 4 incomplete stories with unchecked checkboxes
  - Action: Run sprint on those 4 stories

- **State B: Active Epic with Mixed Completion** (some stories done, some not)
  - Example: E25 has 1 complete story (moved to completed/), 4 incomplete
  - Action: Continue with remaining 4 stories

- **State C: Epic Complete, Next Epic Exists** (sequential transition)
  - Example: E25 complete, E26 exists in `epics/` with active stories
  - Action: Activate E26 (run sprint on its stories)

- **State D: Epic Complete, No Future Epics** (ideation required)
  - Example: E35 complete, no active epics with stories
  - Action: Dispatch `next-epic-ideator` to write E36

- **State E: Empty Epic** (epic file exists but no stories)
  - Example: E36 has an epic file but no story files
  - Action: Dispatch `story-decomposer` to break the epic into stories

- **State F: Drift Detected** (files in both active and completed directories)
  - Example: E27 stories exist in both `stories/E27/` and `completed/stories/E27/`
  - Action: Log the drift, treat the stories as active, and proceed with the sprint. The duplicate completed files should be removed during cleanup.
```

## Mixed State Handling

The orchestrator handles these states:

- **State A: Active Epic with Incomplete Stories** (most common)
  - Example: E25 has 4 incomplete stories in `tasks/stories/E25/` with unchecked checkboxes
  - Action: Run sprint on those 4 stories

- **State B: Active Epic with Mixed Completion** (some stories done, some not)
  - Example: E25 has 1 complete story (moved to `completed/`), 4 incomplete
  - Action: Continue with remaining 4 stories

- **State C: Epic Complete, Next Epic Exists** (sequential transition)
  - Example: E25 complete, E26 exists in `epics/` with active stories
  - Action: Activate E26 (run sprint on its stories)

- **State D: Epic Complete, No Future Epics** (ideation required)
  - Example: E35 complete, no active epics with stories
  - Action: Dispatch `next-epic-ideator` to write E36

- **State E: Empty Epic** (epic file exists but no stories)
  - Example: E36 has an epic file but no story files
  - Action: Dispatch `story-decomposer` to break the epic into stories

- **State F: Drift Detected** (files in both active and completed directories)
  - Example: E27 stories exist in both `stories/E27/` and `completed/stories/E27/`
  - Action: Log the drift, treat active stories as authoritative, proceed with sprint

## Continuous Sprint Mode

The orchestrator can run in continuous mode:

```
while (epics exist || backlog exhausted) {
  1. Detect state
  2. If active epic: Run sprint on incomplete stories
  3. If no active epic: Ideate next epic
  4. Report completion
  5. Loop back to state detection
}
```

This mode runs indefinitely, implementing predefined epics then ideating new ones. The human can stop it at any time.

## Customization

To adapt this skill for your game:
1. Edit `game-owner.md` — Tune the taste criteria, faithfulness checks, and veto rules.
2. Edit `designer.md` — Adjust the design document template to match your content types.
3. Edit `implementer.md` — Change the tech stack references (currently Bun/Three.js/WebSocket).
4. Edit `next-epic-ideator.md` — Tune the epic writing framework and output format.
5. Edit `sprint-workflow.md` — Modify phases, add/remove agents, or change the test commands.

## Example Usage

The orchestrator loads this skill and immediately executes the full sprint workflow. The Game Owner agent handles all quality gates. The human user receives reports only.

The orchestrator will discover the current epic, run all 6 phases autonomously, and ship completed work. The user can intervene at any time, but the default is full autonomy.
