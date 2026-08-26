import { useState } from "react";

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
    <div className="page fade-in">
      <button
        type="button"
        className="btn quiet"
        onClick={onBack}
        style={{ alignSelf: "flex-start", width: "auto" }}
      >
        &larr; Back
      </button>

      <div className="center stack-s" style={{ paddingTop: "5vh" }}>
        <h2>Join a game</h2>
        <p className="serif-i">
          {initialCode ? "You've been invited." : "Ask the host for the code."}
        </p>
      </div>

      <div className="stack-s">
        <label className="eyebrow" htmlFor="join-code">
          Game code
        </label>
        <input
          id="join-code"
          className="input code-input"
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

      <div className="stack-s">
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

      <button type="button" className="btn" disabled={busy} onClick={() => void submit()}>
        {busy ? "Looking…" : "Join"}
      </button>
    </div>
  );
}
