# E64 — First Session: Guided Onboarding

## Dependency chain

- Depends on: E45 complete (HARD — the loop being taught must work end-to-end), E46 (soft —
  quest UI surfaces the steps; a chat-line fallback works), E63-S02/S03 not required
- Unlocks: retention at minute zero; every playtest stops burning its first ten minutes on
  "what do I do?"

## Spec references

- `apps/server/src/quests/quest-engine.ts` + `processQuestTriggers` running every tick
  (`simulation-kernel.ts:546`) — varbit-triggered quest steps are live machinery
- `apps/server/src/dialogue/` — dialogue engine for the guide NPC
- `docs/world/starter-town.md` — the design authority defining first-session goals; the
  onboarding quest is its executable form
- `docs/world/npc-cast.md` — pick (or add, following the doc's format) the guide character
- E46's quest UI work — read its stories to know what step-display surface exists before
  choosing the client affordance

## Epic goal

A fresh character is greeted, guided, and completing the core loop within minutes: a guide
NPC with dialogue, a starter quest whose steps teach move → chop → smelt/craft → bank → (one
combat encounter per starter-town doc goals), varbit-tracked with visible progress, a small
completion reward, and client-side nudges (target highlighting + hint line) that fade out
forever once the quest completes. Everything content-driven through the existing quest and
dialogue engines — engine changes only where a trigger kind or nudge channel is genuinely
missing.

## Scope guardrails

- This is ONE quest + ONE NPC + minimal nudge plumbing — not a tutorial framework, not a
  help system, not UI onboarding tooltips for every panel.
- Skippable by design: talking to the guide and declining ends the guidance cleanly (quest
  abandoned/complete-marked, nudges off). Veterans on fresh characters must not be hostage.
- No client-authoritative progress: nudges render from quest varbit state in packets.

## Completion checklist

- [ ] Complete the stories below in exact order.
- [ ] Run all validation commands listed by completed stories.
- [ ] Move completed story files into `tasks/completed/stories/E64/`.
- [ ] Move this epic file into `tasks/completed/epics/` after all stories are complete.

## Ordered stories

- [ ] `E64-S01` — [Onboarding quest content and trigger coverage audit](../stories/E64/E64-S01_onboarding-quest-content-and-trigger-audit.md)
- [ ] `E64-S02` — [The guide NPC and greeting flow](../stories/E64/E64-S02_guide-npc-and-greeting-flow.md)
- [ ] `E64-S03` — [Client nudges: hint line and target highlight](../stories/E64/E64-S03_client-nudges-hint-line-and-target-highlight.md)
- [ ] `E64-S04` — [First-session acceptance run and polish](../stories/E64/E64-S04_first-session-acceptance-run-and-polish.md)

## Epic acceptance criteria

- [ ] A brand-new character completes the guided loop in ≤ 10 minutes without external help
      (validated by a real first-time playtester, not the author).
- [ ] Declining the guide ends all guidance permanently for that character (persists across
      relog).
- [ ] Every quest step advances off real varbit triggers — zero client-side step logic.
- [ ] The quest is pure content + ≤ 2 small engine additions (each documented as generally
      reusable: e.g. a missing trigger kind, the highlight packet).
