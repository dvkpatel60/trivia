import { useState } from "react";

import { Scene } from "../design/index.js";

interface JoinProps {
  /** Filled in from a shared link, so most players never type a code. */
  initialCode?: string | null;
  name: string;
  onName(name: string): void;
  onJoin(code: string): Promise<void>;
  onBack(): void;
  trouble: string | null;
}

export function Join({ initialCode, name, onName, onJoin, onBack, trouble }: JoinProps) {
  const [code, setCode] = useState(initialCode ?? "");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const ready = code.trim().length > 0 && name.trim().length > 0;

  const submit = async () => {
    if (busy) return;
    if (!ready) {
      setTouched(true);
      return;
    }
    setBusy(true);
    try {
      await onJoin(code.trim().toUpperCase());
    } finally {
      setBusy(false);
    }
  };

  return (
    <Scene
      id="join"
      rail={
        <button type="button" className="button button--quiet button--inline state" onClick={onBack}>
          ← Back
        </button>
      }
      dock={
        <>
          {touched && !ready ? (
            <p className="tiny center" style={{ color: "var(--warn)" }}>
              Both fields, please.
            </p>
          ) : null}
          {trouble ? (
            <p className="tiny center" style={{ color: "var(--warn)" }}>
              {trouble}
            </p>
          ) : null}
          <button type="button" className="button state" disabled={busy} onClick={() => void submit()}>
            {busy ? "Looking…" : "Join"}
          </button>
        </>
      }
    >
      <div className="center stack--tight">
        <h1>Join a game</h1>
        <p className="lede">{initialCode ? "You've been invited." : "Ask the host for the code."}</p>
      </div>

      <div className="field">
        <label className="eyebrow" htmlFor="join-code">
          Game code
        </label>
        <input
          id="join-code"
          className="input input--code"
          value={code}
          placeholder="NIFFLER-42"
          autoComplete="off"
          autoFocus={!initialCode}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submit();
          }}
        />
      </div>

      <div className="field">
        <label className="eyebrow" htmlFor="join-name">
          Your name
        </label>
        <input
          id="join-name"
          className="input"
          value={name}
          maxLength={18}
          placeholder="What should we call you?"
          autoComplete="nickname"
          autoFocus={Boolean(initialCode)}
          onChange={(event) => onName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submit();
          }}
        />
      </div>
    </Scene>
  );
}
