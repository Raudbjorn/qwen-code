# Spoon-Export Fork Evaluation: QwenLM/qwen-code

**Date**: 2026-06-19
**Source**: `./spoon-export-QwenLM-qwen-code-2026-06-19.json` (4.1 MB, 2,534 forks, 1,605 enriched)
**Upstream**: QwenLM/qwen-code (25,338 stars, 2,534 forks)
**Degraded**: `true` (1605/2534 enriched, 36.6% enrichment loss vs prior export)

## Method

1. Loaded the export and computed per-fork statistics: divergence (ahead/behind/files/additions/deletions), heat score, novelty score, change_impact.
2. Detected auto-fork families via shared `(ahead, files_changed, additions, deletions)` signatures — 2,393 forks shared the `(0, 0, 0, 0)` "pure mirror" signature and were filtered as zero-signal. 19 forks shared `(3, 123, 6517, 525)` and were a bot-generated ollama-code family.
3. Ranked survivors by composite score: `novelty × 0.4 + change_impact × 0.3 + recency × 0.2 + min(stars/100, 1) × 0.1`, with a sweet-spot bonus for small, feature-focused forks (1-50 files, 50-200 lines/file).
4. Re-verified each top candidate against current upstream HEAD via the GitHub API to rule out stale exports showing `ahead: N` for forks that have since fallen behind.
5. Investigated each candidate's actual diff (which files, what it really does) rather than relying on the export's heuristic `why_distinct` field.

## TL;DR — Top 10 Most Interesting Forks

| # | Fork | What it adds | Verdict for our CLI-experience focus |
|---|------|--------------|----------------------------------------|
| 1 | `helixml/qwen-code` (ca5f3a2) | Disables Alibaba RUM telemetry + npm update-check | **PORTED — PR #1** — privacy first, biggest UX win |
| 2 | `aspnmy/qwen-code` (ceaa728) | SSE stream idle watchdog (90s timeout) | **PORTED — PR #2** — reliability, no more hung streams |
| 3 | `vector0902/qwen-code` (20c78d3) | `--modalities` CLI flag for model overrides | **PORTED — PR #3** — flexibility for non-registry models |
| 4 | `FoliageOwO/qwen-code` (02a4e5) | `/goal` command with autonomous continuation | **SKIPPED** — collides with our existing goal system at `packages/core/src/goals/` |
| 5 | `gxianch/qwen-code` (81b6e1c) | Offline standalone license activation | **DEFERRED** — too large (15 files, ed25519 crypto) for first pass |
| 6 | `undici77/qwen-code-no-telemetry` (no-telemetry branch) | 46 stars, "no-telemetry" branding | **NOT NEEDED** — same effect as helixml but heavier |
| 7 | `DaveRodman/qwen-code` | Drain peer-message queue + claude push notifications | **SKIPPED** — orthogonal to CLI, ACP channel internals |
| 8 | `joleuger/qwen-code` (d5eced4) | Clarify timeout troubleshooting in error message | **NOTED** — 1-line string fix, may merge later |
| 9 | `RenzMc/qwen-code` | Safe fallback when IDE info unavailable | **NOTED** — likely already fixed upstream |
| 10 | `jqueguiner/qwen-code` | `--worktree` flag for parallel sessions | **MERGED** — already in upstream main as PR #1 |

## Why I picked these 3 (helixml, aspnmy, vector0902) over the bigger forks

- **FoliageOwO's `/goal` was the most novel, but our fork already has a mature goal system** at `packages/core/src/goals/` with `goalHook`, `goalJudge`, `goalLoop`, and per-session `ActiveGoal` storage. The FoliageOwO patch assumed the old `goalManager` singleton class + `GoalStatus` enum (`Active | Paused | BudgetLimited | Complete`) which our `GoalStatusKind` (`set | achieved | cleared | failed | aborted | checking`) supersedes. Cherry-picking would have produced two parallel goal systems. Cost > value.
- **gxianch's offline license is a complete feature** (15 files, ed25519 signature verification, prompt UI, install-script integration). It's well-engineered but the integration surface is too large for a first wave of ports, and we don't have a license to validate against.
- **undici77 has 46 stars** but their no-telemetry commit is structurally identical to helixml's, and the rest of their changes are upstream merges. helixml wins on the diff-minimality criterion.
- **vector0902's `--modalities`** is a small (1 commit, 5 files) but well-named feature that fills a real gap: the modalities resolver only knows about models in the registry, so users on self-hosted Qwen-style endpoints with image support can't enable it without editing settings.json. The CLI flag is the ergonomic fix.

## What I actually ported

### PR #1 — helixml: Disable external telemetry and update-check

Files changed (4): `packages/cli/src/config/settingsSchema.ts`, `packages/cli/src/ui/utils/updateCheck.ts`, `packages/core/src/config/config.ts`, `packages/core/src/telemetry/qwen-logger/qwen-logger.ts`

Diff: +10 / -97

- `QwenLogger.getInstance()` now unconditionally returns `undefined` — no events sent to `gb4w8c3ygj-default-sea.rum.aliyuncs.com`
- `usageStatisticsEnabled` default flipped from `true` to `false` in both `settingsSchema.ts` and `config.ts`
- `updateCheck.ts` gutted to always return `null` — no npm registry queries
- OpenTelemetry OTLP export left intact (defaults to `localhost:4317`, requires explicit opt-in)

### PR #2 — aspnmy: SSE stream idle watchdog

Files changed (2): `packages/core/src/core/streamIdleWatchdog.ts` (new, 79 lines), `packages/core/src/core/geminiChat.ts` (44 lines)

Diff: +117 / -6

- New `StreamIdleWatchdog` wraps `AsyncIterator.next()` via `Promise.race` against a configurable timeout
- `abortSignal` is wired through `linkAbortSignal` so parent cancellation propagates
- New `STREAM_IDLE_TIMEOUT` value added to `InvalidStreamErrorType` union
- Configurable via `QWEN_CODE_STREAM_IDLE_TIMEOUT_MS` (default 90s); disable with `QWEN_CODE_DISABLE_STREAM_WATCHDOG=1`
- Warning logged at the 50% mark so verbose-mode users get a heads-up before the abort
- Fixes #4177 — hung streams from network blips / provider-side stalls no longer hang the CLI forever

### PR #3 — vector0902: `--modalities` CLI flag + slim cleanup

Files changed (9): 3 vector0902 files + 6 slim cleanup files

Diff: +53 / -126

Vector0902 part (+43 / -2):
- `packages/cli/src/config/config.ts` — `CliArgs.modalities` + yargs `--modalities` option + pass through to `resolveCliGenerationConfig`
- `packages/cli/src/utils/modelConfigUtils.ts` — `CliGenerationConfigInputs.argv.modalities`
- `packages/core/src/models/modelConfigResolver.ts` — `ModelConfigCliInput.modalities` + `resolveGenerationConfig` now accepts `cliModalities` and applies it last (highest priority)

Slim cleanup part (+10 / -124):
- `esbuild.config.js` — drop vscode-ide-companion + web-templates aliases
- `package.json` — drop dead scripts (dev:daemon, generate:settings-schema) + husky/lint-staged/react-devtools-core devDeps
- `packages/cli/package.json` — drop weixin channel dep + ansi-regex/command-exists/web-templates
- `eslint.config.js` — drop husky/vscode/webui ignores
- `scripts/build.js` — slimmed buildOrder (no webui/sdk/web-shell/vscode-ide-companion)
- `scripts/clean.js` — drop desktop/channels-removed entries

This second part is included because it's the same diff the build system produces locally on first run; without it, every fresh clone of the fork regenerates the same modification on disk.

## Anti-port list

- All 19 forks of `piotroq/ollama-code` family (auto-forked from same source). Differentiation is zero.
- All ~2,393 "pure mirror" forks (0/0/0/0 signature). These are GitHub Classroom / tutorial mirrors with no code.
- Forks that are simply rebases of upstream with a custom README description (e.g. `furina707/qwen-code`, `vector0902/qwen-code` description fork). High novelty score but zero interesting code.

## Build-system notes (from the actual build attempt)

The PKGBUILD build I tried (`makepkg --noarchive`) revealed a real bug in the fork: `packages/desktop` (a third-party "openwork" sub-fork that the slim branch kept the directory for but didn't actually update) ships `optionalDependencies: ["@rollup/rollup-win32-arm64-msvc@^4.55.1"]` that npm 11+ tries to install on every platform and fails with `EBADPLATFORM` on Linux/x64.

The PKGBUILD works around this with:
- `!packages/desktop` in the workspace exclude (already committed to main by the slim cleanup)
- `--ignore-scripts` to skip the `postinstall: husky && npm run build && npm run bundle` chain
- `--no-optional` to skip optional deps (belt-and-suspenders alongside the workspace exclude)
- `node scripts/build.js --cli-only` instead of `npm run build --workspaces` because the channel packages' `tsc --build` doesn't understand `--cli-only`

The `--cli-only` flag is the key change vs. the original `qwen-code-bin` PKGBUILD I started from. Without it, `npm run build --workspaces` would pass `--cli-only` down to every workspace, and the channel packages would error with `Unknown build option '--cli-only'`.
