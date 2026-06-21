---
name: dependency-audit
description: Audit every dependency in parallel — CVEs, breaking changes, maintenance health, and dead/unused packages — then rank by risk and produce an upgrade/remediation plan. Use this WHENEVER the user asks to audit dependencies, check for vulnerable/outdated packages, find unused deps, plan upgrades, or review package.json / requirements.txt / Cargo.toml / go.mod — even without the word "workflow". Prefer this over eyeballing a manifest whenever there are more than a handful of dependencies.
---

# Dependency Audit

Run this as a **dynamic workflow** (say "ultracode" / "run a workflow"). One agent per package, each doing live research, so a 60-dependency manifest gets audited in parallel instead of serially.

## When to reach for it
Whole-manifest audits: security, staleness, abandonment, and dead dependencies. For "is this one package safe?", answer inline.

## Inputs to resolve first
- **manifest** (default `package.json`) and **ecosystem** (`npm` / `pip` / `cargo` / `go` / `maven`).
- **includeTransitive** (default off): widen to notable lockfile deps if asked.

## Shape (fan out → score → plan)
1. **Inventory** — parse the manifest into name + version + kind.
2. **Investigate** — one agent per dependency. Each: (a) web-search the latest stable version and any CVEs/advisories affecting the pinned version, (b) judge maintenance health from release cadence/activity, (c) check if upgrading to latest crosses a breaking boundary, (d) grep the repo to confirm it's actually imported (dead-dep check). Never invent CVE ids.
3. **Rank** — score by advisories (heaviest), maintenance risk, unused, breaking. Plain scoring, no agent needed.
4. **Plan** — Markdown plan: 🚨 Security (patch now, exact safe version), 🧹 Remove (unused), ⬆️ Upgrades (safe vs needs-migration), 💀 Maintenance risk (with replacement suggestions). Include the exact install/remove commands.

## Guardrails
- Verifiable facts only — real advisory ids, real versions.
- Distinguish "outdated" from "vulnerable"; not every upgrade is urgent.
- Flag unused deps prominently — they're the cheapest, highest-value cleanup.

## When you want it identical every time
Use `.claude/workflows/dependency-audit.js` (`Run the dependency-audit workflow with args {"manifest":"package.json","ecosystem":"npm"}`).
