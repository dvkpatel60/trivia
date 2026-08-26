import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getKind,
  isErrorResponse,
  questionDurationMs,
  type ContentPack,
  type GameConfig,
  type PublicGameState,
} from "@curio/core";
import { resolvePack } from "@curio/content";

import { createLocalTransport } from "./net/local.js";
import { createRemoteTransport } from "./net/remote.js";
import type { Transport } from "./net/transport.js";
import { loadIdentity, saveIdentity, type Identity } from "./state/identity.js";
import { useSession } from "./state/session.js";
import { useToast } from "./state/useToast.js";
import { domMax, LazyMotion } from "motion/react";

import { applyPack, Atmosphere, Scene, Wordmark, type AtmosphereMood } from "./design/index.js";

import { Beat } from "./screens/Beat.js";
import { Final } from "./screens/Final.js";
import { Home } from "./screens/Home.js";
import { Join } from "./screens/Join.js";
import { Library } from "./screens/Library.js";
import { Lobby } from "./screens/Lobby.js";
import { Pass } from "./screens/Pass.js";
import { Play } from "./screens/Play.js";
import { Reveal } from "./screens/Reveal.js";
import { Setup } from "./screens/Setup.js";
import { Standings } from "./screens/Standings.js";
import { Waiting } from "./screens/Waiting.js";

type Route = "home" | "join" | "host" | "local" | "library" | "game";

/**
 * `domMax` is the feature set including layout animation and drag, which the
 * scoreboard and the sorter card both need. `LazyMotion` with `strict` also
 * means every component uses `m` rather than `motion`, so nothing silently
 * pulls the full bundle back in.
 */

/** Is there a server at all? Pass-and-play works either way. */
async function probeOnline(): Promise<boolean> {
  try {
    const response = await fetch("/.netlify/functions/game", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "state", code: "__probe__" }),
    });
    // A 404 from a static host looks nothing like a 404 from the function,
    // which answers in its own shape — so check the body, not the status.
    const body = (await response.json()) as { code?: string };
    return typeof body?.code === "string";
  } catch {
    return false;
  }
}

export function App() {
  const [identity, setIdentity] = useState<Identity>(() => loadIdentity());
  const [route, setRoute] = useState<Route>("home");
  const [online, setOnline] = useState(true);
  const [booted, setBooted] = useState(false);
  const [prefill, setPrefill] = useState<string | null>(null);
  const [previewPackId, setPreviewPackId] = useState<string | null>(null);
  const [toast, showToast] = useToast();

  const remote = useMemo(() => createRemoteTransport(), []);
  const local = useMemo(() => createLocalTransport(), []);
  const [transport, setTransport] = useState<Transport>(remote);
  const [code, setCode] = useState<string | null>(null);

  const session = useSession(transport, code, identity.id);
  const { game } = session;

  /** Pass-and-play: whose turn it is, and whether they've picked the device up. */
  const [turn, setTurn] = useState({ playerIndex: 0, ready: false });

  const persist = useCallback((next: Identity) => {
    setIdentity(next);
    saveIdentity(next);
  }, []);

  /* ── boot: deep link, then resume, then home ── */

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const reachable = await probeOnline();
      if (cancelled) return;
      setOnline(reachable);

      const deepLink = new URLSearchParams(location.search).get("code")?.trim().toUpperCase();
      if (deepLink) {
        // Cleared so a refresh doesn't re-trigger the join.
        history.replaceState(null, "", location.pathname);
        setPrefill(deepLink);
        setRoute("join");
      }
      setBooted(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── the world follows whichever pack is in play ── */

  const pack: ContentPack = useMemo(
    () => resolvePack(game?.config.packId ?? previewPackId ?? undefined),
    [game?.config.packId, previewPackId],
  );

  useEffect(() => {
    applyPack(pack);
  }, [pack]);

  /** What the background should be doing, read straight off the phase. */
  const mood: AtmosphereMood = useMemo(() => {
    const phase = game?.phase.name;
    if (!phase || phase === "lobby") return "idle";
    if (phase === "final") return "final";
    if (phase === "question" || phase === "open") return "playing";
    return "beat";
  }, [game?.phase.name]);

  /**
   * One bloom when the player's own answer lands right. Keyed on the
   * question, so it fires once and re-fires on the next one.
   */
  const bloomKey = useMemo(() => {
    if (!game) return null;
    const round = "round" in game.phase ? game.phase.round : null;
    if (round == null) return null;
    const answers = game.players[identity.id]?.rounds[round]?.answers ?? {};
    const latest = Object.entries(answers)
      .map(([index, result]) => ({ index: Number(index), result }))
      .sort((a, b) => b.result.at - a.result.at)[0];
    if (!latest || latest.result.fraction < 0.999) return null;
    return `${round}-${latest.index}`;
  }, [game, identity.id]);

  /**
   * The edge bloom during a live question. Only live play has a deadline
   * everyone shares, so it is the only place time pressure is ambient.
   */
  const pressure = useMemo(() => {
    if (!game || game.phase.name !== "question" || game.phase.endsAt == null) return null;
    const question = game.rounds[game.phase.round]?.questions[game.phase.index];
    if (!question || !game.config.timerOn) return null;
    return {
      endsAt: game.phase.endsAt,
      totalMs: questionDurationMs(game.config, getKind(question.kind).timeMultiplier),
      now: session.now(),
    };
    // Recomputed when the question changes, not on every tick — the bloom is
    // a CSS animation from there on.
  }, [game, session]);

  /* ── actions ── */

  const enter = useCallback(
    (nextCode: string, nextTransport: Transport) => {
      setTransport(nextTransport);
      setCode(nextCode);
      setRoute("game");
      if (nextTransport.kind === "remote") persist({ ...identity, code: nextCode });
    },
    [identity, persist],
  );

  const leave = useCallback(() => {
    if (code && transport.kind === "remote") {
      void transport.send({ op: "leave", code, playerId: identity.id });
    }
    setCode(null);
    setPreviewPackId(null);
    setRoute("home");
    persist({ ...identity, code: null });
  }, [code, transport, identity, persist]);

  const host = useCallback(
    async (config: GameConfig) => {
      const response = await remote.send({
        op: "create",
        hostId: identity.id,
        hostName: identity.name,
        config,
      });
      if (isErrorResponse(response) || !("code" in response)) {
        showToast(isErrorResponse(response) ? response.error : "Couldn't open a game.");
        return;
      }
      enter(response.code, remote);
    },
    [remote, identity, enter, showToast],
  );

  const join = useCallback(
    async (target: string) => {
      const response = await remote.send({
        op: "join",
        code: target,
        playerId: identity.id,
        playerName: identity.name,
      });
      if (isErrorResponse(response)) {
        showToast(response.error);
        return;
      }
      enter(target, remote);
    },
    [remote, identity, enter, showToast],
  );

  const startLocal = useCallback(
    async (config: GameConfig, names: string[]) => {
      const created = await local.send({
        op: "create",
        hostId: identity.id,
        hostName: names[0] ?? "Player 1",
        config: { ...config, pacing: "local" },
      });
      if (isErrorResponse(created) || !("code" in created)) {
        showToast("Couldn't set that up.");
        return;
      }

      for (let index = 1; index < names.length; index++) {
        await local.send({
          op: "join",
          code: created.code,
          playerId: `local-${index}`,
          playerName: names[index] ?? `Player ${index + 1}`,
        });
      }
      await local.send({ op: "start", code: created.code, hostId: identity.id });

      setTurn({ playerIndex: 0, ready: !config.passScreen });
      enter(created.code, local);
    },
    [local, identity, enter, showToast],
  );

  const body = (() => {
    if (!booted) {
      return (
        <Scene id="boot">
          <div className="splash splash--solo">
            <Wordmark />
            <p className="lede">Opening the cabinet…</p>
          </div>
        </Scene>
      );
    }

    if (route === "home") {
      return (
        <Home
          name={identity.name}
          onName={(name) => persist({ ...identity, name })}
          resumeCode={identity.code}
          onResume={() => identity.code && enter(identity.code, remote)}
          onHost={() => setRoute("host")}
          onJoin={() => setRoute("join")}
          onLocal={() => setRoute("local")}
          onLibrary={() => setRoute("library")}
          online={online}
        />
      );
    }

    if (route === "join") {
      return (
        <Join
          initialCode={prefill}
          name={identity.name}
          onName={(name) => persist({ ...identity, name })}
          onJoin={join}
          onBack={() => setRoute("home")}
          trouble={session.trouble}
        />
      );
    }

    if (route === "library") {
      return (
        <Library
          onBack={() => {
            setPreviewPackId(null);
            setRoute("home");
          }}
          onPreview={setPreviewPackId}
        />
      );
    }

    if (route === "host" || route === "local") {
      return (
        <Setup
          local={route === "local"}
          onStart={route === "local" ? startLocal : (config) => host(config)}
          onBack={() => {
            setPreviewPackId(null);
            setRoute("home");
          }}
          onPreview={setPreviewPackId}
        />
      );
    }

    if (!game) {
      return (
        <Scene
          id="connecting"
          dock={
            <button type="button" className="button button--quiet state" onClick={leave}>
              Back to the start
            </button>
          }
        >
          <div className="splash splash--solo">
            <Wordmark variant="compact" />
            <p className="lede">{session.trouble ?? "Finding the game…"}</p>
          </div>
        </Scene>
      );
    }

    return (
      <GameScreen
        game={game}
        identity={identity}
        session={session}
        turn={turn}
        setTurn={setTurn}
        onLeave={leave}
        onToast={showToast}
      />
    );
  })();

  return (
    <LazyMotion features={domMax} strict>
      <Atmosphere
        textures={pack.atmosphere.texture}
        mood={mood}
        pressure={pressure}
        bloomKey={bloomKey}
      />
      {body}
      {toast ? <div className="toast">{toast}</div> : null}
    </LazyMotion>
  );
}

/* ── the in-game router ───────────────────────────────────────────────── */

interface GameScreenProps {
  game: PublicGameState;
  identity: Identity;
  session: ReturnType<typeof useSession>;
  turn: { playerIndex: number; ready: boolean };
  setTurn(turn: { playerIndex: number; ready: boolean }): void;
  onLeave(): void;
  onToast(message: string): void;
}

/**
 * Which screen a phase means.
 *
 * The server owns the phase, so this is a lookup rather than a decision — no
 * client has to work out from timers and answer counts what everyone else is
 * looking at.
 */
function GameScreen({ game, identity, session, turn, setTurn, onLeave, onToast }: GameScreenProps) {
  const { phase } = game;
  const isHost = game.hostId === identity.id;
  const isLocal = game.config.pacing === "local";

  const roster = useMemo(
    () => Object.values(game.players).sort((a, b) => a.joinedAt - b.joinedAt),
    [game.players],
  );

  /** In pass-and-play the "me" who answers is whoever's turn it is. */
  const activeId = isLocal ? (roster[turn.playerIndex]?.id ?? identity.id) : identity.id;

  const answersFor = (round: number, playerId: string) =>
    game.players[playerId]?.rounds[round]?.answers ?? {};

  const submit = useCallback(
    async (round: number, index: number, answer: unknown, elapsedMs: number) => {
      const response = await session.send({
        op: "submit",
        code: game.code,
        playerId: activeId,
        round,
        answers: { [index]: { answer, elapsedMs } },
      });
      if (isErrorResponse(response)) onToast(response.error);
    },
    [session, game.code, activeId, onToast],
  );

  const advance = useCallback(async () => {
    const response = await session.send({ op: "advance", code: game.code, hostId: identity.id });
    if (isErrorResponse(response)) onToast(response.error);
  }, [session, game.code, identity.id, onToast]);

  const waiting = (
    <Scene id="settling">
      <div className="splash splash--solo">
        <span className="ember" />
      </div>
    </Scene>
  );

  if (phase.name === "lobby") {
    return (
      <Lobby
        game={game}
        meId={identity.id}
        now={session.now()}
        onStart={async () => {
          const response = await session.send({ op: "start", code: game.code, hostId: identity.id });
          if (isErrorResponse(response)) onToast(response.error);
        }}
        onLeave={onLeave}
        onCopied={onToast}
      />
    );
  }

  if (phase.name === "final") return <Final game={game} meId={identity.id} onHome={onLeave} />;

  if (phase.name === "standings") {
    return (
      <Standings
        game={game}
        meId={identity.id}
        round={phase.round}
        isHost={isHost}
        onSkip={() => void advance()}
      />
    );
  }

  if (phase.name === "beat") {
    return <Beat game={game} meId={identity.id} round={phase.round} index={phase.index} />;
  }

  if (phase.name === "reveal") {
    return (
      <Reveal
        game={game}
        meId={identity.id}
        round={phase.round}
        onNext={async () => {
          // Pass-and-play starts the next round back at the first player.
          setTurn({ playerIndex: 0, ready: !game.config.passScreen });
          await advance();
        }}
        onLeave={onLeave}
      />
    );
  }

  if (phase.name === "question") {
    const question = game.rounds[phase.round]?.questions[phase.index];
    if (!question) return waiting;

    const mine = answersFor(phase.round, identity.id);
    const answeredCount = roster.filter(
      (player) => answersFor(phase.round, player.id)[phase.index],
    ).length;

    return (
      <Play
        game={game}
        question={question}
        round={phase.round}
        index={phase.index}
        total={game.rounds[phase.round]?.questions.length ?? 1}
        endsAt={phase.endsAt}
        now={session.now}
        answered={Boolean(mine[phase.index])}
        answeredCount={answeredCount}
        playerCount={roster.length}
        onAnswer={(index, answer, elapsedMs) => void submit(phase.round, index, answer, elapsedMs)}
      />
    );
  }

  /* ── an open round, played at your own pace ── */

  const round = phase.round;
  const questions = game.rounds[round]?.questions ?? [];
  const answers = answersFor(round, activeId);
  const cursor = questions.findIndex((_, index) => !answers[index]);

  /** Each player's window starts when they reach the question. */
  const ownPaceDeadline = (kindIndex: number): number | null => {
    const question = questions[kindIndex];
    if (!question || !game.config.timerOn) return null;
    return session.now() + questionDurationMs(game.config, getKind(question.kind).timeMultiplier);
  };

  if (isLocal) {
    const player = roster[turn.playerIndex];
    if (!player) {
      if (phase.name === "open") void advance();
      return waiting;
    }

    if (!turn.ready) {
      return (
        <Pass name={player.name} round={round} onReady={() => setTurn({ ...turn, ready: true })} />
      );
    }

    if (cursor === -1) {
      // This player is done — hand the device on. After the last one the
      // engine closes the round itself, since everyone has now answered.
      const next = turn.playerIndex + 1;
      queueMicrotask(() => {
        if (next < roster.length) setTurn({ playerIndex: next, ready: !game.config.passScreen });
        else if (game.phase.name === "open") void advance();
      });
      return waiting;
    }

    const question = questions[cursor];
    if (!question) return waiting;

    return (
      <Play
        game={game}
        question={question}
        round={round}
        index={cursor}
        total={questions.length}
        endsAt={ownPaceDeadline(cursor)}
        now={session.now}
        answered={false}
        answeredCount={0}
        playerCount={roster.length}
        whoseTurn={player.name}
        onAnswer={(index, answer, elapsedMs) => void submit(round, index, answer, elapsedMs)}
      />
    );
  }

  if (cursor === -1) {
    return (
      <Waiting
        game={game}
        meId={identity.id}
        round={round}
        endsAt={phase.endsAt}
        now={session.now}
        onClose={advance}
        onLeave={onLeave}
      />
    );
  }

  const question = questions[cursor];
  if (!question) return waiting;

  return (
    <Play
      game={game}
      question={question}
      round={round}
      index={cursor}
      total={questions.length}
      endsAt={ownPaceDeadline(cursor)}
      now={session.now}
      answered={false}
      answeredCount={0}
      playerCount={roster.length}
      onAnswer={(index, answer, elapsedMs) => void submit(round, index, answer, elapsedMs)}
    />
  );
}
