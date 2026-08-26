import { useEffect, useMemo, useRef, useState } from "react";
import {
  getKind,
  questionDurationMs,
  type AnyPublicQuestion,
  type AnswerFor,
  type PublicGameState,
  type PuzzleKindId,
} from "@candlelight/core";

import { KindIcon } from "../components/KindIcon.js";
import { Timer } from "../components/Timer.js";
import { PUZZLES, type PuzzleProps } from "../puzzles/index.js";

interface PlayProps {
  game: PublicGameState;
  question: AnyPublicQuestion;
  round: number;
  index: number;
  total: number;
  /** Server-clock deadline, or null when the host turned the timer off. */
  endsAt: number | null;
  now(): number;
  answeredCount: number;
  playerCount: number;
  /** True when the server already holds an answer — a refresh mid-question. */
  answered: boolean;
  /** Name shown above the question in pass-and-play. */
  whoseTurn?: string;
  onAnswer(index: number, answer: unknown, elapsedMs: number): void;
}

/**
 * One question.
 *
 * The renderer is looked up from the kind registry, so this screen never
 * grows a switch statement: adding a puzzle kind means adding a component,
 * not editing this file.
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

  // Held in a ref so the expiry effect depends on the deadline alone, rather
  // than re-arming its timer on every render of the parent.
  const answerRef = useRef(onAnswer);
  answerRef.current = onAnswer;

  // A fresh question resets the local answer state and the clock it is timed against.
  useEffect(() => {
    setLocked(answered);
    openedAt.current = now();
  }, [round, index, answered, now]);

  /**
   * Out of time.
   *
   * The empty answer still gets submitted rather than simply locking the
   * screen: it is what moves a round-paced game on to the next question, and
   * it records "no answer" rather than leaving a hole nobody can explain
   * later. The server decides what it is worth, which is nothing.
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

  const Renderer = PUZZLES[question.kind] as React.ComponentType<PuzzleProps>;

  return (
    <div className="page fade-in" key={`${round}-${index}`}>
      <div className="between">
        <span className="eyebrow row" style={{ gap: 6 }}>
          <KindIcon icon={kind.icon} size={14} />
          {kind.name}
        </span>
        <span className="eyebrow">
          {index + 1} / {total}
        </span>
      </div>

      {whoseTurn ? <h3 className="center">{whoseTurn}</h3> : null}

      <Timer endsAt={endsAt} totalMs={totalMs} now={now} />

      <div className="card">
        <Renderer question={question} locked={locked} onCommit={commit} />
      </div>

      {locked ? (
        <p className="tiny center faint">
          {game.config.pacing === "live"
            ? `${answeredCount} of ${playerCount} answered`
            : "Answer locked in."}
        </p>
      ) : null}
    </div>
  );
}
