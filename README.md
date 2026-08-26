# Curio

A party trivia game. Play together in the room, or a round at a time whenever
you get to it.

A curio cabinet is a case of collected oddities, and that is what this is:
every topic is a drawer. Two ship today — **Candlelight**, a wizarding-world
pack, and **Atlas**, world geography — and adding a third is adding a package,
not editing the game.

## Three ways to play

- **Live** — everyone on their own phone, all on the same question, behind one
  server-owned deadline. A short beat shows the answer, then the next question
  starts itself.
- **Round by round** — the host opens a round and shares a link. Everyone plays
  it on their own clock; it closes when the last person is in, on a deadline,
  or when the host says so.
- **Pass and play** — one device, no network at all.

## Running it

```sh
npm install
npm run dev          # the app alone; pass-and-play works, multiplayer doesn't
npm run dev:netlify  # app + functions + a local blob store
```

```sh
npm run check        # typecheck, lint, and the test suite
npm run test:e2e     # builds, then plays a live game in two real browsers
npm run art -- --dry-run   # show the image prompts; add a key to generate
```

Pulled new commits and a script says `not found`? Run `npm install` — the
workspace picked up a dependency your `node_modules` hasn't got yet.

```sh
```

Deploy by pushing to the connected Netlify site. `netlify.toml` builds the app
to `apps/web/dist` and picks up `netlify/functions`.

## Layout

| Path | What it is |
|---|---|
| `apps/web` | React 19 + Vite client, and the design system |
| `packages/core` | The engine: puzzle kinds, grading, scoring, the phase machine |
| `packages/content-*` | One topic pack per package |
| `packages/content` | The pack registry both the client and server resolve through |
| `netlify/functions` | The game API, thin I/O over the engine |

`CLAUDE.md` has the architecture in detail, including how to add a topic pack
or a new puzzle kind.

No accounts, no database. Games live in Netlify Blobs and are swept an hour
after they finish.
