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

**Nothing here is built from TypeScript.** Vite bundles the app, vite-node
runs the tools, Netlify bundles the functions, and the workspace packages are
consumed *from source* through their `package.json` `types` entry. So there
are no composite projects and no project references — each tsconfig checks
itself, and `npm run typecheck` runs all seven.

That is deliberate, and reverting it breaks editors. Project references make
TypeScript resolve a referenced package through its built `dist/*.d.ts`, so in
a fresh clone — before anyone runs a build — every import of `@curio/*` fails
with TS6305 or "Cannot find module". Source-only internal packages should not
be composite.

Two rules follow. A new directory of TypeScript needs its own tsconfig *and* a
line in the `typecheck` script, in the same commit; without one it is invisible
to both the editor and CI. And every tsconfig sets the `lib` it is actually
entitled to — `packages/core` gets `ES2022` with no DOM, which is what keeps
the engine honest about running on a server.

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

`gradeQuestion` and `scoreAnswer` run on the server, and so does the clock.

Live play measures from the phase's own `startedAt`. Round-paced play has no
shared deadline — everyone reaches a question at their own moment — so the
window is anchored per player instead: `begin` stamps `openedAt[index]` into
that player's record the first time they see a question, and the server
measures and enforces against that. The stamp is **first-write-wins**, which
is what stops a reload buying a fresh window, and it lives under the player's
own key, so it obeys the same rule every other write does.

A client-reported `elapsedMs` survives only as the fallback for a round-paced
answer to a question that was never opened, and even then it can only *add* a
bonus clamped to the window.

Because the window opens on sight, round-paced play puts a gate in front of
every question: it names the kind and the position and says how long the
clock will run, and `begin` fires only when the player taps through it.
Arriving on a screen must not start a clock nobody agreed to. The gate
withholds the prompt in particular — a prompt read before the clock starts is
the whole challenge given away — and the caller keys it per question (and per
player, where the device is passed around) so it resets rather than opening
once and letting the rest of the round through.

Two consequences. A deadline must never be computed at render time — that was
the old client-side `ownPaceDeadline`, and because every re-render handed out
a fresh full window, the async timer never actually expired. And opening a
question is a *write*, so it belongs in an effect keyed on the question, never
in the render that needs the deadline.

An answer past a player's own window is still recorded, scoring zero: a stored
zero tells the player they were too slow, where a dropped answer would leave
the question looking untouched and the round unable to settle.

**A round closes when every player has answered or let their window lapse.** A
lapsed question settles without anything being written for it — an unanswered
question in a revealed round already means "no answer" — so a player who
abandons a round mid-way stops holding everyone else up. But only a question
somebody actually *opened* can lapse: nothing may start a clock on a player's
behalf, so a player who never opens the rest of the round holds it open until
`roundOpenMinutes` passes or the host closes it. `roundOpenMinutes` defaults to
null, so by default that host action is the only backstop.

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
`atmosphere` — optionally with `scenery`, the objects that drift through its
background — and items keyed by puzzle kind. Register it in
`packages/content/src/index.ts`. Kinds with too few items simply do not appear,
so a partial pack is valid. `validatePack` runs over every pack in a test.

**A way of sorting.** Add a `CategorySet` to the pack's `categorySets` — an id,
a prompt in the pack's own voice, and its buckets — then tag items with
`set`. A sorting question draws from one set at a time, so houses never appear
beside continents. That narrowing is the `groupKey` hook on `PuzzleKind`: any
kind whose items only make sense beside their own group can use it, and
`availableKinds` accounts for it, so a pack with plenty of items spread thinly
across sets is correctly reported as unable to deal the kind.

**A puzzle kind.** Add the item, view, solution, and answer shapes to
`packages/core/src/types.ts`; write `packages/core/src/kinds/<id>.ts`; register
it in `kinds/index.ts`. `Registry` is a mapped type over `PuzzleKindId`, so a
missing entry is a compile error. Then add a renderer to
`apps/web/src/puzzles/` and register it in `PUZZLES` — also a mapped type, so a
kind with no screen will not compile.

**Content to an existing pack.** One file per kind under `src/items/`. There is
only one copy of the bank; the client and server both read the same package.

**A generated picture round.** Add an `imageChoice` item with an `art` block —
an id and a plain-language `subject`, nothing about style. The pack's
`art` direction supplies medium, palette and framing, so every image in a pack
looks like one set; `composePrompt` joins them and appends constraints that
hold everywhere, chief among them "no text", since a word baked into a picture
can hand over the answer. `media.src` must be `artPath(pack.id, art.id)`,
asserted in a test. Then run `npm run art`.

## Design system

`apps/web/src/design/` is the whole visual language. Screens compose its
primitives; they do not hand-roll layout.

- **Colour is derived, never authored.** A pack declares an `Atmosphere` — hue,
  mood, four signature colours, textures, display face — and `derivePalette`
  builds a Material 3 tonal ladder from it in OKLCH: surfaces, a five-step
  container ramp, and role/on/container triples that keep the author's hue but
  take their lightness from fixed tone stops. `contrastProblems` is asserted
  empty for every pack, at every mood, every 15° around the hue circle, so a
  pack cannot ship an unreadable palette. Never put raw hex in a component.
- **There are two schemes, and only one thing is true of both.** Four moods
  are dark and `bright` is light, so `TONES` holds a stop table per scheme.
  The invariant that survives the mirror is that the container ramp steps
  *from the page toward the foreground colour* — up from tone 7 toward 92 on
  a dark ground, down from 98 toward 10 on a light one. Anything phrased as
  "raised is lighter" is written against the dark scheme rather than against
  the model, and two tests said exactly that until `bright` arrived.
- **The app has a world of its own.** `HOUSE` in `design/house.ts` is what the
  shell wears before a topic is chosen — the one `bright` atmosphere, with
  confetti. The shell used to fall through to `resolvePack(undefined)`, which
  answers Hogwarts: the front door was a topic, and picking that topic
  changed nothing. `applyPack` takes `Themed` (an id and an atmosphere), which
  is all a `ContentPack` and `HOUSE` have in common.
- **Elevation is tonal, not a shadow.** A raised surface steps up the container
  ladder first; the shadow is secondary. On a dark ground that reads as lit
  rather than as a cut-out.
- **One interaction model.** Anything tappable carries `.state`, which
  composites the foreground colour over the surface at a fixed opacity on
  hover, focus, and press. Do not write per-component hover colours.
- **`Scene` is the layout.** Three zones: `rail` (context, timer), stage (the
  only scrolling region), `dock` (actions, in the thumb zone). The dock not
  moving between questions is the point.
- **Motion is springs, in four names** — `glide`, `snap`, `pounce`, `settle` in
  `design/motion.ts`. Springs because they are interruptible: a tap during an
  exit redirects rather than queueing. Everything collapses under
  `prefers-reduced-motion` via the `reduced` flag.
- **Use `m`, never `motion`.** `LazyMotion` runs in `strict` mode, so
  `motion.div` throws — it would drag the full feature bundle back into the
  first chunk. Rollup splits react / motion / app into three chunks.
- **Shared elements do the phase changes.** The option a player taps carries a
  `layoutId`, and the next screen's verdict carries the same one, so the thing
  they touched travels into the answer. That is `morphId` on `PuzzleProps`.
- **The background is flat colour and moving objects — never a gradient.** A
  wide gradient across a dark panel bands into visible steps, and the old orb
  mesh needed a tiled noise bitmap over the top to disguise that, which is
  what made it read as pixelated. Solid fills have nothing to band, so there
  is no blur and no grain. A pack declares `scenery` — a closed vocabulary in
  `packages/core` — and `SCENERY` in the web app is a mapped type over it, so
  a name added there will not compile until something draws it. **Scenery has
  no hue of its own**: every piece is an alpha veil of `--on-surface`, and
  differs from its neighbours by opacity alone, so it is only ever a
  lightening of the ground it drifts across. The pieces used to be drawn in
  the pack's signature colours, and Atlas's teal peaks washed the dock green
  every time one passed behind it.
- **The background reacts.** `Atmosphere` takes a mood read straight off the
  phase and rewrites three custom properties; `--scene-drift` scales every
  drift cycle at once. No per-frame JS, so it stays cheap on a mid-range
  Android. The two properties that transition are registered with `@property`,
  because an unregistered custom property jumps rather than interpolating.
- **The timer is a CSS animation**, offset by elapsed time so it stays locked
  to the server's deadline. The ring is an **SVG stroke**, not a
  `conic-gradient`: a conic gradient aliases along its sweep edge and the
  radial mask that cut it into a ring stair-stepped the rim. The digit runs
  for the whole question and ticks once a second — only that leaf re-renders,
  never the ring.
- **A puzzle stages; the dock submits.** `onStage` reports the answer as it
  currently stands — or `null` while it isn't one yet — and the dock's single
  Submit button is the only thing that sends it. So every kind confirms in
  the same place with the same gesture, in the thumb zone, and a mis-tap
  costs nothing until it is taken. The button renders whether or not anything
  is staged, disabled until something is, because a dock that grows a button
  under the player's thumb is worse than one that greys one out. A kind must
  therefore let a player change their mind: `OptionList` allows re-picking
  right up to the lock. `onStage` is stable across renders, so a kind whose
  answer is complete the moment it appears — `Sequence`, whose dealt order is
  already an answer — can stage from an effect. `Play` resets for a new
  question *during render*, not in an effect, because a child's mount effect
  runs first and a reset effect here would wipe that staging.
- **Gestures always have a tap fallback.** The sorter takes a drag *or* a tap
  on the bucket; a gesture nobody discovers is worse than no gesture.

**Type has three roles, and the split is the point.**

- `--font-display` is the pack's own face (Fraunces or Space Grotesk) and
  carries anything a player reads *as content*: the question, the answer
  options, the tiles they sort, and the primary button. Switching topic then
  changes how the game sounds, not just what colour it is.
- `--font-ui` is Bricolage Grotesque and carries structure: labels, hints,
  toggles, secondary and quiet buttons. It is irregular on purpose — a party
  game whose interface is set in a neutral grotesque reads like a settings
  screen.
- `--font-num` is Inter, used for figures only. A score counting up in a
  proportional face makes the row breathe in and out; tabular numerals are
  non-negotiable. Put `.num` on anything that changes in place.

Loaded from Google Fonts with real fallback stacks. The sandboxed browser used
for screenshots cannot reach them, so verify type changes by downloading the
woff2 into `apps/web/dist/` and injecting `@font-face` — otherwise you are
reviewing the fallback.

## Generated art

`npm run art` (`tools/generate-art.mts`) turns subjects into PNGs under
`apps/web/public/packs/<pack>/` using Cloudflare Workers AI. It is run by a
person, offline, with `CLOUDFLARE_API_TOKEN` in a gitignored `.env`. Nothing at
runtime — not the app, not the functions — ever sees that token or calls
Cloudflare.

- `--dry-run` prints every composed prompt and calls nothing. Use it when
  editing art direction.
- It needs `CLOUDFLARE_ACCOUNT_ID` unless the token can list accounts; the
  script says so rather than returning a bare 403.
- Seeds come from `seedForArt(id)`, so a rerun reproduces the same picture and
  regenerating one item leaves the pack alone.
- Existing files are skipped unless `--force`.
- Images are **committed to git**: builds stay deterministic, Netlify needs no
  key, and a deploy costs nothing.
- `manifest.json` beside the images records the prompt and seed behind each
  one. Nothing reads it; it exists so a picture can be traced to its words.

**What the prompt can and cannot standardise.** A diffusion model will not
reliably return a consistent size, background, or anything like a rounded
corner, so none of that is asked of it. `Plate` supplies the frame instead —
one aspect ratio, one radius, one ground built from the pack's palette, one
vignette — and crops rather than stretches whatever shape arrives. Ask the
model for the subject; let the app do the framing.

What remains genuinely variable is *style*, and no CSS fixes that: the same
style clause on "a phoenix" and on "a vast banqueting hall" returns different
lighting and detail. The levers are the pack's `art.style` clause, and keeping
a pack's subjects in one register rather than mixing objects with interiors.
A colour overlay would unify them further but is off the table — Atlas asks
players to identify flags, so the palette of an image is sometimes the
answer.

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
- No tsconfig emits anything; `tsc` is only ever a checker here.
- The pack registry is bundled into the client, so packs are plain data — never
  put logic or secrets in one.
- Local pass-and-play uses `pacing: "local"`, which is *round-paced*: it shares
  the `open`/`reveal` phases with async, not the live ones.
