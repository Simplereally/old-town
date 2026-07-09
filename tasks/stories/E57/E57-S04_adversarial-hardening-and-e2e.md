# E57-S04 — Adversarial hardening and end-to-end suite

## Epic

E57 — Player-to-Player Trading

## Dependency chain

- Depends on: E57-S03
- Blocks: none (last story)

## Objective

Attack the implementation the way a gold-farmer would, fix what breaks, and pin the whole
feature with an e2e suite + a golden replay.

## Required work

- [ ] **Attack checklist** (each becomes a test asserting the exploit fails):
      duplicate `accept` intents in one tick from one client (spam cap is 8/tick —
      `simulation-kernel.ts:146` — so 8 accepts arrive: must be idempotent);
      `offer_add` for a uid in the BANK not inventory; `offer_add` qty > held;
      offering the same uid twice; request-flooding a victim (rate: max 1 open outbound
      request, new request replaces old, per-target cooldown ~10 ticks);
      trading with self via spoofed entityId; settlement when a stack merge would overflow
      any stack-size cap (check whether stack caps exist in the inventory module — test
      whatever the invariant is); disconnect precisely between confirm-accept intents of the
      two parties.
- [ ] **Concurrency-of-sessions test**: A trades B while C requests A — C's request queues or
      bounces with a clear reason, never corrupts A/B session.
- [ ] **Journal + golden**: extend the E56 multiplayer golden (if E56 landed) with a scripted
      trade, pinning settlement determinism forever; otherwise leave a marked TODO in the E56
      golden story and add a plain integration e2e here.
- [ ] **Ignore-list hook**: if E58 landed, requests from ignored players are silently dropped
      server-side; otherwise leave the single marked call-site TODO.
- [ ] Load sanity: 20 concurrent trade sessions in one tick settle within normal tick budget
      (assert via `stats().lastTickDurationMs` in the test).

## Acceptance criteria

- [ ] Every attack test passes (exploit impossible); the suite reads as documentation of the
      threat model.
- [ ] Trade feature is covered end-to-end: protocol → machine → engine → settlement → UI.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
