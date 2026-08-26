import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getKind,
  questionDurationMs,
  type AnyPublicQuestion,
  type PublicGameState,
} from "@curio/core";
import type { ComponentType } from "react";

import { KindIcon, PackProgress, Roster, Scene, TimerRing } from "../design/index.js";
import { PUZZLES, type PuzzleProps } from "../puzzles/index.js";

/** Nobody in this list has answered, so every row reads the same way. */
const NOBODY_IN: ReadonlySet<string> = new Set();

interface PlayProps {
  game: PublicGameState;
  meId: string;
  question: AnyPublicQuestion;
  round: number;
  index: number;
  total: number;
  endsAt: number | null;
  now(): number;
  answeredCount: number;
  playerCount: number;
  answered: boolean;
  /** Named in pass-and-play, so nobody answers on somebody else's behalf. */
  whoseTurn?: string;
  onAnswer(index: number, answer: unknown, elapsedMs: number): void;
}

/**
 * One question.
 *
 * The renderer comes from the kind registry, so this file never grows a
 * switch: a new puzzle kind is a new component, not an edit here.
 *
 * Answering is two steps, and the split is deliberate. A puzzle only ever
 * *stages* what the player has built; the dock's Submit is the one thing
 * that sends it. So the confirming gesture is in the same place for every
 * kind, in the thumb zone, and a mis-tap costs nothing until it is taken.
 */
export function Play({
  game,
  meId,
  question,
  round,
  index,
  total,
  endsAt,
  now,
  answeredCount,
  playerCount,
  answered,
  whoseTurn,
  onAnswer,
}: PlayProps) {
  const [locked, setLocked] = useState(answered);
  const [staged, setStaged] = useState<unknown>(null);
  const openedAt = useRef(now());
  const kind = getKind(question.kind);

  // Held in refs so the expiry timer and the staging callback depend on the
  // deadline alone, rather than re-arming on every render of the parent.
  const answerRef = useRef(onAnswer);
  answerRef.current = onAnswer;
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  /**
   * Stable for the life of the screen, so a puzzle may list it as an effect
   * dependency without the effect re-firing on every poll. `session` is
   * rebuilt on each state update, and an effect that re-fires on that is how
   * an unbounded render loop starts.
   */
  const stage = useCallback((answer: unknown) => {
    if (lockedRef.current) return;
    setStaged(answer ?? null);
  }, []);

  /**
   * Start of a new question, done during render rather than in an effect.
   *
   * A child's mount effect runs *before* the parent's, so a kind that stages
   * as soon as it appears — Sequence, whose dealt order is already a
   * complete answer — would have that staging wiped by a reset effect here
   * and could never be submitted. Adjusting state while rendering on a
   * changed key is the pattern that has no such ordering to lose.
   */
  const key = `${round}:${index}`;
  const [current, setCurrent] = useState(key);
  if (current !== key) {
    setCurrent(key);
    setLocked(answered);
    setStaged(null);
    openedAt.current = now();
  }

  // The server confirming an answer locks the screen. It never unlocks one:
  // that only happens on a new question, above.
  useEffect(() => {
    if (answered) setLocked(true);
  }, [answered]);

  const submit = useCallback(() => {
    if (staged == null || lockedRef.current) return;
    setLocked(true);
    answerRef.current(index, staged, Math.max(0, now() - openedAt.current));
  }, [staged, index, now]);

  /**
   * Out of time.
   *
   * Whatever is staged goes in rather than being thrown away — a player who
   * picked and then ran the clock down deciding should not be punished for
   * the deliberation they were invited to do. An empty answer is still
   * submitted when nothing is staged: it is what moves a round-paced game
   * on, and it records "no answer" instead of leaving a hole nobody can
   * explain later.
   */
  const stagedRef = useRef(staged);
  stagedRef.current = staged;

  useEffect(() => {
    if (endsAt == null || locked) return;

    const expire = () => {
      setLocked(true);
      answerRef.current(index, stagedRef.current ?? null, Math.max(0, now() - openedAt.current));
    };

    const remaining = endsAt - now();
    if (remaining <= 0) {
      expire();
      return;
    }
    const timer = window.setTimeout(expire, remaining);
    return () => window.clearTimeout(timer);
  }, [endsAt, locked, now, index]);

  const totalMs = useMemo(
    () => (game.config.timerOn ? questionDurationMs(game.config, kind.timeMultiplier) : null),
    [game.config, kind.timeMultiplier],
  );

  const roster = useMemo(
    () => Object.values(game.players).sort((a, b) => a.joinedAt - b.joinedAt),
    [game.players],
  );

  /**
   * Who is still thinking, by name.
   *
   * A count alone tells you the round is stuck but not on whom, which in a
   * room of friends is the only part anybody cares about. Only the
   * outstanding players are listed: the dock is the thumb zone, not a
   * scoreboard, and the people already in are not what anyone is waiting to
   * read. Live play only — round-paced play has its own waiting screen.
   */
  const outstanding = useMemo(
    () => roster.filter((player) => !player.rounds[round]?.answers[index]),
    [roster, round, index],
  );

  const Renderer = PUZZLES[question.kind] as ComponentType<PuzzleProps>;
  const live = game.config.pacing === "live";
  const waitingOn = playerCount - answeredCount;

  return (
    <Scene
      id={`play-${round}-${index}`}
      flow="end"
      rail={
        <>
          <span className="eyebrow">
            <KindIcon icon={kind.icon} size={13} />
            {kind.name}
          </span>
          <span className="row">
            <PackProgress total={total} done={index} size={8} className="play-progress" />
            <TimerRing endsAt={endsAt} totalMs={totalMs} now={now} />
          </span>
        </>
      }
      dock={
        <>
          {/*
            Rendered whether or not anything is staged, so the dock does not
            grow a button under the player's thumb the moment they pick.
          */}
          <button
            type="button"
            className="button state"
            disabled={locked || staged == null}
            onClick={submit}
          >
            {locked ? "Answer in" : "Submit"}
          </button>

          {locked ? (
            <div className="stack--tight">
              <p className="tiny faint center">
                {live
                  ? waitingOn > 0
                    ? `Waiting on ${waitingOn} of ${playerCount}`
                    : "Everyone's in"
                  : "Locked until the round closes."}
              </p>
              {live && outstanding.length > 0 ? (
                <div className="dock-roster">
                  <Roster players={outstanding} meId={meId} doneIds={NOBODY_IN} now={now()} />
                </div>
              ) : null}
            </div>
          ) : whoseTurn ? (
            <p className="tiny faint center">{whoseTurn}'s turn</p>
          ) : null}
        </>
      }
    >
      <Renderer
        question={question}
        locked={locked}
        onStage={stage}
        onSubmit={submit}
        morphId={`answer-${round}-${index}`}
      />
    </Scene>
  );
}
