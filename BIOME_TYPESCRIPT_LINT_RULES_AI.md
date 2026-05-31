# Biome + TypeScript Lint Rules for AI-Heavy Codebases

> **Generated:** 2026-05-31  
> **Method:** 5 parallel research agents scoured web, HN, GitHub, Reddit, blogs, docs  
> **Sources analyzed:** 80+ distinct articles, repos, discussions, surveys  
> **This repo uses:** Biome (all-in-one linter + formatter)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [TypeScript Compiler Options](#typescript-compiler-options)
3. [Biome Lint Rules](#biome-lint-rules)
4. [AI Anti-Patterns Detected](#ai-anti-patterns-detected)
5. [Community Consensus & Workflows](#community-consensus--workflows)
6. [Recommended Configuration](#recommended-configuration)
7. [Sources & References](#sources--references)

---

## Executive Summary

The 2026 developer consensus is clear: **AI-generated code has 1.7x more issues than human code**, with 45% containing security vulnerabilities. The only viable defense is deterministic, automated guardrails that run faster than AI can generate code.

### Key Statistics

| Statistic | Source | URL |
|---|---|---|
| AI PRs have **1.7x more issues**; 75% more logic issues; 3x more readability issues | CodeRabbit (Dec 2025, 470 PRs) | [coderabbit.ai](https://coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) |
| **45% of AI-generated code** contains known security vulnerabilities | Veracode (2025-2026, 150+ LLMs) | [veracode.com](https://www.veracode.com/blog/spring-2026-genai-code-security/) |
| **42% of committed code** is AI-generated (expected 65% by 2027) | Sonar 2026 State of Code | [sonarsource.com](https://www.sonarsource.com/state-of-code-developer-survey-report.pdf) |
| **Only 48%** always verify AI code before committing | Sonar 2026 State of Code | [sonarsource.com](https://www.sonarsource.com/state-of-code-developer-survey-report.pdf) |
| Reviewing AI code is the **largest time sink** (11.4 hrs/week median) | Digital Applied 2026 | [digitalapplied.com](https://www.digitalapplied.com/blog/ai-coding-tool-adoption-2026-developer-survey) |
| **94% of AI-generated defects** are type-related | Coding Dunia / CodeScene 2026 | [codingdunia.com](https://codingdunia.com/blog/vibe-coding-typescript-quality-framework/) |

### Top Consensus Rules (by total source mentions across all 5 research agents)

| Rank | Rule / Pattern | Total Sources | Severity |
|---|---|---|---|
| 1 | `noImplicitAny` / `noExplicitAny` | **25+** | CRITICAL |
| 2 | `strict` (umbrella flag) | **25+** | CRITICAL |
| 3 | Empty / swallowed catch blocks | **23+** | CRITICAL |
| 4 | `strictNullChecks` | **18+** | CRITICAL |
| 5 | Dead code / unused imports / variables | **18+** | WARNING |
| 6 | Console.log / debugging artifacts | **18+** | WARNING |
| 7 | Pre-commit hooks / CI gates | **18+** | WORKFLOW |
| 8 | `noUncheckedIndexedAccess` | **16+** | CRITICAL |
| 9 | Hallucinated imports / fake deps | **15+** | CRITICAL |
| 10 | Hardcoded secrets / placeholders | **15+** | CRITICAL |

---

## TypeScript Compiler Options

These are the `tsconfig.json` compiler options most frequently recommended for AI-heavy codebases. Mention counts are deduplicated across all 5 research agents.

### Tier 1: Non-Negotiable (15+ mentions)

| Option | Mentions | Why It Catches AI Slop |
|---|---|---|
| `"strict": true` | **25** | Enables 8 sub-flags. Catches 30-40% of AI-generated bugs at compile time. |
| `"noImplicitAny": true` | **20** | Prevents AI from silently falling back to `any` when inference fails. The #1 type-safety leak in AI-generated TypeScript. |
| `"strictNullChecks": true` | **18** | Catches AI accessing nullable values without checks. Called "the most valuable single flag" by multiple sources. |
| `"noUncheckedIndexedAccess": true` | **16** | Makes array indexing return `T \| undefined`. AI hates this because its training data assumes index access is total. |

### Tier 2: Strongly Recommended (8-14 mentions)

| Option | Mentions | Why It Catches AI Slop |
|---|---|---|
| `"exactOptionalPropertyTypes": true` | **13** | Stops AI from assigning `undefined` to optional properties that don't accept it. |
| `"strictFunctionTypes": true` | **11** | Catches AI passing wrong function signatures to higher-order functions. |
| `"useUnknownInCatchVariables": true` | **11** | Types catch variables as `unknown` instead of `any`, preventing AI from assuming caught errors are `Error` objects. |
| `"strictPropertyInitialization": true` | **10** | Catches AI leaving class properties uninitialized. |
| `"noImplicitOverride": true` | **8** | Requires `override` keyword. Prevents silent shadow bugs when AI renames parent methods. |
| `"strictBindCallApply": true` | **8** | Type-checks arguments passed to `.bind()`, `.call()`, `.apply()`. |
| `"noImplicitThis": true` | **7** | Errors when `this` has implicit `any`, preventing untyped callbacks. |
| `"alwaysStrict": true` | **7** | Emits `"use strict"` in every output file. |
| `"noPropertyAccessFromIndexSignature": true` | **7** | Blocks dot notation for properties not explicitly declared, preventing AI typos on dynamic objects. |

### Tier 3: Recommended (4-7 mentions)

| Option | Mentions | Why It Catches AI Slop |
|---|---|---|
| `"noUnusedLocals": true` | **5** | Flags unused variables AI leaves behind. |
| `"noUnusedParameters": true` | **5** | Flags dead parameters AI leaves behind. |
| `"noImplicitReturns": true` | **4** | Ensures all code paths return a value. Prevents silent `undefined` returns. |
| `"noFallthroughCasesInSwitch": true` | **4** | Prevents AI from accidentally falling through switch cases. |

### Sources

- [TypeScript TSConfig Reference](https://www.typescriptlang.org/tsconfig/)
- [Better Stack — TypeScript Strict Option](https://betterstack.com/community/guides/scaling-nodejs/typescript-strict-option/)
- [Coding Dunia — Vibe Coding TypeScript Quality Framework](https://codingdunia.com/blog/vibe-coding-typescript-quality-framework/)
- [Vibe Coder Blog — TypeScript Strict Mode](https://blog.vibecoder.me/typescript-strict-mode-catching-bugs)
- [32blog — Claude Code TypeScript](https://32blog.com/en/claude-code/claude-code-typescript-type-safe-code-generation)
- [DEV Community — 16 CLAUDE.md Rules](https://dev.to/olivia_craft/16-claudemd-rules-that-make-ai-write-truly-type-safe-typescript-8f2)
- [Git AutoReview — TypeScript Code Review 2026](https://gitautoreview.com/blog/typescript-code-review-2026)
- [OneUptime — Strict TypeScript Configuration](https://oneuptime.com/blog/post/2026-01-24-typescript-strict-mode/view)
- [LLM Best Practices — TypeScript Strict Mode](https://llmbestpractices.com/coding/typescript-strict-mode)
- [Skill4Agent — TypeScript Strict](https://www.skill4agent.com/en/skill/laurigates-claude-plugins/typescript-strict)
- [Masterguide — TypeScript Strict](https://github.com/dadbodgeoff/Masterguide/blob/main/00-foundations/TYPESCRIPT_STRICT.md)
- [DEV Community — Beyond Strict Mode](https://dev.to/kbharath/beyond-strict-mode-5-advanced-tsconfig-settings-for-bulletproof-typescript-1pki)
- [Hacker News — AISlop](https://news.ycombinator.com/item?id=48322956)

---

## Biome Lint Rules

These are the Biome lint rules most frequently mentioned across community sources, real-world configs (chatbox 40k stars, eliza 18.5k stars), and best-practice articles. Mention counts are deduplicated across all 5 research agents.

### Tier 1: Essential (7+ mentions)

| Rule | Category | Mentions | Why It Catches AI Slop |
|---|---|---|---|
| `noUnusedVariables` | correctness | **9** | AI leaves dead variables everywhere. |
| `noUnusedImports` | correctness | **8** | AI imports packages it doesn't use. |
| `useConst` | style | **7** | AI overuses `let`. Prefer immutability. |
| `noConsole` / `noConsoleLog` | suspicious | **7** | AI leaves `console.log` as debugging residue. |
| `noExplicitAny` | suspicious | **10** | AI uses `any` to bypass type errors. |

### Tier 2: Strongly Recommended (4-6 mentions)

| Rule | Category | Mentions | Why It Catches AI Slop |
|---|---|---|---|
| `noDebugger` | suspicious | **6** | AI leaves `debugger` statements. |
| `noDoubleEquals` | suspicious | **5** | AI uses `==` instead of `===`. |
| `noNonNullAssertion` | style | **5** | AI abuses `!` operator instead of proper checks. |
| `useExhaustiveDependencies` | correctness | **5** | AI misses React hook dependencies. |
| `noFloatingPromises` | nursery | **5** | AI creates unhandled async operations. |
| `noUndeclaredVariables` | correctness | **4** | AI references variables that don't exist. |
| `noUndeclaredDependencies` | correctness | **4** | AI imports packages not declared in `package.json`. |
| `noUnresolvedImports` | correctness | **4** | AI imports modules that don't resolve. |
| `noProcessEnv` | style | **4** | AI accesses `process.env` directly. (Error by default; disabled in env/config modules via overrides.) |
| `noDefaultExport` | style | **4** | AI overuses `export default`. (Warn by default; disabled in config files via overrides.) |
| `useNamingConvention` | style | **4** | AI generates generic names like `data`, `result`. |

### Tier 3: Recommended (2-3 mentions)

| Rule | Category | Mentions | Why It Catches AI Slop |
|---|---|---|---|
| `noStaticOnlyClass` | complexity | **3** | AI creates unnecessary classes. |
| `useTemplate` | style | **3** | AI uses string concatenation instead of templates. |
| `noNegationElse` | style | **3** | AI writes confusing inverted conditionals. |
| `noVar` | suspicious | **3** | AI uses `var` instead of `const`/`let`. |
| `useExportType` | style | **3** | AI doesn't distinguish type-only exports. |
| `useImportType` | style | **3** | AI doesn't distinguish type-only imports. |
| `useExplicitReturnType` | nursery | **3** | AI omits return types on module boundaries. (Narrower, higher-signal than `useExplicitType`.) |
| `noMisusedPromises` | nursery | **3** | AI passes async functions where sync expected. |
| `useAwaitThenable` | nursery | **3** | AI `await`s non-Promise values. |
| `noUnnecessaryConditions` | nursery | **3** | AI writes dead code that types make unreachable. |
| `useExhaustiveSwitchCases` | nursery | **3** | AI misses switch cases on union types. |
| `noExcessiveCognitiveComplexity` | complexity | **2** | AI generates deeply nested functions. |
| `noBannedTypes` | complexity | **2** | AI uses `String`, `Number`, `Boolean` wrapper types. |
| `noSecrets` | security | **2** | AI hardcodes API keys in source. (Warn; use a real secret scanner in CI.) |
| `noDangerouslySetInnerHtml` | security | **2** | AI uses `dangerouslySetInnerHTML`. |
| `noGlobalEval` | security | **2** | AI uses `eval()`. |
| `noAlert` | suspicious | **3** | AI uses `alert()` for debugging. |
| `noImportCycles` | suspicious | **2** | AI creates circular import chains. |
| `noDeprecatedImports` | suspicious | **2** | AI imports deprecated APIs. |
| `noFocusedTests` | suspicious | **2** | AI commits `.only` test blocks. |
| `noSkippedTests` | suspicious | **2** | AI commits `.skip` test blocks. |

### Type-Aware Nursery Rules (Biome v2)

In Biome v2.4+, enable type-aware rules via `domains`:

```json
{
  "linter": {
    "domains": {
      "types": "all",
      "react": "recommended",
      "test": "recommended"
    }
  }
}
```

`domains.types = "all"` enables the type-inference-backed rules in the `types` domain. This includes async-safety rules such as `noFloatingPromises`, `noMisusedPromises`, `useAwaitThenable`, exhaustiveness rules such as `useExhaustiveSwitchCases`, and additional type-aware correctness rules such as `noUnsafePlusOperands`, `noMisleadingReturnType`, `noUselessTypeConversion`, `useArraySortCompare`, `useFind`, and `useNullishCoalescing`.

`useExplicitType` is **not** a types-domain rule. If desired, enable it explicitly under `nursery`, but expect high noise.

`domains.react = "recommended"` enables React-specific rules such as `useExhaustiveDependencies`, `useHookAtTopLevel`, `useJsxKeyInIterable`, `noDangerouslySetInnerHtml`, and `noArrayIndexKey`.

`domains.test = "recommended"` enables test-specific rules for Jest/Mocha/Ava/Vitest globals and test file patterns.

### Sources

- [Biome Official Docs](https://biomejs.dev/linter/)
- [chatboxai/chatbox biome.json](https://github.com/chatboxai/chatbox/blob/main/biome.json) (40.2k stars)
- [elizaOS/eliza biome.json](https://github.com/elizaOS/eliza/blob/develop/biome.json) (18.5k stars)
- [dvashim/biome-config](https://github.com/dvashim/biome-config/blob/main/dist/biome.react-strict.json)
- [PocketArc — Hardcore TypeScript](https://pocketarc.com/typescript)
- [HeyClaude — Biome Strict Linting Rules](https://heyclau.de/rules/biome-strict-linting-rules)
- [Jsonic — Biome Configuration](https://jsonic.io/guides/biome-json)
- [Toolchew — Migrate to Biome](https://toolchew.com/en/how-to-migrate-eslint-to-biome/)
- [StackNotice — Biome vs ESLint](https://stacknotice.com/blog/biome-vs-eslint-prettier-guide-2026)
- [NextFuture — Biome vs ESLint](https://nextfuture.io.vn/blog/biome-vs-eslint-linter-comparison-2026)

---

## AI Anti-Patterns Detected

These are the specific anti-patterns most prevalent in AI-generated code, as reported by multiple community sources, tools, and studies.

### By Prevalence (most sources mentioning)

| Rank | Anti-Pattern | Sources | Catching Rule(s) |
|---|---|---|---|
| 1 | **`any` / type assertion abuse** (`as any`, `as unknown as X`) | **15+** | `noExplicitAny`, `noNonNullAssertion`, TS `strict` |
| 2 | **Empty catch blocks / silent error swallowing** | **14+** | `noEmptyBlockStatements` (Biome — error), custom rules |
| 3 | **Unused variables / dead code / unused imports** | **12+** | `noUnusedVariables`, `noUnusedImports`, `noUnusedFunctionParameters` |
| 4 | **Narrative / obvious comments** (`// gets the user`) | **11+** | Not caught by standard linters — use custom tools |
| 5 | **Hardcoded secrets / security flaws** | **10+** | `noSecrets`, `eslint-plugin-security` |
| 6 | **Console.log / debugging artifacts** | **10+** | `noConsole` |
| 7 | **TODO stubs / placeholder comments** | **9+** | `noEmptyBlockStatements`, custom rules |
| 8 | **Code duplication / DRY violations** | **9+** | `jscpd`, SonarQube — not standard Biome/ESLint |
| 9 | **Hallucinated imports / phantom packages** | **8+** | `noUndeclaredDependencies`, `noUnresolvedImports` (Biome project domain), `karpeslop` |
| 10 | **Deep nesting / complexity bloat** | **8+** | `noExcessiveCognitiveComplexity`, `max-depth` |
| 11 | **Generic naming** (`data`, `result`, `temp`) | **7+** | `useNamingConvention` |
| 12 | **Defensive overreach / unnecessary guards** | **6+** | Not caught by standard linters |
| 13 | **Over-engineering / abstraction bloat** | **8+** | `noExcessiveCognitiveComplexity`, `max-lines-per-function` |
| 14 | **Tautological tests / tests that test nothing** | **5+** | Custom rules (e.g., `no-mock-only-test`) |
| 15 | **Commented-out code** | **4+** | Custom rules |
| 16 | **Async/await misuse** | **5+** | `noFloatingPromises`, `noMisusedPromises` |
| 17 | **Missing input validation** | **5+** | `eslint-plugin-security` |
| 18 | **Loose equality (`==` instead of `===`)** | **3+** | `noDoubleEquals` |
| 19 | **Type escape hatches (`@ts-ignore`)** | **4+** | `noNonNullAssertion`, TS strict flags |

### Tools Built Specifically for AI Slop Detection

| Tool | Rules | Languages | URL |
|---|---|---|---|
| **aislop** | 40+ (narrative comments, swallowed exceptions, `as any`, hallucinated imports, duplicated helpers, dead code, TODO stubs) | TS/JS, Python, Go, Rust, Ruby, PHP, Java | [github.com/scanaislop/aislop](https://github.com/scanaislop/aislop) |
| **slop-scan** | Log-and-continue catches, empty catches, async wrapper noise, pass-through wrappers, barrel density, duplicate helpers, over-fragmentation, placeholder comments | TS/JS | [github.com/benvinegar/slop-scan](https://github.com/benvinegar/slop-scan) |
| **vibecheck** | 34 rules (no-hardcoded-secrets, no-eval, no-empty-catch, no-console-pollution, no-ai-todo, no-god-function, no-obvious-comments, no-ts-any) | JS/TS, Python | [github.com/yuvrajangadsingh/vibecheck](https://github.com/yuvrajangadsingh/vibecheck) |
| **antislop** | Placeholders, deferrals, hedging, stubs, noise (redundant comments) | 17 languages | [github.com/skew202/antislop](https://github.com/skew202/antislop) |
| **karpeslop** | 3 axes: Information Utility (noise), Information Quality (lies), Style/Taste (soul). Hallucinated imports, `any` abuse, TODOs | TS/JS | [github.com/CodeDeficient/karpeslop](https://github.com/CodeDeficient/karpeslop) |
| **eslint-plugin-llm-core** | 20 rules (no-async-array-callbacks, no-empty-catch, no-magic-numbers, prefer-early-return, no-commented-out-code) | JS/TS | [dev.to/pertrai1](https://dev.to/pertrai1/i-analyzed-500-ai-coding-mistakes-and-built-an-eslint-plugin-to-catch-them-jme) |

### Sources

- [CodeRabbit — State of AI vs Human Code](https://coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report)
- [Veracode — GenAI Code Security](https://www.veracode.com/blog/spring-2026-genai-code-security/)
- [Hacker News — AISlop](https://news.ycombinator.com/item?id=48322956)
- [Scan AISlop Blog — What Is AI Slop?](https://scanaislop.com/blog/what-is-ai-slop/)
- [PocketArc — Hardcore TypeScript](https://pocketarc.com/articles/hardcore-typescript)
- [DEV Community — ESLint Plugin for AI](https://dev.to/pertrai1/i-analyzed-500-ai-coding-mistakes-and-built-an-eslint-plugin-to-catch-them-jme)
- [DEV Community — ESLint Can't Catch This](https://dev.to/raye_deng_622ab98e19a2147/eslint-cant-catch-this-5-failure-modes-unique-to-ai-generated-code-and-how-i-detect-them-in-ci-hl)
- [HackerNoon — AI Code Duplication](https://hackernoon.com/what-49-vibe-coded-github-projects-revealed-about-ai-code-duplication)
- [GitClear — AI Code Audit](https://rizz.dev/blog/opinion/ai-generated-code-audit)
- [BSWEN — Automated Linting for AI](https://docs.bswen.com/blog/2026-03-13-automated-linting-hooks-ai-development/)
- [Youngju.dev — Reviewing AI Code](https://www.youngju.dev/blog/culture/2026-05-14-reviewing-ai-generated-code-verification-loop-ai-slop-deep-dive-guide-2026.en)
- [Hacker News — Ask HN: How to deal with AI sloppy code](https://news.ycombinator.com/item?id=41677207)
- [Hacker News — Speed at the cost of quality](https://news.ycombinator.com/item?id=47401734)
- [DEV Community — Unreviewed AI Code](https://dev.to/ayame0328/unreviewed-ai-code-is-everywhere-heres-what-breaks-first-480j)
- [Armis Labs — Trusted Vibing Benchmark](https://media.armis.com/rp-trusted-vibing-benchmark-en.pdf)
- [arxiv/COBALT — Vulnerability Benchmark](https://www.arxiv.org/pdf/2604.05292)
- [Newsletter — How to Avoid AI Code Slop](https://newsletter.eng-leadership.com/p/how-to-avoid-ai-code-slop)
- [Sakasegawa — Harness Engineering Best Practices](https://nyosegawa.com/en/posts/harness-engineering-best-practices-2026/)
- [Kahwee — Your Linter Needs to Be as Fast as Your AI](https://kahwee.com/2026/biome-linting-for-ai-workflows/)
- [Medium — Lint Against the Machine](https://medium.com/@montes.makes/lint-against-the-machine-a-field-guide-to-catching-ai-coding-agent-anti-patterns-3c4ef7baeb9e)
- [0xUXDesign — AI Code Quality Framework](https://github.com/0xUXDesign/ai-code-quality-framework)
- [Vibe Coder Blog — Linting with Biome](https://blog.vibecoder.me/linting-formatting-eslint-prettier-biome)
- [Kyle Pericak — AI Lint Toolkit](https://kyle.pericak.com/ai-lint-toolkit.html)
- [Better Stack — Biome vs ESLint](https://betterstack.com/community/guides/scaling-nodejs/biome-eslint/)

---

## Community Consensus & Workflows

### The 8 Layers of AI Code Quality (most-mentioned across all platforms)

| Layer | Sources | Description |
|---|---|---|
| 1. **Deterministic linting** | **20+** | Empty catches, dead code, console.logs, `any` — the most cited AI-specific patterns. |
| 2. **Strict TypeScript** | **18+** | `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`. Non-negotiable. |
| 3. **CI gates** | **18+** | "Don't let AI change linting configuration." Treat warnings as errors. |
| 4. **Pre-commit hooks** | **18+** | Run `biome check` on every commit. Use Lefthook or Husky. |
| 5. **Session-stop validation** | **15+** | Run full `biome check` + `tsc --noEmit` at end of AI session. |
| 6. **Custom rules** | **14+** | Build Biome/ESLint rules for your team's specific AI failure modes. |
| 7. **Dead code detection** | **12+** | Use Knip for orphan exports. Use jscpd for duplication. |
| 8. **Security scanning** | **13+** | SAST, secrets detection, dependency audit on every PR. |

### Additional Recommendations

| Recommendation | Sources | Detail |
|---|---|---|
| **Separate verifier from generator** | **4+** | Use a different agent or human to review AI output. Never let the same agent review its own code. |
| **Mutation testing (Stryker)** | **4+** | AI-generated tests are often tautological. Verify test quality with mutation testing. |
| **AGENTS.md / CLAUDE.md conventions** | **4+** | Copy your `tsconfig.json` into `CLAUDE.md` — called "the single highest-leverage change" by 32blog. |
| **Behavior-driven testing (BDD/Gherkin)** | **4+** | Human-managed acceptance tests as contracts to constrain AI. |
| **Dependency auditing** | **3+** | Maintain an approved dependency list. AI regularly hallucinates imports. |
| **Token-aware clean code** | **1+** | Optimize code for AI context windows, not just human readability. |

### Sources

- [Sonar 2026 State of Code Survey](https://www.sonarsource.com/state-of-code-developer-survey-report.pdf)
- [Digital Applied 2026 Developer Survey](https://www.digitalapplied.com/blog/ai-coding-tool-adoption-2026-developer-survey)
- [Stack Overflow 2026 Pulse](https://stackoverflow.blog/2026/05/27/agents-on-a-leash-agentic-ai-remains-mostly-monitored-at-work/)
- [Pragmatic Engineer — Impact of AI on Engineers](https://newsletter.pragmaticengineer.com/p/the-impact-of-ai-on-software-engineers-2026)
- [JetBrains AI Pulse 2026](https://blog.jetbrains.com/research/2026/04/which-ai-coding-tools-do-developers-actually-use-at-work/)
- [BSWEN — Automated Linting Hooks](https://docs.bswen.com/blog/2026-03-13-automated-linting-hooks-ai-development/)
- [Motomtech — AI Code Quality Gates](https://www.motomtech.com/blog-post/ai-generated-code-quality-gates/)
- [CodeIntelligently — AI Code Quality Guide](https://codeintelligently.com/blog/ai-code-quality-guide-2026)
- [Youngju.dev — Verification Loop](https://www.youngju.dev/blog/culture/2026-05-14-reviewing-ai-generated-code-verification-loop-ai-slop-deep-dive-guide-2026.en)
- [Generative Programmer — Missing Quality Layer](https://generativeprogrammer.com/p/the-missing-quality-layer-for-ai)
- [Doneyli Substack — Quality Gates](https://doneyli.substack.com/p/quality-gates-for-ai-generated-code)
- [Uncle Bob Thread — AI Constrained by Tests](https://github.com/dudarev/ai-assisted-software-development/commit/4504e0341c7a9a80f8c673ea1d84cb44665f3886)
- [Hacker News — AI Lint](https://news.ycombinator.com/item?id=46744650)
- [Hacker News — Custom Lint Rules](https://news.ycombinator.com/item?id=46675369)
- [Hacker News — Formal Verification Gates](https://news.ycombinator.com/item?id=48209323)

---

## Recommended Configuration

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "noEmit": true
  },
  "include": ["src/**/*", "tests/**/*", "**/*.test.ts", "**/*.spec.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### `tsconfig.build.json`

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts", "tests"]
}
```

### `biome.jsonc`

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.4.14/schema.json",
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  },
  "linter": {
    "enabled": true,
    "domains": {
      "types": "all",
      "react": "recommended",
      "test": "recommended"
    },
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error",
        "noUnusedFunctionParameters": "warn",
        "noUndeclaredVariables": "error",
        "noConstAssign": "error",
        "useExhaustiveDependencies": "error",
        "noUndeclaredDependencies": "error",
        "noUnresolvedImports": "error",
        "noPrivateImports": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noConsole": {
          "level": "warn",
          "options": {
            "allow": ["error", "warn", "info"]
          }
        },
        "noDebugger": "error",
        "noDoubleEquals": "error",
        "noAlert": "error",
        "noAssignInExpressions": "warn",
        "noEmptyBlockStatements": "error",
        "noVar": "error",
        "noImportCycles": "warn",
        "noDeprecatedImports": "warn",
        "noFocusedTests": "error",
        "noSkippedTests": "error"
      },
      "style": {
        "useConst": "error",
        "noNonNullAssertion": "error",
        "useTemplate": "warn",
        "noNegationElse": "warn",
        "useExportType": "error",
        "useImportType": "error",
        "useNamingConvention": {
          "level": "warn",
          "options": {
            "strictCase": true,
            "requireAscii": true
          }
        },
        "noProcessEnv": "error",
        "noDefaultExport": "warn"
      },
      "complexity": {
        "noStaticOnlyClass": "warn",
        "noExcessiveCognitiveComplexity": {
          "level": "warn",
          "options": {
            "maxAllowedComplexity": 15
          }
        },
        "noBannedTypes": "warn"
      },
      "nursery": {
        "noFloatingPromises": "error",
        "noMisusedPromises": "error",
        "useAwaitThenable": "warn",
        "noUnnecessaryConditions": "warn",
        "useExhaustiveSwitchCases": "warn",
        "useExplicitReturnType": "warn"
      },
      "security": {
        "noSecrets": "warn",
        "noDangerouslySetInnerHtml": "error",
        "noGlobalEval": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "jsxQuoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  },
  "files": {
    "ignoreUnknown": true,
    "includes": [
      "**",
      "!!**/node_modules",
      "!!**/dist",
      "!!**/build",
      "!!**/coverage",
      "!**/*.generated.ts"
    ]
  },
  "overrides": [
    {
      "includes": [
        "**/env/**/*",
        "**/config/**/*",
        "**/*.config.*",
        "next.config.*",
        "vite.config.*",
        "vitest.config.*"
      ],
      "linter": {
        "rules": {
          "style": {
            "noProcessEnv": "off",
            "noDefaultExport": "off"
          }
        }
      }
    }
  ]
}
```

### CI Integration

```yaml
# .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run check
      - run: bun run check:deps
      - run: bun run check:dupes
      - uses: gitleaks/gitleaks-action@v2
      - run: bun audit
```

### Package Scripts

```json
{
  "scripts": {
    "check": "biome ci . && tsc --noEmit",
    "check:deps": "knip",
    "check:dupes": "jscpd .",
    "check:security": "gitleaks detect --source . && bun audit"
  }
}
```

### Pre-Commit Hook (Lefthook)

```yaml
# lefthook.yml
pre-commit:
  commands:
    check:
      glob: "*.{js,ts,jsx,tsx,json,jsonc}"
      run: bunx @biomejs/biome check --write {staged_files}
    typecheck:
      glob: "*.{ts,tsx}"
      run: bun run tsc --noEmit
```

---

## Sources & References

### Official Documentation

- [Biome Linter](https://biomejs.dev/linter/)
- [Biome v2 Upgrade Guide](https://biomejs.dev/guides/upgrade-to-biome-v2/)
- [TypeScript TSConfig Reference](https://www.typescriptlang.org/tsconfig/)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig/strict.html)

### Real-World Configs

- [chatboxai/chatbox (40.2k stars)](https://github.com/chatboxai/chatbox/blob/main/biome.json)
- [elizaOS/eliza (18.5k stars)](https://github.com/elizaOS/eliza/blob/develop/biome.json)
- [dvashim/biome-config — React Strict](https://github.com/dvashim/biome-config/blob/main/dist/biome.react-strict.json)

### Articles & Blog Posts

- [PocketArc — Hardcore TypeScript + Biome + ESLint](https://pocketarc.com/typescript)
- [HeyClaude — Biome Strict Linting Rules](https://heyclau.de/rules/biome-strict-linting-rules)
- [Jsonic — Biome.json Configuration](https://jsonic.io/guides/biome-json)
- [DEV Community — ESLint Plugin for AI (500 mistakes analyzed)](https://dev.to/pertrai1/i-analyzed-500-ai-coding-mistakes-and-built-an-eslint-plugin-to-catch-them-jme)
- [DEV Community — ESLint Can't Catch AI Failure Modes](https://dev.to/raye_deng_622ab98e19a2147/eslint-cant-catch-this-5-failure-modes-unique-to-ai-generated-code-and-how-i-detect-them-in-ci-hl)
- [DEV Community — Replaced ESLint + Prettier with Biome Across 16 Repos](https://dev.to/raxxostudios/i-replaced-eslint-prettier-with-biome-across-16-repos-setup-wins-and-2-gotchas-4jk)
- [Medium — Lint Against the Machine](https://medium.com/@montes.makes/lint-against-the-machine-a-field-guide-to-catching-ai-coding-agent-anti-patterns-3c4ef7baeb9e)
- [Vibe Coder Blog — Linting with Biome](https://blog.vibecoder.me/linting-formatting-eslint-prettier-biome)
- [Vibe Coder Blog — TypeScript Strict Mode](https://blog.vibecoder.me/typescript-strict-mode-catching-bugs)
- [32blog — Claude Code TypeScript](https://32blog.com/en/claude-code/claude-code-typescript-type-safe-code-generation)
- [Coding Dunia — Vibe Coding TypeScript Quality](https://codingdunia.com/blog/vibe-coding-typescript-quality-framework/)
- [Better Stack — Biome vs ESLint](https://betterstack.com/community/guides/scaling-nodejs/biome-eslint/)
- [Kahwee — Biome for AI Workflows](https://kahwee.com/2026/biome-linting-for-ai-workflows/)
- [Sakasegawa — Harness Engineering Best Practices](https://nyosegawa.com/en/posts/harness-engineering-best-practices-2026/)
- [BSWEN — Automated Linting for AI](https://docs.bswen.com/blog/2026-03-13-automated-linting-hooks-ai-development/)
- [Youngju.dev — Reviewing AI Code](https://www.youngju.dev/blog/culture/2026-05-14-reviewing-ai-generated-code-verification-loop-ai-slop-deep-dive-guide-2026.en)
- [CodeIntelligently — AI Code Quality Guide](https://codeintelligently.com/blog/ai-code-quality-guide-2026)
- [Motomtech — AI Code Quality Gates](https://www.motomtech.com/blog-post/ai-generated-code-quality-gates/)
- [Generative Programmer — Missing Quality Layer](https://generativeprogrammer.com/p/the-missing-quality-layer-for-ai)
- [HackerNoon — AI Code Duplication (49 projects)](https://hackernoon.com/what-49-vibe-coded-github-projects-revealed-about-ai-code-duplication)
- [GitClear — AI Code Audit](https://rizz.dev/blog/opinion/ai-generated-code-audit)
- [Scan AISlop — What Is AI Slop?](https://scanaislop.com/blog/what-is-ai-slop/)
- [Kyle Pericak — AI Lint Toolkit](https://kyle.pericak.com/ai-lint-toolkit.html)
- [0xUXDesign — AI Code Quality Framework](https://github.com/0xUXDesign/ai-code-quality-framework)
- [Osmond van Hemert — Biome, The ESLint Killer](https://www.osmondvanhemert.nl/posts/260521-biome-eslint-prettier-killer/)
- [byteiota — Biome Replaces ESLint in 2026](https://byteiota.com/biome-replaces-eslint-in-2026-10-20x-faster-linting/)
- [Toolchew — Migrate to Biome](https://toolchew.com/en/how-to-migrate-eslint-to-biome/)
- [StackNotice — Biome vs ESLint](https://stacknotice.com/blog/biome-vs-eslint-prettier-guide-2026)
- [NextFuture — Biome vs ESLint](https://nextfuture.io.vn/blog/biome-vs-eslint-linter-comparison-2026)
- [DevToolbox — Biome vs ESLint 2026](https://devtoolbox.blog/biome-vs-eslint-prettier-2026-2/)
- [Toolchew — Biome vs ESLint](https://toolchew.com/en/biome-vs-eslint/)
- [Recca0120 — Biome ESLint Prettier Replacement](https://recca0120.github.io/en/2026/03/10/biome-eslint-prettier-replacement/)
- [Rockpack 8.0 — DEV Community](https://dev.to/alexsergey/rockpack-80-a-react-scaffolder-built-for-the-age-of-ai-assisted-development-4bnl)
- [Git AutoReview — TypeScript Code Review](https://gitautoreview.com/blog/typescript-code-review-2026)
- [OneUptime — Strict TypeScript](https://oneuptime.com/blog/post/2026-01-24-typescript-strict-mode/view)
- [OneUptime — Strict TypeScript React](https://oneuptime.com/blog/post/2026-01-15-strict-typescript-configuration-react/view)
- [LLM Best Practices — TypeScript](https://llmbestpractices.com/coding/typescript-strict-mode)
- [Skill4Agent — TypeScript Strict](https://www.skill4agent.com/en/skill/laurigates-claude-plugins/typescript-strict)
- [Masterguide — TypeScript Strict](https://github.com/dadbodgeoff/Masterguide/blob/main/00-foundations/TYPESCRIPT_STRICT.md)
- [DEV Community — 16 CLAUDE.md Rules](https://dev.to/olivia_craft/16-claudemd-rules-that-make-ai-write-truly-type-safe-typescript-8f2)
- [DEV Community — Beyond Strict Mode](https://dev.to/kbharath/beyond-strict-mode-5-advanced-tsconfig-settings-for-bulletproof-typescript-1pki)
- [DEV Community — TypeScript Strict Mode in Practice](https://dev.to/pipipi-dev/typescript-strict-mode-in-practice-catching-bugs-with-type-safety-3kbk)
- [DEV Community — 8 Flags](https://dev.to/gabrielanhaia/typescript-strict-mode-is-8-flags-turn-strictnullchecks-on-last-52mj)
- [DEV Community — 5 Defaults Changed in 2026](https://dev.to/gabrielanhaia/5-typescript-defaults-that-quietly-changed-in-2026-and-why-your-build-is-now-broken-381f)
- [DEV Community — Unreviewed AI Code](https://dev.to/ayame0328/unreviewed-ai-code-is-everywhere-heres-what-breaks-first-480j)
- [DEV Community — AI Code Review Checklist](https://dev.to/hackmamba/ai-code-review-checklist-that-actually-catches-problems-10o3)
- [DEV Community — Testing Strategies for AI Code](https://dev.to/therizwansaleem/testing-strategies-for-ai-generated-frontend-code-joe)
- [DEV Community — CodeHeal](https://dev.to/ayame0328/why-ai-generated-code-is-a-minefield-is-trending-and-what-2-months-of-building-a-static-scanner-4fg4)
- [DEV Community — The Lie We Tell About AI Code](https://dev.to/blakcodes/the-lie-we-are-all-telling-ourselves-about-ai-code-2e2g)
- [DEV Community — Claude NestJS Security](https://dev.to/ofri-peretz/claude-wrote-a-nestjs-service-typescript-was-happy-eslint-found-6-security-holes-51nj)
- [Newsletter — How to Avoid AI Code Slop](https://newsletter.eng-leadership.com/p/how-to-avoid-ai-code-slop)
- [Doneyli Substack — Quality Gates](https://doneyli.substack.com/p/quality-gates-for-ai-generated-code)
- [TechBytes — Custom Linter Rules](https://techbytes.app/posts/custom-linter-rules-ai-agents-cheat-sheet-2026/)

### Hacker News Discussions

- [Show HN: AISlop (May 2026)](https://news.ycombinator.com/item?id=48322956)
- [Show HN: Vibecheck](https://news.ycombinator.com/item?id=47398197)
- [Show HN: Sloppylint](https://news.ycombinator.com/item?id=46167703)
- [CodeDrift](https://news.ycombinator.com/item?id=47260551)
- [Pre-commit lint thread](https://news.ycombinator.com/item?id=46560343)
- [Ask HN: How to deal with AI sloppy code](https://news.ycombinator.com/item?id=41677207)
- [The Janitor](https://news.ycombinator.com/item?id=47242855)
- [Flag AI Slop](https://news.ycombinator.com/item?id=46650048)
- [Show HN: AI Lint](https://news.ycombinator.com/item?id=46744650)
- [Custom lint rules](https://news.ycombinator.com/item?id=46675369)
- [Formal Verification Gates](https://news.ycombinator.com/item?id=48209323)
- [Speed at the cost of quality](https://news.ycombinator.com/item?id=47401734)

### AI Slop Detection Tools

- [aislop](https://github.com/scanaislop/aislop)
- [slop-scan](https://github.com/benvinegar/slop-scan)
- [vibecheck](https://github.com/yuvrajangadsingh/vibecheck)
- [antislop](https://github.com/skew202/antislop)
- [karpeslop](https://github.com/CodeDeficient/karpeslop)
- [eslint-plugin-llm-core](https://dev.to/pertrai1/i-analyzed-500-ai-coding-mistakes-and-built-an-eslint-plugin-to-catch-them-jme)
- [eslint-plugin-nestjs-security](https://dev.to/ofri-peretz/claude-wrote-a-nestjs-service-typescript-was-happy-eslint-found-6-security-holes-51nj)
- [eslint-for-ai](https://github.com/eli0shin/eslint-for-ai)

### Surveys

- [Sonar 2026 State of Code (n=1,149)](https://www.sonarsource.com/state-of-code-developer-survey-report.pdf)
- [Digital Applied 2026 (n=2,847)](https://www.digitalapplied.com/blog/ai-coding-tool-adoption-2026-developer-survey)
- [Stack Overflow 2026 Pulse](https://stackoverflow.blog/2026/05/27/agents-on-a-leash-agentic-ai-remains-mostly-monitored-at-work/)
- [Pragmatic Engineer 2026](https://newsletter.pragmaticengineer.com/p/the-impact-of-ai-on-software-engineers-2026)
- [JetBrains AI Pulse 2026 (n=10,000+)](https://blog.jetbrains.com/research/2026/04/which-ai-coding-tools-do-developers-actually-use-at-work/)
- [CodeRabbit — State of AI vs Human](https://coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report)
- [Veracode — GenAI Code Security](https://www.veracode.com/blog/spring-2026-genai-code-security/)
- [Armis Labs — Trusted Vibing Benchmark](https://media.armis.com/rp-trusted-vibing-benchmark-en.pdf)
- [arxiv/COBALT — Vulnerability Benchmark](https://www.arxiv.org/pdf/2604.05292)

### Social Media

- [Uncle Bob Thread — AI Constrained by Tests](https://github.com/dudarev/ai-assisted-software-development/commit/4504e0341c7a9a80f8c673ea1d84cb44665f3886)
- [John Crickett LinkedIn — Defect Density](https://www.linkedin.com/posts/johncrickett_ai-can-write-code-fast-but-no-one-seems-activity-7464655732773212160-iTrg)

---

## Methodology

1. **5 parallel research agents** (librarian subagents) were dispatched across non-overlapping research angles:
   - Biome + TypeScript lint rules for AI
   - AI code anti-patterns and lint rules
   - Biome config best practices
   - TypeScript strictness for AI
   - Community consensus on AI linting

2. **80+ distinct sources** were analyzed: Biome docs, TypeScript docs, GitHub repos, HN threads, Reddit, blog posts, DEV Community articles, surveys, research papers, and social media.

3. **Mention counts** were deduplicated across all 5 agents. A source counts once per rule/anti-pattern, regardless of how many times it was mentioned in the raw research.

4. **All claims** are sourced. Every statistic, rule, and anti-pattern has at least one URL reference.

5. This report combines source synthesis with opinionated configuration recommendations. Mention counts are useful prioritization signals, not proof of rule correctness.
