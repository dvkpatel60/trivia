import { useState } from "react";

interface HomeProps {
  name: string;
  onName(name: string): void;
  resumeCode: string | null;
  onResume(): void;
  onHost(): void;
  onJoin(): void;
  onLocal(): void;
  online: boolean;
}

export function Home({
  name,
  onName,
  resumeCode,
  onResume,
  onHost,
  onJoin,
  onLocal,
  online,
}: HomeProps) {
  const [touched, setTouched] = useState(false);
  const named = name.trim().length > 0;

  const guard = (action: () => void) => () => {
    if (!named) {
      setTouched(true);
      return;
    }
    action();
  };

  return (
    <div className="page fade-in">
      <div className="center stack-s" style={{ paddingTop: "6vh" }}>
        <div className="row" style={{ justifyContent: "center" }}>
          <span className="flame" />
        </div>
        <h1>Candlelight</h1>
        <p className="serif-i">Trivia, together or whenever you get to it.</p>
      </div>

      <div className="spacer" style={{ maxHeight: "6vh" }} />

      {resumeCode ? (
        <button type="button" className="btn ghost" onClick={onResume}>
          Back to <span className="code">{resumeCode}</span>
        </button>
      ) : null}

      <div className="stack-s">
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
        {touched && !named ? <p className="tiny" style={{ color: "var(--warn)" }}>Pop a name in first.</p> : null}
      </div>

      <div className="stack-s">
        <button type="button" className="btn" onClick={guard(onHost)} disabled={!online}>
          Host a game
        </button>
        <button type="button" className="btn ghost" onClick={guard(onJoin)} disabled={!online}>
          Join with a code
        </button>
        <button type="button" className="btn quiet" onClick={guard(onLocal)}>
          Pass one device around
        </button>
      </div>

      {online ? null : (
        <p className="tiny center faint">
          No server reachable, so online play is off. Pass-and-play works offline.
        </p>
      )}
    </div>
  );
}
