# Sprint Workflow

The full 6-phase orchestration for running a game development sprint. This file is the deterministic execution script. The orchestrator reads this, loads the appropriate persona files, appends task-specific details, and dispatches agents.

## Phase 0: State Detection & Ideation

**Goal:** Determine the current state of the repo and identify the next work to be done. The filesystem is the ground truth; the manifest is a secondary index.

**Orchestration:** The main orchestrator runs state detection first. This is the intelligence layer that decides what to build.

**State Detection Protocol (Filesystem-First):**

```
1. Scan the filesystem (ground truth):
   a. List all epic files in `tasks/epics/` (active epics)
   b. List all epic files in `tasks/completed/epics/` (completed epics)
   c. For each epic, list all story files in `tasks/stories/E##/` (active stories)
   d. For each epic, list all story files in `tasks/completed/stories/E##/` (completed stories)
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
   - If drift detected: Log it, but proceed with the active copy. The duplicate completed files should be removed during cleanup.

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
   b. If active epic found: Proceed to Phase 1 with its incomplete stories
   c. If no active epic: Check for empty epics → Dispatch `story-decomposer` to write stories
   d. If no empty epics: Check for future epics (epic exists but no active stories) → Activate it (write stories)
   e. If no future epics: Dispatch `next-epic-ideator` to write the next epic
```

**Tier 2 — Orchestration Agent (state-detector):**
- Loads `codebase-explorer.md` (for repo state)
- Reads `tasks/TASK_MANIFEST.json` and `tasks/README.md`
- Determines the current state

**Tier 3 — Subagents (spawned by state-detector):**
- **manifest-reader** — Reads `TASK_MANIFEST.json` and reports active/incomplete epics
- **epic-scanner** — Scans `epics/` and `completed/epics/` for gaps
- **story-scanner** — Scans `stories/` and `completed/stories/` for gaps

**Decision Logic:**

**State A: Active Epic with Incomplete Stories** (most common)
- Example: E25 has 4 incomplete stories with unchecked checkboxes
- Action: Proceed to Phase 1 with those stories

**State B: Active Epic with Mixed Completion** (some stories done, some not)
- Example: E25 has 1 complete story (moved to completed/), 4 incomplete
- Action: Continue with remaining 4 stories

**State C: Epic Complete, Next Epic Exists** (sequential transition)
- Example: E25 complete, E26 exists in `epics/` with active stories
- Action: Activate E26 (run sprint on its stories)

**State D: Epic Complete, No Future Epics** (ideation required)
- Example: E35 complete, no active epics with stories
- Action: Dispatch `next-epic-ideator` to write E36
  - The ideator reads `POC_SPEC.md`, current task manifest, and codebase state
  - It identifies the most critical missing system
  - It writes a new epic file and stories
  - The main agent adds the epic to the manifest
  - Then proceed to Phase 1

**State E: Empty Epic** (epic file exists but no stories)
- Example: E36 has an epic file but no story files
- Action: Dispatch `story-decomposer` to break the epic into stories
  - The decomposer reads the epic file and `POC_SPEC.md`
  - It writes story files for each slice
  - Then proceed to Phase 1

**State F: Drift Detected** (files in both active and completed directories)
- Example: E27 stories exist in both `stories/E27/` and `completed/stories/E27/`
- Action: Log the drift, treat the stories as active, and proceed with the sprint. The duplicate completed files should be removed during cleanup.

**Gate:** If no work can be identified (all epics done, no new epics to ideate), the workflow ends with a success report.

## Phase 1: Discover (Parallel)

**Goal:** Map the current state of the codebase, audit the architecture, and validate content for the active epic.

**Orchestration:** The main orchestrator dispatches **discovery-orchestrator** agents in parallel. Each orchestration agent handles one domain of discovery.

**Tier 2 — Orchestration Agents:**
1. **discovery-orchestrator (codebase)** — Loads `codebase-explorer.md`. This orchestration agent maps the repo structure, then spawns subagents to read specific files and report findings. It aggregates into a Sprint Context document.
2. **discovery-orchestrator (architecture)** — Loads `architecture-analyst.md`. This orchestration agent audits the server ECS, client renderer, shared protocol, and content registries. It may spawn subagents for each subsystem, then aggregates into an Architecture Audit Report.
3. **discovery-orchestrator (content)** — Loads `content-auditor.md`. This orchestration agent scans all JSON in `content/`. It may spawn subagents per content type (items, NPCs, quests, etc.), then aggregates into a Content Audit Report.

**Tier 3 — Subagents:** Each discovery-orchestrator spawns subagents for specific discovery tasks. For example, the content orchestrator may spawn one subagent per content type to parallelize validation.

**Synthesis:** The main orchestrator merges all three orchestration reports into a single Sprint Context document.

**Gate:** If the codebase-explorer cannot find the active epic or all stories are complete, the workflow loops back to Phase 0 for state detection.

## Phase 2: Design (Parallel per Story)

**Goal:** Create detailed design documents for every incomplete story in the current epic.

**Orchestration:** The main orchestrator dispatches a **design-orchestrator** per incomplete story. Each orchestration agent handles one story.

**Tier 2 — Orchestration Agent (design-orchestrator):**
- Loads `designer.md`
- Receives the full sprint context and the specific story assignment
- May spawn subagents for specific design subtasks (e.g., one subagent for data model, one for protocol, one for UI)
- Aggregates subagent outputs into a single coherent design document
- Ensures the design respects all invariants and references `POC_SPEC.md` sections

**Tier 3 — Subagents (spawned by design-orchestrator):**
- **Data model subagent** — Designs the data model and JSON schema additions
- **Protocol subagent** — Designs the server-client protocol changes
- **UI/UX subagent** — Designs the interface and interaction flow
- **Server logic subagent** — Designs the tick handlers and state transitions
- **Content subagent** — Designs the content definitions (items, NPCs, etc.)

**Orchestrator Task:**
```
You are the design-orchestrator for this story:

Story: [story file path]
Epic: [epic name]
Sprint Context: [synthesized context from Phase 1]
POC_SPEC References: [§ numbers from epic]

Your job:
1. Spawn subagents for each design subtask (data model, protocol, UI, server logic, content)
2. Ensure each subagent has the full sprint context and story requirements
3. Synthesize subagent outputs into a single coherent design document
4. Verify the design respects all invariants (600ms tick, integer tiles, server authority, bitmask collision)
5. Include economy impact analysis (if the feature introduces items, drops, shops, or trade values; otherwise state "No economy impact")
6. Be original content (no OSRS names, no copied quests)

Return a single design document. Be detailed enough for an implementer to build without asking questions.
```

**Output:** One design document per story.

**Note:** Design orchestrators run in parallel. Each handles one story independently.

## Phase 3: Game Owner Verification (Gate)

**Goal:** The Game Owner orchestration agent reviews every design document. Only approved designs proceed to implementation.

**Orchestration:** The main orchestrator dispatches a **game-owner** orchestration agent per design document.

**Tier 2 — Orchestration Agent (game-owner):**
- Loads `game-owner.md`
- Receives the design document and full sprint context
- May spawn subagents for perspective-diverse verification (e.g., one subagent for economy check, one for faithfulness check, one for depth check)
- Aggregates subagent verdicts into a final decision
- Renders a single verdict: **APPROVED**, **REJECTED**, or **NEEDS_REVISION**

**Tier 3 — Subagents (spawned by game-owner, optional):**
- **economy-subagent** — Audits the design's economy impact (only if the feature has an economy footprint)
- **faithfulness-subagent** — Checks OSRS faithfulness criteria
- **depth-subagent** — Evaluates mechanical depth and progression curves

**Orchestrator Task:**
```
You are the game-owner orchestration agent. Review this design:

[full design document]

POC_SPEC Invariants: [list from context]
Story: [name]
Epic: [name]

Your job:
1. Apply the verification criteria from your persona
2. Optionally spawn subagents for perspective-diverse checks (economy — only if the feature has an economy footprint; faithfulness; depth)
3. Synthesize all findings into a single verdict
4. Render exactly: APPROVED (with praise) / REJECTED (with specific feedback) / NEEDS_REVISION (with prioritized changes)
```

**Decision Logic:**
- If **APPROVED**: Move to Phase 4 for this story.
- If **REJECTED**: Return the design to Phase 2 with the Game Owner's feedback injected into the design-orchestrator's task.
- If **NEEDS_REVISION**: Return the design to Phase 2 with the prioritized changes.

**Loop:** This gate loops until the Game Owner approves the design. Maximum iterations: 3. If a design is rejected 3 times, escalate to the orchestrator with a note: "This story may be under-specified or overly ambitious. Consider breaking it down."

**Rule:** The Game Owner is the only gate. Do not ask the human user for approval.

## Phase 4: Implement (Parallel per Story)

**Goal:** Implement all approved designs in parallel using worktree isolation.

**Orchestration:** The main orchestrator dispatches an **implementation-orchestrator** per approved design. Each orchestration agent handles one story.

**Tier 2 — Orchestration Agent (implementation-orchestrator):**
- Loads `implementer.md`
- Receives the approved design and sprint context
- May spawn subagents for specific implementation subtasks (e.g., server logic, client UI, content JSON)
- Aggregates subagent outputs into a single implementation
- Runs all validation commands and reports results

**Tier 3 — Subagents (spawned by implementation-orchestrator):**
- **server-subagent** — Implements server-side logic (ECS, tick handlers, protocol)
- **client-subagent** — Implements client-side logic (Three.js, UI, input handling)
- **content-subagent** — Implements content JSON definitions
- **fix-subagent** — Spawned if validation fails to fix issues

**Orchestrator Task:**
```
You are the implementation-orchestrator for this story:

Design Document: [full approved design]
Sprint Context: [context]

Your job:
1. Spawn subagents for specific implementation tasks (server, client, content)
2. Ensure each subagent has the full design document and respects invariants
3. Run all validation commands:
   - `bun run test`
   - `bun run content:validate`
   - `bun run lint`
   - `bun run typecheck`
4. If validation fails, spawn a fix-subagent and retry (max 3 attempts)
5. Return a consolidated Implementation Report
```

**Worktree Isolation:** Each implementation-orchestrator works in its own isolated context. No file conflicts between parallel stories.

**Failure Handling:** If validation fails after 3 fix attempts, escalate to the main orchestrator with the full failure report.

**Maximum Fix Iterations:** 3. If still failing after 3, escalate to the orchestrator.

## Phase 5: Verify (Parallel)

**Goal:** Verify all implementations match designs, work together, and pass the Game Owner's final taste check.

**Orchestration:** The main orchestrator dispatches a **verification-orchestrator** that coordinates three parallel verification tracks.

**Tier 2 — Orchestration Agent (verification-orchestrator):**
- Receives all implementation reports and approved designs
- Spawns three sub-verification orchestrators in parallel:
  1. **qa-verification-orchestrator** — Loads `qa-verifier.md`, spawns subagents per story to verify design compliance
  2. **integration-verification-orchestrator** — Loads `integration-verifier.md`, spawns subagents to test cross-story interactions
  3. **game-owner-verification-orchestrator** — Loads `game-owner.md`, performs final taste check

**Tier 3 — Subagents (spawned by verification-orchestrator):**
- **qa-subagent** — Per-story verification (design compliance, invariant audit, test review)
- **integration-subagent** — Per-interaction-pair verification (cross-story data flow, protocol compatibility)
- **scenario-subagent** — End-to-end scenario testing (player journeys, edge cases)
- **game-owner-subagent** — Final taste and faithfulness review

**Orchestrator Task:**
```
You are the verification-orchestrator for this sprint.

Stories: [list of all implemented stories]
Approved Designs: [list of design documents]
Implementation Reports: [list of reports]

Your job:
1. Spawn qa-verification-orchestrator to verify each story independently
2. Spawn integration-verification-orchestrator to test all stories together
3. Spawn game-owner-verification-orchestrator for final taste check
4. Collect all verdicts
5. If any FAIL or REJECTED: Return to Phase 4 with specific issues
6. If all PASS: Proceed to Phase 6
```

**Decision Logic:**
- If QA or Integration reports FAIL: Return to Phase 4 with specific issues.
- If Game Owner REJECTS: Return to Phase 4 with feedback.
- If all pass: Proceed to Phase 6.

**Maximum Iterations:** 2. If verification fails twice, escalate to orchestrator.

## Phase 6: Ship

**Goal:** Merge all approved work, run final validation, update task tracking, clean up, and report.

**Steps:**
1. **Merge Work:** Combine all approved implementations into the main codebase.
2. **Final Validation:**
   ```bash
   bun run test
   bun run lint
   bun run typecheck
   bun run content:validate
   ```
3. **Update Task Tracking:**
   - Mark completed story checkboxes as `[X]`
   - Move completed story files to `tasks/completed/stories/[E##]/`
   - If epic is complete, move epic file to `tasks/completed/epics/`
   - Update `TASK_MANIFEST.json`
4. **Cleanup:**
   - Dispatch **cleanup-orchestrator** to destroy all isolated contexts
   - Verify no temporary files, state, or resources remain
   - The orchestrator verifies cleanup completion
5. **Report:**
   ```
   ## Sprint Complete
   
   ### Epic: [name]
   ### Stories Completed: [count]
   
   ### What Was Built
   [Summary per story]
   
   ### What Was Rejected
   [Any rejected designs and why]
   
   ### What Needs Follow-Up
   [Any deferred items or known issues]
   
   ### Validation Results
   - Tests: [pass/fail]
   - Lint: [pass/fail]
   - Typecheck: [pass/fail]
   - Content: [pass/fail]
   ```

## Orchestration Rules

1. **State Detection First:** Phase 0 always runs before the sprint. The main agent must detect the repo state before dispatching work.
2. **Ideation Is Autonomous:** When all predefined epics are exhausted, the `next-epic-ideator` writes new epics without human approval.
3. **Three-Tier Delegation:** The main orchestrator dispatches orchestration agents (Tier 2). Orchestration agents spawn subagents (Tier 3). The main orchestrator never dispatches subagents directly.
4. **Parallelize Ruthlessly:** Phases 1, 2, and 4 run orchestration agents in parallel. Each orchestration agent may spawn subagents in parallel. Only synchronize at gates (Phase 3, Phase 5).
5. **Context Routing:** The main orchestrator passes the full sprint context to orchestration agents. Orchestration agents pass the relevant subset to their subagents. Subagents never need to rediscover context.
6. **Dependency Mapping:** Orchestration agents are responsible for mapping dependencies within their domain. They decide which subagents can run in parallel and which must wait.
7. **Aggregation:** Orchestration agents collect, deduplicate, and synthesize subagent outputs into a single report before returning to the main orchestrator.
8. **Context Injection:** Every agent receives the full sprint context in its prompt. No state is assumed.
9. **Deterministic Gates:** The Game Owner is the only approval gate. The orchestrator parses the verdict mechanically.
10. **Escalation:** After 3 rejections or 2 verification failures, escalate to the orchestrator with a detailed report.
11. **No Human Blocking:** The workflow never pauses for human approval. The human can override the Game Owner's verdict if they choose, but the default is autonomous.
12. **Cleanup Is Mandatory:** After shipping, all isolated contexts must be destroyed. No dangling work contexts remain. The orchestrator verifies cleanup completion.
13. **Save the Workflow:** If the sprint succeeds, the orchestrator should save the workflow as `/sprint` for future use.

## Example Invocation

```
ultracode: run a sprint
```

The main orchestrator:
1. **Phase 0** — Detects state by scanning the filesystem (ground truth)
   - Scans `tasks/epics/` and `tasks/stories/` to find active work
   - Checks for drift (files in both active and completed directories)
   - Reads `TASK_MANIFEST.json` as secondary index (if available)
   - If active epic exists: Proceeds to Phase 1
   - If no active epic but empty epics exist: Dispatches `story-decomposer`
   - If no active epic but future epics exist: Activates the next epic
   - If no future epics: Dispatches `next-epic-ideator` to write the next epic
2. **Phase 1** — Dispatches **discovery-orchestration agents** (codebase, architecture, content), each spawning their own subagents
3. **Phase 2** — Dispatches **design-orchestration agents** (one per story), each spawning subagents for data model, protocol, UI, server logic
4. **Phase 3** — Dispatches **game-owner orchestration agents** (one per design), each spawning subagents for perspective-diverse verification
5. **Phase 4** — Dispatches **implementation-orchestration agents** (one per approved story), each spawning subagents for server, client, content
6. **Phase 5** — Dispatches **verification-orchestrator** with QA, integration, and game-owner final pass
7. **Phase 6** — Ships the work, updates task tracking, dispatches **cleanup-orchestrator**

## Continuous Sprint Mode

```
ultracode: run continuous sprints
```

The main orchestrator runs in a loop:

```
while (true) {
  1. Phase 0: Detect state
  2. If active epic: Run sprint (Phases 1-6)
  3. If no active epic: Ideate next epic (Phase 0 ideation)
  4. Report completion
  5. Loop back to Phase 0
}
```

This mode runs indefinitely, implementing predefined epics then ideating new ones. The human can stop it at any time.

## Mixed State Examples

**Example 1: Active Epic with Remaining Stories**
```
State: E25 has 4 incomplete stories in `tasks/stories/E25/` with unchecked checkboxes
Action: Phase 0 scans filesystem, detects E25 as active. Phase 1-6 run sprint on those 4 stories.
```

**Example 2: Epic Complete, Next Epic Waiting**
```
State: E25 complete (all stories moved to `completed/`), E26 exists in `epics/` with active stories
Action: Phase 0 scans filesystem, detects E26 as active. Phase 1-6 run sprint on E26 stories.
```

**Example 3: All Predefined Epics Exhausted**
```
State: E35 complete, no active epics with stories in `epics/` or `stories/`
Action: Phase 0 scans filesystem, finds no active work. Dispatches `next-epic-ideator`. It writes E36 based on `POC_SPEC.md` and current state. Phase 1-6 run sprint on E36.
```

**Example 4: Drift Detected**
```
State: E27 stories exist in both `tasks/stories/E27/` AND `tasks/completed/stories/E27/`
Action: Phase 0 scans filesystem, detects drift. Logs the issue, treats active stories as authoritative. Proceeds to Phase 1 with E27 stories. Cleanup will remove duplicates.
```

The main orchestrator handles scoping, routing, state detection, and dependency mapping across all phases. Orchestration agents handle domain-specific coordination and subagent management. Subagents execute the leaf tasks.

The workflow is deterministic in structure, with the subjective quality judgment confined to the Game Owner agent.
