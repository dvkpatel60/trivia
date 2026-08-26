# Lively UI — design

Date: 2026-08-26

Six complaints, three root causes. Recorded before implementation so the
reasoning survives the diff.

## Diagnosis

**"Pixelated" is gradient banding, in two places.**

- The timer ring (`components.css`) drew a `conic-gradient` under a
  `radial-gradient(circle, transparent 60%, black 61%)` mask. Conic gradients
  alias along the sweep edge and a 1%-wide mask boundary stair-steps the rim.
- `atmosphere.css` drew three `radial-gradient` orbs under `filter: blur(58px)`
  and then tiled an SVG turbulence bitmap (`tex-grain`) at
  `mix-blend-mode: overlay` to hide the banding those orbs produced. The grain
  reads as noise, which is the "pixelated, not material" complaint exactly.

**The podium bar was not data.** `Final.tsx` hardcoded `HEIGHTS = [136, 104, 84]`
by *rank*, so a blowout and a one-point win drew the same chart.

**Time taken was not recoverable.** `engine.ts` computes `elapsedMs`, spends it
on the speed bonus, then discards it — `AnswerResult` never stored it.

## Decisions

| Question | Chosen |
|---|---|
| Background objects | Literal per-pack objects, solid fills |
| Gradient removal scope | Backgrounds and timer only; podium/Plate/bloom/elevation untouched |
| Screen space | Big screens — `--page: 34rem` capped the app at phone width everywhere |

## The work

1. **Scenery.** New closed union `Scenery` in `packages/core/src/atmosphere.ts`.
   Packs declare `scenery: Scenery[]` (optional, defaulted) and stay pure data.
   The web app holds `SCENERY: Record<Scenery, ComponentType>` — a mapped type,
   so a kind with no renderer is a compile error, matching `PUZZLES`/`Registry`.
   Orbs and blur are deleted; `emberGlow`/`horizonGlow` become flat colour.
   `grain` comes off both packs: it existed only to mask the banding being
   removed.

2. **Timer.** SVG `<circle>` with `stroke-dasharray`, animated on
   `stroke-dashoffset`. Digits show for the whole question at a 1s tick.
   This overrides CLAUDE.md's "only the last five seconds mount a digit" and
   "no per-tick React countdown" — updated in the same commit. The drain stays
   a CSS animation; only a leaf span re-renders.

3. **Podium.** Height becomes `score / topScore` with a floor. Candlelight gets
   a candle (wax column = score, lit flame); Atlas a peak with a summit flag.
   Dispatched via the existing `usePack()` pattern.

4. **Time taken.** `elapsedMs` added to `AnswerResult`; set in `engine.ts` from
   the value already computed. Rendered in `Reveal` as `+150 · 4.2s`. It is the
   player's own record, so `toPublicGame` is unchanged and nothing leaks.

5. **Centred inputs.** `text-align: center` on `.input`, matching `.button`.

6. **Big screens.** `--page` responsive; at >=900px landscape `data-flow="end"`
   splits prompt-left / options-right and the prompt steps up a size.

## Constraints held

- No raw hex in components; scenery colours come from palette tokens, so
  `contrastProblems` stays satisfied for every pack at every mood.
- `packages/core` keeps `lib: ES2022`, no DOM.
- Answer secrecy unchanged — no new field crosses the `solution` line.
- Verified with `npm run check` before any claim of completion.
