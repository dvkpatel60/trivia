import { useState } from "react";

interface HomeProps {
  name: string;
  onName(name: string): void;
  resumeCode: string | null;
  onResume(): void;
  onHost(): void;
  onJoin(): void;
  onLocal(): void;
  onLibrary(): void;
  online: boolean;
}

import { Scene, Wordmark } from "../design/index.js";

export function Home({
  name,
  onName,
  resumeCode,
  onResume,
  onHost,
  onJoin,
  onLocal,
  onLibrary,
  online,
}: HomeProps) {
  const [touched, setTouched] = useState(false);
  const named = name.trim().length > 0;

  const guard = (action: () => void) => () => {
    if (!named) {
      setTouched(true);
      document.getElementById("name")?.focus();
      return;
    }
    action();
  };

  return (
    <Scene
      id="home"
      dock={
        <>
          {resumeCode ? (
            <button type="button" className="button button--ghost state" onClick={onResume}>
              Back to {resumeCode}
            </button>
          ) : null}
          <button type="button" className="button state" onClick={guard(onHost)} disabled={!online}>
            Host a game
          </button>
          <button
            type="button"
            className="button button--ghost state"
            onClick={guard(onJoin)}
            disabled={!online}
          >
            Join with a code
          </button>
          <button type="button" className="button button--quiet state" onClick={guard(onLocal)}>
            Pass one device around
          </button>
          <button type="button" className="button button--quiet state" onClick={onLibrary}>
            Browse the picture rounds
          </button>
          {online ? null : (
            <p className="tiny faint center">
              No server reachable — pass-and-play still works offline.
            </p>
          )}
        </>
      }
    >
      <div className="splash">
        <Wordmark />
      </div>

      <div className="field">
        <label className="eyebrow" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          className="input"
          value={name}
          maxLength={18}
          placeholder="What should we call you?"
          autoComplete="nickname"
          onChange={(event) => onName(event.target.value)}
        />
        {touched && !named ? (
          <p className="tiny" style={{ color: "var(--warn)" }}>
            Pop a name in first.
          </p>
        ) : null}
      </div>
    </Scene>
  );
}
