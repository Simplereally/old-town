---
name: perf-audit
description: Profiler-guided optimization audit — find real hotspots, fan out an analyst per hotspot to propose concrete optimizations, then a judge panel ranks by impact ÷ effort and refutes anything that would regress correctness. Use this WHENEVER the user wants to make code faster, profile/optimize a service, hunt performance bottlenecks, reduce latency/memory/bundle size, or "find what's slow" — even without the word "workflow". Prefer this over guessing at optimizations whenever the surface is larger than a single function.
---

# Performance Audit

Run this as a **dynamic workflow** (say "ultracode" / "run a workflow"). Optimizations are proposed in parallel and then *judged*, so the output is a ranked, safety-checked plan rather than a list of micro-optimizations.

## When to reach for it
Service/codebase perf audits. For "why is this one loop slow?", reason inline.

## Inputs to resolve first
- **root** (default `src`) and a **focus**: CPU, memory, startup time, p99 latency, bundle size.
- **profileCmd** (optional but ideal): a benchmark/profiler command to gather *real* data instead of guessing.

## Shape (profile → analyze → judge → plan)
1. **Profile** — identify genuine hotspots with evidence (profiler lines, hot loops, quadratic patterns, N+1 queries, large allocations). Run `profileCmd` first if provided.
2. **Analyze** — one analyst per hotspot proposes 1–3 concrete optimizations, each with an honest impact estimate, effort, and the behavioral tradeoff/risk. Prefer algorithmic wins over micro-opts.
3. **Judge** — 2 judges per candidate: will it produce a *real* gain on a genuinely hot path, and is it *safe* (no correctness regression)? Drop unsafe ones and micro-opts on cold code. Rank survivors by impact ÷ effort.
4. **Plan** — Markdown: 🚀 Quick wins (high impact, low effort), 🏗 Bigger bets, ⚠️ Watch-the-tradeoff. Each item says where, the change, the expected gain, and how to measure before/after.

## Guardrails
- Measure, don't assume — anchor on profiler data when available, and always specify how to verify the win.
- Safety first: an optimization that risks correctness is rejected regardless of speed.
- Ignore cosmetic "could be faster" notes on cold paths.

## When you want it identical every time
Use `.claude/workflows/perf-audit.js` (`Run the perf-audit workflow with args {"root":"src","focus":"p99 latency","profileCmd":"npm run bench"}`).
