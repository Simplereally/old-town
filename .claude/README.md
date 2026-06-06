# Ultracode Pack — Cracked Dynamic Workflows for Claude Code

A drop-in `.claude/` folder with **7 deterministic workflow scripts** and **7 plain-English skill variants** for the heaviest coding/dev work, plus a field guide to the feature and the best prompts for making Claude generate its own.

> Dynamic workflows shipped **May 28, 2026** alongside Claude Opus 4.8. They're a **research preview**, require **Claude Code v2.1.154+**, run up to **1,000 subagents per run / 16 concurrent**, and are **token-hungry** — start scoped.

---

## 0. 30-second mental model

A dynamic workflow is a JavaScript script Claude writes (or you save) that **orchestrates subagents deterministically**. You own the control flow; agents do the thinking. The shape that generalizes is **fan out → reduce → synthesize**, usually with a verify pass bolted on. Intermediate results live in *script variables*, not the chat context — that's what lets one run coordinate hundreds of agents without blowing the context window.

Key facts that shape every script in this pack:
- The **script itself can't touch the filesystem or shell** — only the agents read, write, and run commands.
- `Date.now()`, `Math.random()`, and argless `new Date()` **throw** (they'd break the journaled resume). Pass timestamps/inputs through `args`.
- `parallel()` is a **barrier**; `pipeline()` streams items through stages with **no barrier**. Default to pipeline; use a barrier only when a stage needs *all* prior results at once.
- Subagents run in **acceptEdits** mode. Use `isolation: "worktree"` when agents write files in parallel.
- Use a `schema` for any result a later stage consumes — validated structured output beats "please return JSON".

### Triggering (v2.1.160+)
- Put **`ultracode`** in a prompt (or just say "run a workflow" / "use a workflow") → Claude writes a one-off workflow for that task. *(Before v2.1.160 the keyword was `workflow`; natural language works in both.)*
- `/effort ultracode` → Claude decides per-task whether to fan out, for the whole session (needs Opus 4.8; Sonnet 4.6 can't do xhigh).
- Run a saved one by name, or the bundled **`/deep-research`**.
- Watch/stop/save runs in **`/workflows`**; press `s` on a good run to save its script.

---

## 1. What's in the box

```
.claude/
├── workflows/                     # deterministic — pinned, repeatable
│   ├── pr-review-adversarial.js   # per-file review + 3-skeptic refute → severity-ranked review
│   ├── bug-hunt.js                # loop-until-dry finders + multi-lens majority vote
│   ├── dependency-audit.js        # one agent per dep: CVEs, breaking, health, dead-dep → plan
│   ├── test-forge.js              # gap-triage → parallel test gen (worktrees) → judge panel
│   ├── migration-sweep.js         # pipeline per file: transform → verify → fix (worktrees)
│   ├── perf-audit.js              # hotspots → per-hotspot proposals → judge by impact/effort
│   └── incident-rca.js            # competing hypotheses → evidence → adversarial refute → RCA
└── skills/                        # plain-English — looser, lets the model plan the fan-out
    ├── adversarial-pr-review/SKILL.md
    ├── bug-hunt/SKILL.md
    ├── dependency-audit/SKILL.md
    ├── test-forge/SKILL.md
    ├── migration-sweep/SKILL.md
    ├── perf-audit/SKILL.md
    └── incident-rca/SKILL.md
```

**Workflows vs skills — which to use:**
- **Workflow (`.js`)** when you want the *same structure every run* — a weekly audit, a CI-able gate, a migration you'll re-run with different args. Deterministic orchestration, model judgment only inside each `agent()`.
- **Skill (`SKILL.md`)** when you want to describe the job in plain English and let Claude plan the fan-out (more non-determinism, less ceremony). The skill auto-triggers on the right phrasing and tells Claude to run it as a dynamic workflow with the right phases and guardrails.

### Install
Copy the `.claude/` folder into your repo root (merge with any existing `.claude/`). Then:
```
# run a pinned workflow
Run the pr-review-adversarial workflow with args {"base":"origin/main","head":"HEAD","focus":"security"}

# or just trigger the skill in plain english
ultracode: review this PR for security and concurrency issues
```
Because they live in the repo, they're version-controlled and anyone who clones can launch them.

---

## 2. The 7 workflows (and their args)

| Workflow | Pattern | Key args |
|:--|:--|:--|
| **pr-review-adversarial** | fan-per-file → 3-skeptic adversarial verify → synthesize | `base`, `head`, `paths`, `focus` |
| **bug-hunt** | loop-until-dry (diverse finders) → multi-lens majority vote | `root`, `include`, `maxRounds`, `focus` |
| **dependency-audit** | fan-per-dep (live CVE research) → risk score → plan | `manifest`, `ecosystem`, `includeTransitive` |
| **test-forge** | gap triage → parallel gen in worktrees → judge panel | `root`, `framework`, `runner`, `target` |
| **migration-sweep** | pipeline per file: transform → verify → fix (worktrees) | `rule`*, `root`, `include`, `verifyCmd` |
| **perf-audit** | hotspots → per-hotspot proposals → impact/effort judge | `root`, `profileCmd`, `focus` |
| **incident-rca** | competing hypotheses → evidence → adversarial refute | `symptom`*, `logs`, `stack`, `suspectRange`, `repoRoot` |

`*` = effectively required. All args are optional with sane defaults unless marked.

**Quality patterns these encode** (the real leverage — structure, not more agents):
- **Adversarial verify** — N skeptics try to *refute* each finding; keep only survivors (pr-review, bug-hunt, incident-rca).
- **Perspective-diverse verify** — each verifier gets a distinct lens (correctness / security / reachability) so diversity catches what redundancy can't.
- **Judge panel** — independent judges score candidates; rank and keep the best (test-forge, perf-audit).
- **Loop-until-dry** — keep discovering until K consecutive rounds find nothing new; **dedupe against everything *seen*, not just confirmed**, or rejects reappear forever (bug-hunt).
- **Implementer→verifier→verifier→fixer (IVVF)** per item — the canonical workflow loop (migration-sweep is a clean instance).

---

## 3. Research: the most ambitious workflows & resources in the wild

The feature is ~1 week old, so genuine new-style `.claude/workflows/*.js` scripts are still scarce in public repos — most "cracked" community work is either the official at-scale examples, the bundled workflow, or adjacent multi-agent orchestration frameworks worth raiding for patterns. Highest-signal finds, roughly ranked by ambition:

1. **The Bun Zig→Rust port (Jarred Sumner)** — the ceiling example. ~750k lines of Rust, ~6,755 commits, ~11 days, 99.8% of the test suite passing, hundreds of agents in parallel with two reviewers per file. Pipeline: map Rust lifetimes for every Zig struct field → port every `.rs` from its `.zig` counterpart → a build/test fix-loop → an overnight pass removing unnecessary copies, one PR each. The blueprint for "language port as a workflow."
2. **Bundled `/deep-research`** — the reference implementation of fan-out → reduce → adversarial-verify → synthesize: decompose into ~5 angles → parallel search → dedupe/fetch → per-claim survival vote → cited report. Read its phases in `/workflows`; it's the best teacher.
3. **OneRedOak/claude-code-workflows** (GitHub) — the famous battle-tested set: dual-loop automated code review, a proactive security-review system, and a Playwright-MCP design-review workflow. Pre-dynamic-workflows in form (slash commands + GitHub Actions) but the *patterns* port directly.
4. **shinpr/claude-code-workflows** (GitHub) — end-to-end dev workflow plugins (`dev-workflows`, `dev-skills`) with specialized agents for requirements → design → implementation → QA, plus `discover` (idea→PRD) and `linear-prism` (requirements→Linear tasks). Strong "plan→execute→verify" decomposition.
5. **pedrohcgs/claude-code-my-workflow** (GitHub) — a multi-agent template with quality gates, **adversarial QA**, and replication protocols (built for academic LaTeX/Beamer + R, but domain-agnostic). Good source for adversarial-verify and gate design.
6. **PabloNAX/ultracode-skill** (GitHub, via dev.to) — packages the dynamic-workflow *procedure* as a portable SKILL.md for hosts without the native feature (Codex). Useful read on the "workflow as an inspectable, repeatable skill" framing — exactly the skill-vs-script tradeoff this pack leans on.
7. **catlog22/Claude-Code-Workflow** (GitHub) — JSON-driven multi-agent "cadence team" framework with CLI orchestration across models. Ambitious cross-tool orchestration ideas.
8. **The codebase-wide hardening sweep** (Anthropic's own use case) — auth checks + input validation + unsafe-pattern detection across an entire codebase with independent verification on every finding. Klarna cited it for dead-code/cleanup discovery that static analysis missed.
9. **Profiler-guided optimization audit** (Anthropic use case) — search in parallel, then independently verify every proposed optimization so the report surfaces real wins, not micro-opts. (Encoded here as `perf-audit.js`.)
10. **The "85 agents, ~16 minutes, one prompt" runs** circulating on X/Reddit — not a repo but a useful calibration of what "giga-ambitious" looks like in practice: the model decides the agent count, scopes each one, and writes the scheduler itself.

> Honest caveat: items 3–7 mostly predate the native dynamic-workflows runtime and use the older slash-command/agent-team style. They're the best *pattern* sources available today; expect a wave of true `.claude/workflows/*.js` collections to land over the coming weeks. Re-search "claude code dynamic workflows examples github" periodically.

---

## 4. Giga-ambitious prompts to make Claude generate its own workflows

Paste these into Claude Code (with `ultracode` on or the word in the prompt). Each is written to force a wide fan-out + a verification pass.

**Whole-repo security hardening**
```
ultracode: Audit this entire repository for security issues — missing auth checks, injection,
unsafe deserialization, secrets in code, SSRF, and broken access control. Spawn one agent per
route/handler/module, then have independent adversarial agents try to refute each finding before
it's reported. Return only confirmed issues, grouped by severity, each with file:line and a fix.
```

**Dead-code & cleanup sweep**
```
ultracode: Find dead code and cleanup opportunities across the whole codebase that static analysis
misses — unreachable branches, unused exports/deps, duplicated logic, abandoned feature flags.
Fan out per package, verify each candidate is truly unused (grep usages + entrypoints) with a
second agent, and return a ranked, safe-to-delete list with reasons.
```

**Spec → implementation plan, stress-tested**
```
ultracode: Here's a feature spec. Draft 3 independent implementation plans from different angles,
have a judge panel score them on correctness, blast radius, and effort, then synthesize the
strongest plan grafting the best ideas from the runners-up. Stress-test the winner with adversarial
"how does this break in production?" agents before you hand it back.
```

**Language/framework port**
```
ultracode: Port everything under <dir> from <X> to <Y>. First map the contract for each file
(types/lifetimes/idioms). Then write each target file in parallel as a behavior-identical port of
its source, two reviewers per file. Run a build+test fix-loop until green. Flag anything needing
cross-file context for manual review. Don't drift — keep the plan in the script.
```

**Flaky-test triage**
```
ultracode: Hunt down every flaky test in the suite. Run the suite multiple times to find
non-deterministic failures, fan out one investigator per flaky test to find the root cause
(timing, shared state, ordering, network), refute each diagnosis adversarially, and return
confirmed causes with minimal fixes.
```

**Tips for writing your own generator prompts**
- Name the **fan-out unit** ("one agent per file / route / dependency / hypothesis").
- Demand a **verification pass** ("have independent agents refute each finding / judge each candidate").
- State the **stop condition** ("until two rounds find nothing new", "keep only majority-survivors").
- Specify the **output contract** ("ranked, file:line, confirmed only, Markdown").
- Scope it ("under `src/`, exclude generated/vendored") and **start small** to gauge token burn.

---

## 5. Cost & safety reality check

- A workflow can use **meaningfully more tokens** than the same task in conversation, and it counts toward plan usage. Check `/model` before a big run; consider routing cheap stages to a smaller model via the `model` option per `agent()`.
- The first time a workflow triggers, Claude Code shows the planned phases and asks you to confirm. Turn on **auto mode** so per-subagent permission prompts don't stall the parallelism.
- Workflows **can't take mid-run input** — only agent permission prompts pause a run. Plan the contract up front.
- Drop back to `/effort high` once the heavy task is done so routine work doesn't burn ultracode tokens.

---

*Built as a starting kit. Fork the scripts, swap the prompts and schemas, and the same skeletons become whatever audit/migration/review your repo needs. The point isn't these seven jobs — it's that reaching for a workflow becomes obvious when a task needs breadth, verification, or scale a single context can't hold.*
