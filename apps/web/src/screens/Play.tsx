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

import { KindIcon, Scene, TimerRing } from "../design/index.js";
import { PUZZLES, type PuzzleProps } from "../puzzles/index.js";

interface PlayProps {
  game: PublicGameState;
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
 */
export function Play({
  game,
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
  const openedAt = useRef(now());
  const kind = getKind(question.kind);

  // Held in a ref so the expiry timer depends on the deadline alone, rather
  // than re-arming on every render of the parent.
  const answerRef = useRef(onAnswer);
  answerRef.current = onAnswer;

  useEffect(() => {
    setLocked(answered);
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

  const commit = (answer: AnswerFor[PuzzleKindId]) => {
    if (locked) return;
    setLocked(true);
    onAnswer(index, answer, Math.max(0, now() - openedAt.current));
  };

  const Renderer = PUZZLES[question.kind] as ComponentType<PuzzleProps>;

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
            <span className="dots" aria-label={`Question ${index + 1} of ${total}`}>
              {Array.from({ length: total }, (_, position) => (
                <span
                  key={position}
                  data-state={position < index ? "done" : position === index ? "now" : "todo"}
                />
              ))}
            </span>
            <TimerRing endsAt={endsAt} totalMs={totalMs} now={now} />
          </span>
        </>
      }
      dock={
        locked ? (
          <p className="tiny faint center">
            {game.config.pacing === "live"
              ? `${answeredCount} of ${playerCount} in`
              : "Sealed."}
          </p>
        ) : whoseTurn ? (
          <p className="tiny faint center">{whoseTurn}'s turn</p>
        ) : null
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
