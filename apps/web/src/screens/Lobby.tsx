import { useState } from "react";
import { ranked, type PublicGameState } from "@candlelight/core";

import { Players } from "../components/Players.js";

interface LobbyProps {
  game: PublicGameState;
  meId: string;
  now: number;
  onStart(): Promise<void>;
  onLeave(): void;
  onCopied(message: string): void;
}

export function Lobby({ game, meId, now, onStart, onLeave, onCopied }: LobbyProps) {
  const [busy, setBusy] = useState(false);
  const isHost = game.hostId === meId;
  const players = ranked(game.players).sort((a, b) => a.joinedAt - b.joinedAt);

  const share = async () => {
    const url = `${location.origin}${location.pathname}?code=${game.code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Candlelight", text: `Join my game: ${game.code}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      onCopied("Link copied");
    } catch {
      onCopied(game.code);
    }
  };

  const start = async () => {
    setBusy(true);
    try {
      await onStart();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page fade-in">
      <div className="between">
        <span className="eyebrow">Lobby</span>
        <span className="badge live">Waiting</span>
      </div>

      <div className="card center stack-s">
        <span className="eyebrow">Game code</span>
        <h1 className="code">{game.code}</h1>
        <button type="button" className="btn ghost small" onClick={() => void share()}>
          Share the link
        </button>
      </div>

      <div className="card stack-s">
        <div className="between">
          <span className="eyebrow">Who's here</span>
          <span className="tiny faint">{players.length}</span>
        </div>
        <Players players={players} meId={meId} now={now} />
      </div>

      <p className="tiny center faint">
        {game.config.pacing === "live"
          ? "Everyone answers together, one question at a time."
          : "Each round stays open until everyone has played it."}
      </p>

      <div className="spacer" />

      {isHost ? (
        <button type="button" className="btn" disabled={busy} onClick={() => void start()}>
          {busy ? "Dealing…" : `Start ${game.config.rounds} rounds`}
        </button>
      ) : (
        <div className="card center">
          <p className="serif-i">
            {game.players[game.hostId]?.name ?? "The host"} starts when everyone's in.
          </p>
        </div>
      )}

      <button type="button" className="btn quiet" onClick={onLeave}>
        Leave this game
      </button>
    </div>
  );
}
