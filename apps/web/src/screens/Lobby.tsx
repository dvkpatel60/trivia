import { useState } from "react";
import { type PublicGameState } from "@curio/core";

import { QrCode, Roster, Scene } from "../design/index.js";

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
  const players = Object.values(game.players).sort((a, b) => a.joinedAt - b.joinedAt);
  const link = `${location.origin}${location.pathname}?code=${game.code}`;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Curio", text: `Join my game: ${game.code}`, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
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
    <Scene
      id="lobby"
      flow="top"
      rail={
        <>
          <span className="eyebrow">Lobby</span>
          <span className="badge badge--live">Open</span>
        </>
      }
      dock={
        <>
          {isHost ? (
            <button type="button" className="button state" disabled={busy} onClick={() => void start()}>
              {busy ? "Dealing…" : `Start · ${game.config.rounds} rounds`}
            </button>
          ) : (
            <p className="lede center">
              {game.players[game.hostId]?.name ?? "The host"} starts when everyone's in.
            </p>
          )}
          <button type="button" className="button button--quiet state" onClick={onLeave}>
            Leave
          </button>
        </>
      }
    >
      <div className="stack--tight center">
        <span className="eyebrow" style={{ justifyContent: "center" }}>
          Scan to join
        </span>
        <QrCode value={link} label={`Join game ${game.code}`} />
        <p className="code-display" aria-label={`Game code ${game.code}`}>
          {game.code.split("").map((character, index) => (
            <span key={index} style={{ animationDelay: `${index * 40}ms` }}>
              {character}
            </span>
          ))}
        </p>
        <button
          type="button"
          className="button button--ghost button--inline state"
          style={{ alignSelf: "center" }}
          onClick={() => void share()}
        >
          Share the link
        </button>
      </div>

      <div className="panel stack--tight">
        <div className="row--between">
          <span className="eyebrow">Who's here</span>
          <span className="tiny faint num">{players.length}</span>
        </div>
        <Roster players={players} meId={meId} now={now} />
      </div>

      <p className="tiny faint center">
        {game.config.pacing === "live"
          ? "Everyone answers together, one question at a time."
          : "Each round stays open until everyone has played it."}
      </p>
    </Scene>
  );
}
