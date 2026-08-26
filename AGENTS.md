# AGENTS.md — Candlelight Trivia

## What this is

A single-page Harry Potter trivia party game. Server-authoritative multiplayer with short-polling. Local pass-and-play also supported. No framework, no build step, no bundler, no TypeScript.

## Architecture

- `index.html` — entire client (UI, renderers, local game flow, multiplayer state machine, polling)
- `bank.mjs` — shared question bank (imported by server for grading; client uses the BANK copy embedded in `index.html` for local play only)
- `netlify/functions/game.mjs` — **server-authoritative game API** (creates rooms, joins players, generates questions, grades answers, calculates scores, manages round lifecycle)
- `netlify/functions/kv.mjs` — legacy generic KV endpoint (kept for backward compatibility, not used by the new game flow)
- `netlify.toml` — deploy config: publish `.`, functions `netlify/functions`
- `package.json` — only dep is `@netlify/blobs`

## How multiplayer works

1. Host creates a game via `POST /.netlify/functions/game` with op `create`
2. Server generates a code (e.g. NIFFLER-42), stores game state in Netlify Blobs
3. Players join via op `join` with the code
4. Host starts round via op `start` — server generates questions from `bank.mjs`
5. Questions are served **without answer fields** (correct, truth, word, note, why are stripped)
6. Players answer locally; renderers capture raw answers on `q._raw`
7. On round submission, raw answers are sent to server via op `submit`
8. Server grades each answer, calculates score (base + speed + streak), stores results
9. Host closes round via op `reveal` — server scores any non-submitters as 0
10. Host advances via op `next` — server generates next round's questions
11. Client polls every ~2s via op `state` to stay in sync

The client never sees correct answers during play. Scoring is entirely server-side.

## Server API ops

All calls: `POST /.netlify/functions/game` with JSON body `{op, ...params}`

| Op | Params | Description |
|---|---|---|
| `create` | hostId, hostName, cfg | Create game, return code |
| `join` | code, playerId, playerName | Join existing game |
| `start` | code, hostId | Host starts first round |
| `state` | code | Get full game state |
| `submit` | code, playerId, round, answers, elapsedMs | Submit graded answers |
| `reveal` | code, hostId, round | Host closes round, scores stragglers |
| `next` | code, hostId | Advance to next round or finish |
| `cleanup` | — | Remove old completed games |

## Answer submission format

Each entry in `answers` array: `{ answer: {type-specific}, elapsedMs: number|null }`

- trivia/odd: `{ choice: index }`
- tf: `{ value: boolean }`
- spells: `{ pairs: [[spell, effect], ...] }`
- scramble: `{ word: string }`
- whoami: `{ choice: index, clueIndex: 0-2 }`
- sorting: `{ order: ["Name1", "Name2", ...] }`
- sequence: `{ order: [originalIndex, ...] }`

## Client-side state

- `A` — multiplayer game context (code, game, cfg, players, me, round, qs, results, self)
- `A.game` — the raw server game state (questions with answers for reveal, but questions sent to client are stripped)
- `MODE` — `"local"` or `"async"`
- `G` — local game state (only used in local pass-and-play)
- `ME` — user identity stored in localStorage (id, name, code)

## Adding content

Add items to `bank.mjs` (server uses this for grading) **and** to the `BANK` object in `index.html` (client uses this for local play). 8 puzzle types: `trivia`, `tf`, `spells`, `scramble`, `odd`, `whoami`, `sorting`, `sequence`. The `TYPES` registry maps each to display metadata and a time multiplier.

## Dev / deploy

- **No build command.** Static HTML served directly.
- **Local dev:** open `index.html` in a browser (local play works; multiplayer requires deployed server).
- **Deploy:** push to the connected Netlify site. Both `game.mjs` and `kv.mjs` auto-deploy from `netlify/functions/`.
- **No tests, no lint, no typecheck.**

## Conventions

- Vanilla JS only. No imports in `index.html` (everything is inline).
- CSS custom properties in `:root` for theming. Tokens: `--candle`, `--moss`, `--ember`, `--iris`.
- Server is the single source of truth for multiplayer game state.
- Client-side rendering handles UI feedback; server handles grading and scoring.
- `NS="cndl"` is the key namespace prefix.

## Gotchas

- `bank.mjs` must be kept in sync with the BANK in `index.html` — they're separate copies of the same data.
- The `@netlify/blobs` imports require Netlify's runtime. They won't work outside that context.
- Cross-device play only works when deployed. Locally it falls back to in-memory local play.
- The `.gitignore` is a leftover from a Dynamics 365 AL project — not relevant to this repo.
- Questions served to multiplayer clients have answer fields stripped. Never trust client-side scoring.
- `q._raw` is set by renderers during play and consumed by `submitRound()` — don't clear it before submission.
