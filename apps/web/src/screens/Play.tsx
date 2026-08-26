import { useEffect, useMemo, useRef, useState } from "react";
import {
  getKind,
  questionDurationMs,
  type AnswerFor,
  type AnyPublicQuestion,
  type PublicGameState,
  type PuzzleKindId,
} from "@curio/core";
import type { ComponentType } from "react";

import { KindIcon, PackProgress, Roster, Scene, TimerRing } from "../design/index.js";
import { PUZZLES, type PuzzleProps } from "../puzzles/index.js";

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
 * After answering, the dock shows who else is still thinking.
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
  const [pending, setPending] = useState<unknown>(null);
  const openedAt = useRef(now());
  const kind = getKind(question.kind);
  const roster = useMemo(
    () => Object.values(game.players).sort((a, b) => a.joinedAt - b.joinedAt),
    [game.players],
  );

  // Held in a ref so the expiry timer depends on the deadline alone, rather
  // than re-arming on every render of the parent.
  const answerRef = useRef(onAnswer);
  answerRef.current = onAnswer;

  useEffect(() => {
    setLocked(answered);
    setPending(null);
    openedAt.current = now();
  }, [round, index, answered, now]);

  /**
   * Out of time.
   *
   * The empty answer is still submitted rather than the screen simply
   * locking: it is what moves a round-paced game on, and it records "no
   * answer" instead of leaving a hole nobody can explain later.
   */
  useEffect(() => {
    if (endsAt == null || locked) return;

    const expire = () => {
      setLocked(true);
      setPending(null);
      answerRef.current(index, null, Math.max(0, now() - openedAt.current));
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

  /**
   * Stage an answer for explicit submission.
   *
   * Kinds that need a lock-in button (match, sequence, etc.) call this
   * directly. Kinds that auto-commit on selection also call this — the
   * player then taps "Submit" in the dock to actually send it.
   */
  const commit = (answer: AnswerFor[PuzzleKindId]) => {
    if (locked) return;
    setPending(answer);
  };

  /** Send the staged answer to the server. */
  const submitPending = () => {
    if (pending == null || locked) return;
    setLocked(true);
    onAnswer(index, pending, Math.max(0, now() - openedAt.current));
    setPending(null);
  };

  const Renderer = PUZZLES[question.kind] as ComponentType<PuzzleProps>;

  const waitingOn = roster.length - answeredCount;

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
          {pending != null && !locked ? (
            <button
              type="button"
              className="button state"
              onClick={submitPending}
            >
              Submit
            </button>
          ) : locked && !answered ? (
            <div className="stack--tight">
              <p className="tiny faint center">
                {game.config.pacing === "live"
                  ? `${answeredCount} of ${playerCount} in · ${waitingOn} left`
                  : "Locked until the round closes."}
              </p>
              {game.config.pacing === "live" && waitingOn > 0 ? (
                <Roster
                  players={roster}
                  meId={meId}
                  doneIds={new Set(
                    roster
                      .filter((p) => game.players[p.id]?.rounds[round]?.answers[index])
                      .map((p) => p.id),
                  )}
                  now={now()}
                />
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
        onCommit={commit}
        morphId={`answer-${round}-${index}`}
      />
    </Scene>
  );
}
