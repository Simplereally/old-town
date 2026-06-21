---
name: migration-sweep
description: Run a codebase-wide migration as a no-barrier pipeline where each file independently streams through transform → verify → fix in its own worktree, so a many-file change never stalls on the slowest file. Use this WHENEVER the user wants a framework swap, API deprecation cleanup, a codemod, a language-idiom migration, or any "change X to Y across the whole codebase / all these files" task — even without the word "workflow". Prefer this over editing files sequentially whenever the change spans more than ~10 files.
---

# Migration Sweep

Run this as a **dynamic workflow** (say "ultracode" / "run a workflow"). Each file is migrated, verified, and fixed independently and in parallel — the canonical "500-file migration" pattern.

## When to reach for it
Mechanical-but-large migrations where each file changes on its own terms (framework swaps, deprecations, codemods). If the change is one tricky file, do it inline.

## Inputs to resolve first
- **rule** — the migration spec in plain English (REQUIRED).
- **root** (default `src`), optional **include** glob, and a **verifyCmd** (typecheck/build/test) to gate each file.

## Shape (plan → pipeline → review)
1. **Plan** — turn the rule into a precise CONTRACT (exact before→after rules so every file is changed identically) and enumerate only the files that actually match the old pattern.
2. **Migrate (pipeline, no barrier)** — stream each file through three stages, each agent in its **own worktree**:
   - **Transform**: edit only that file per the contract; if the change needs cross-file context or is ambiguous, make the safe local change and flag `needsManual`.
   - **Verify**: run `verifyCmd` scoped to the file; confirm it compiles and behavior is preserved.
   - **Fix**: if verify failed, loop a few times to make it pass; if it can't without cross-file changes, leave it and mark `manual`.
   Use a **pipeline, not parallel-then-parallel** — files have no cross-dependency, so a barrier between stages would just waste wall-clock time.
3. **Review** — now a barrier *is* legitimate: collect all results, report migrated-clean / fixed / needs-manual counts, and list manual-review files with reasons.

## Guardrails
- One file per transform agent; never let an agent edit outside its assigned file.
- Worktree isolation everywhere — parallel writes will collide otherwise.
- Behavior preservation is the bar, not just "it compiles".

## When you want it identical every time
Use `.claude/workflows/migration-sweep.js` (`Run the migration-sweep workflow with args {"rule":"Replace deprecated useFoo() with useBar()","root":"src","verifyCmd":"npm run typecheck"}`).
