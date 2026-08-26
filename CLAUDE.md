# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` covers the same ground for other agents — if you change one, update the other.

## What this is

Candlelight: a single-page Harry Potter trivia party game. Two play modes share one codebase:

- **local** — pass-and-play on one device; all logic (question generation, grading, scoring) runs in the browser.
- **async** — server-authoritative multiplayer over short-polling; the browser never sees a correct answer until the round closes.

No framework, no bundler, no build step, no TypeScript, no tests, no lint.

## Commands

- **Run locally:** open `index.html` in a browser. Local pass-and-play works fully. Multiplayer does not — `probeBackends()` pings `/.netlify/functions/game`, fails, and the UI stays on local play.
- **Full stack locally:** `npx netlify dev` (serves `.` and the functions with a Blobs emulator). Requires `npm install` for `@netlify/blobs`.
- **Deploy:** push to the connected Netlify site. `netlify.toml` publishes `.` and picks up `netlify/functions/`. No build command.
- **Housekeeping:** `POST /.netlify/functions/game` with `{"op":"cleanup"}` deletes finished games older than 4h. Nothing calls it automatically.

## Layout

| File | Role |
|---|---|
| `index.html` | The entire client — CSS in one `<style>`, all JS in one inline `<script>`. ~1950 lines. |
| `netlify/functions/game.mjs` | Server-authoritative game API. Question generation, grading, scoring, round lifecycle. |
| `netlify/functions/bank.mjs` | Question bank the server grades against. |
| `netlify/functions/kv.mjs` | Legacy generic KV endpoint. Nothing in `index.html` calls it any more. |

## The two-engine duplication

`index.html` and the server each carry **their own copy of the question bank and question-generation logic**:

- `BANK` (index.html ~line 372) mirrors `BANK` in `bank.mjs`.
- `makeQuestion()` / `pick()` / `makeRoundSet()` exist in both, with the same shapes.

Local play uses the client copies; multiplayer uses the server copies exclusively. **Adding or editing content means editing both files.** They can and do drift — client-only fields exist (`skip` on a bank item is honoured by the client `pick()` but ignored by the server's).

One deliberate difference: local rounds are `turnsPerPlayer * players.length` questions long (everyone answers different questions in turn); server rounds are `turnsPerPlayer` questions long (everyone answers the same set).

## Multiplayer flow

All calls are `POST /.netlify/functions/game` with a JSON body `{op, ...}`. State lives in a Netlify Blobs store (`candlelight-game`, strong consistency), one blob per game keyed by its code (e.g. `NIFFLER-42`).

| Op | Params | Notes |
|---|---|---|
| `create` | hostId, hostName, cfg | Claims a code, returns the game |
| `join` | code, playerId, playerName | Idempotent; re-joining just updates the name |
| `start` | code, hostId | Host-only; generates round 0 |
| `state` | code | Read + **auto-reveal side effect** (see below) |
| `submit` | code, playerId, round, answers | Grades and scores server-side, returns results |
| `reveal` | code, hostId, round | Host closes the round; non-submitters score 0 |
| `next` | code, hostId | Advance or finish; generates the next round's questions |
| `cleanup` | — | Delete finished games older than 4h |

`state` is not a pure read: if the round timer has expired or every player has submitted, it calls `autoReveal()` and writes the game back. Rounds therefore close on whoever polls next, not on a scheduler.

Questions are stored complete on the server but passed through `stripAnswers()` (drops `correct`, `truth`, `note`, `why`, `word`) before reaching a client. Never reintroduce those fields into the client payload, and never trust a client-computed score in async mode — `resolve()` in `index.html` computes points for the local UI, but the server's `scoreAnswer()` is what actually counts.

### Answer payload

`submit` takes `answers: [{answer, elapsedMs}, ...]` aligned to the round's question order. Per type:

- `trivia`, `odd` — `{choice: index}`
- `tf` — `{value: boolean}`
- `spells` — `{pairs: [[spell, effect], ...]}`
- `scramble` — `{word: string}`
- `whoami` — `{choice: index, clueIndex: 0-2}` (score multiplier `[1, 0.7, 0.45]`)
- `sorting` — `{order: ["Name1", ...]}` (house names, positionally aligned to `q.items`)
- `sequence` — `{order: [originalIndex, ...]}`

Renderers write these onto `q._raw` as the player interacts; `submitRound()` reads `q._raw` for every question in the round. Anything that clears `_raw` before submission silently zeroes the player's score.

Scoring: `basePoints * fraction`, plus up to +50% speed bonus scaled by remaining time (only when `timerOn` and `speedBonus`), plus `25 * (streak - 1)` for consecutive fully-correct answers. Streak resets on anything under a full mark.

## Client structure

Everything is module-scoped inside the one `<script>`. Key globals:

- `MODE` — `"local"` or `"async"`; most shared code branches on it.
- `cfg` — setup options (rounds, turnsPerPlayer, basePoints, timer, bonuses, themedRounds, hideAnswers, enabled `types`). Sent to the server verbatim at `create`.
- `G` / `USED` — local game state and per-type question-reuse tracking. Local only.
- `A` — async context: `{code, game, cfg, players, me, isHost, round, qs, idx, results, self, hide}`, rebuilt by `setCtx()` on every poll.
- `ME` — identity `{id, name, code}` persisted in `localStorage` under `cndl:me`. The only thing stored client-side.
- `TYPES` — the puzzle registry: display name, description, icon id, and a `time` multiplier applied to the round timer. Adding a key here makes the type appear in setup.
- `RENDER[type]` / `FORCE[type]` — per-type renderer and its timeout handler. A new puzzle type needs an entry in `TYPES`, `RENDER`, `FORCE`, `BANK` (both copies), `makeQuestion()` (both copies), and `gradeAnswer()` in `game.mjs`.

Screens are functions that overwrite `app.innerHTML` and wire their own handlers (`screenHome`, `screenSetup`, `screenJoin`, `screenQuestion`, `renderLobby`, `renderWaiting`, `renderReveal`, `renderFinal`, …). There is no router; `syncAndRoute()` inspects the polled game state and picks the screen.

Polling: `poll(fn, ms)` with a default gap of 8s, dropped to 2s in the waiting room. Polling stops while the tab is hidden and fires immediately on return. `stateSig()` gates re-renders so an unchanged state doesn't blow away in-progress DOM.

`boot()` plays a ~2.6s splash, probes the backend, restores `ME`, and handles `?code=XXX` deep links (the param is stripped via `history.replaceState` so a refresh doesn't re-join).

## Conventions

- Vanilla JS only, no imports in `index.html`, no external dependencies at runtime.
- Theming through CSS custom properties on `:root`: `--candle`, `--moss`, `--ember`, `--iris`.
- `NS = "cndl"` prefixes client storage keys.
- All user-supplied strings go through `esc()` before landing in an `innerHTML` template.
- `gameAPI()` never throws — it returns `{error: "..."}` on failure (8s abort timeout). Callers must check `res.error`.

## Gotchas

- `@netlify/blobs` only works inside Netlify's runtime; the functions cannot run under plain `node`.
- `.gitignore` is a leftover Dynamics 365 AL template and is unrelated to this project.
- `kv.mjs` still deploys and still works, but is dead code with respect to the game flow.
