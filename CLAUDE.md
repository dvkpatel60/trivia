# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` is a pointer to this file. Keep guidance here.

## What this is

Curio: a party trivia game with three ways to play, and topics that ship as
packages. React 19 + Vite client, Netlify Functions backend, npm workspaces,
TypeScript throughout. No accounts and no database — games live in Netlify
Blobs.

## Commands

```sh
npm install
npm run dev          # app only; pass-and-play works, multiplayer needs the functions
npm run dev:netlify  # netlify dev: app + functions + local blobs
npm run check        # typecheck + lint + tests, what CI would run
npm test             # vitest, everything except the browser suite
npm run test:e2e     # builds, then plays a live game in two real browsers
npm run build        # every workspace; the app lands in apps/web/dist
```

Run a single test file with `npx vitest run packages/core/src/__tests__/flow.test.ts`,
or one case with `-t "closes the question once everyone has answered"`.

`npx tsc --build` typechecks the workspace graph; the functions are checked
separately with `npx tsc -p netlify/tsconfig.json` because they are not part
of it.

## The shape of it

```
packages/core          the engine — no React, no network, no Netlify
packages/content-*     one topic pack per package, data only
packages/content       the registry both client and server resolve through
netlify/functions      the game API: thin I/O over the engine
netlify/lib            blob storage layout
apps/web               React client and the design system
```

The dependency arrow only ever points at `core`. Packs import types from it;
nothing imports a pack except the registry.

## Ideas worth understanding before changing anything

### Answers cannot leak

Every secret a question holds lives under one `solution` key. Publishing to a
client is `toPublicQuestion`, which omits exactly that key — there is no
denylist of field names for a new kind to forget. `toPublicGame` is the same
idea for whole games, and adds prose answers only once a round is revealed.
Tests assert the serialized payload contains no `"solution"`.

If you add state to a question, decide which side of that line it sits on.

### The phase machine owns the game

A game is always in exactly one `Phase`, and the phase carries its own
deadline. Clients render from `phase` alone. Two pacings share the machine:

- **live** — `question → beat → … → standings → question(next round) → final`
- **async / local** — `open → reveal → open → … → final`

Nothing schedules anything: Netlify has no cron per game, so **phases advance
lazily on read**. Whoever polls past a deadline advances the machine and
writes it back. A cascade is anchored to the *deadline*, not to now, so a game
nobody looked at for ten minutes fast-forwards correctly.

`advance()` is idempotent-by-construction, which matters because any request
can be the one that moves a game.

### Storage is split because Blobs cannot compare-and-swap

`@netlify/blobs@8` has no `onlyIfMatch`. No conditional write means no CAS and
no lock, so a single game blob would lose writes whenever two players answered
at once — which in live play is most of the time.

The layout is the fix:

```
g/<CODE>          lifecycle: phase, config, questions, roster
g/<CODE>/p/<ID>   one player's answers and score
```

**A player's key is written by that player alone.** The lifecycle key is
written by host actions and by whichever request advances the phase — and
those transitions are deterministic given the same input state, questions
included, because rounds are dealt from `seedFor(code, round)`. Two requests
racing therefore compute the same next state, so last-write-wins is not lossy.

Two consequences to preserve:

- Nothing may write another player's record. That is why closing a round does
  **not** write zeros into everyone who missed a question — an absent answer in
  a revealed round already means "no answer".
- Streaks are therefore *derived* (`streakBefore`) from a player's own answer
  history rather than stored as a counter someone else could zero.

If Blobs ever gains conditional writes, this collapses back to one key.

### Submissions are idempotent without tokens

An answer is keyed by (player, round, question index). A retry names the same
triple, the server sees that index is already graded, and returns the stored
result. Never make grading depend on request identity.

### The client never decides anything that scores

`gradeQuestion` and `scoreAnswer` run on the server. In live play the server
also measures elapsed time itself, since it knows when the question opened; a
client-reported `elapsedMs` is only trusted in round-paced play, where it can
only ever *add* a speed bonus clamped to the question's own window.

### One engine, two transports

`Transport` (`apps/web/src/net/`) has two implementations: `remote`
(long-polling the function) and `local` (running the engine in the tab). The
screens cannot tell them apart, so pass-and-play cannot drift away from online
play. Add a realtime provider by adding a file here, not by touching screens.

Long-polling: `state` takes `since` and `wait`. The function holds ~6.5s,
watching a cheap signature built from blob etags, and only pays for a full
read when something moved or a deadline came due. Netlify's default function
timeout is 10s — do not raise the hold near it.

## Adding things

**A topic pack.** Copy `packages/content-atlas`. It needs an `id`, copy, an
`atmosphere`, and items keyed by puzzle kind. Register it in
`packages/content/src/index.ts`. Kinds with too few items simply do not appear,
so a partial pack is valid. `validatePack` runs over every pack in a test.

**A puzzle kind.** Add the item, view, solution, and answer shapes to
`packages/core/src/types.ts`; write `packages/core/src/kinds/<id>.ts`; register
it in `kinds/index.ts`. `Registry` is a mapped type over `PuzzleKindId`, so a
missing entry is a compile error. Then add a renderer to
`apps/web/src/puzzles/` and register it in `PUZZLES` — also a mapped type, so a
kind with no screen will not compile.

**Content to an existing pack.** One file per kind under `src/items/`. There is
only one copy of the bank; the client and server both read the same package.

## Design system

`apps/web/src/design/` is the whole visual language. Screens compose its
primitives; they do not hand-roll layout.

- **Colour is derived, never authored.** A pack declares an `Atmosphere` — hue,
  mood, four signature colours, textures, display face — and `derivePalette`
  produces an OKLCH ramp from it. `contrastProblems` is asserted empty for
  every pack, at every mood, across the hue circle, so a pack cannot ship an
  unreadable palette. Do not add raw hex to a component; use the tokens.
- **`Scene` is the layout.** Three zones: `rail` (context, timer), stage (the
  only scrolling region), `dock` (actions, in the thumb zone). The dock not
  moving between questions is the point.
- **Motion is four names** — `enter`, `rise`, `pop`, `sweep` — on one set of
  easing curves in `tokens.css`. Everything collapses under
  `prefers-reduced-motion`.
- **The timer is a CSS animation**, offset by elapsed time so it stays locked
  to the server's deadline. It renders once per question. Do not reintroduce a
  per-tick React countdown; only the last five seconds mount a digit.

Type is Fraunces / Space Grotesk for display (per pack) and Inter for UI, from
Google Fonts, with real fallback stacks.

## Testing layers

1. `packages/core/src/__tests__` — the engine alone: kinds, grading, scoring,
   both pacings end to end, colour and contrast.
2. `packages/content/src/__tests__` — every pack validates, deals, grades, and
   passes contrast.
3. `netlify/tests/game.test.mts` — the function over an in-memory blob store
   that **deliberately lacks conditional writes**, because the real one does.
   Do not give the fake an `onlyIfMatch`.
4. `netlify/tests/e2e.test.mts` — two real browsers, one live game, real HTTP.
   Excluded from `npm test`; run it with `npm run test:e2e`, which builds first
   so it cannot test a stale bundle.

## Gotchas

- `@netlify/blobs` only works inside Netlify's runtime; the functions cannot
  run under plain `node`.
- `apps/web` emits declarations only (`emitDeclarationOnly`); the real build is
  Vite. Don't lint `dist-types`.
- The pack registry is bundled into the client, so packs are plain data — never
  put logic or secrets in one.
- Local pass-and-play uses `pacing: "local"`, which is *round-paced*: it shares
  the `open`/`reveal` phases with async, not the live ones.
