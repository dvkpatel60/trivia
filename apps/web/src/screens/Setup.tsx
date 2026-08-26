import { useMemo, useState } from "react";
import {
  CONFIG_LIMITS,
  defaultConfig,
  getKind,
  type GameConfig,
  type Pacing,
  type PuzzleKindId,
} from "@candlelight/core";
import { packSummaries } from "@candlelight/content";

import { KindIcon } from "../components/KindIcon.js";

interface SetupProps {
  /** Local pass-and-play skips the pacing choice; there is only one device. */
  local: boolean;
  onStart(config: GameConfig, playerNames: string[]): Promise<void>;
  onBack(): void;
}

interface PacingOption {
  id: Pacing;
  name: string;
  blurb: string;
}

const PACING: PacingOption[] = [
  {
    id: "live",
    name: "Live together",
    blurb: "Everyone answers the same question at once. Best in a room or on a call.",
  },
  {
    id: "async",
    name: "Round by round",
    blurb: "Open a round; everyone plays it whenever they get to it.",
  },
];

export function Setup({ local, onStart, onBack }: SetupProps) {
  const packs = useMemo(() => packSummaries(), []);
  const [packId, setPackId] = useState(packs[0]?.id ?? "hogwarts");
  const [config, setConfig] = useState<GameConfig>(() => ({
    ...defaultConfig(packs[0]?.id ?? "hogwarts"),
    pacing: local ? "local" : "live",
  }));
  const [names, setNames] = useState(["Player 1", "Player 2"]);
  const [busy, setBusy] = useState(false);

  const pack = packs.find((entry) => entry.id === packId) ?? packs[0];
  const availableKinds = pack?.kinds ?? [];

  const patch = (changes: Partial<GameConfig>) => setConfig((current) => ({ ...current, ...changes }));

  const choosePack = (id: string) => {
    setPackId(id);
    patch({ packId: id });
  };

  const toggleKind = (kind: PuzzleKindId) => {
    const enabled = { ...config.kinds, [kind]: config.kinds[kind] === false };
    if (!availableKinds.some((id) => enabled[id] !== false)) return; // never zero
    patch({ kinds: enabled });
  };

  const step = (key: "rounds" | "questionsPerRound" | "seconds" | "basePoints", direction: 1 | -1) => {
    const limits = CONFIG_LIMITS[key];
    const increment = "step" in limits ? limits.step : 1;
    const next = config[key] + direction * increment;
    patch({ [key]: Math.max(limits.min, Math.min(limits.max, next)) } as Partial<GameConfig>);
  };

  const estimate = useMemo(() => {
    const perQuestion = config.timerOn ? config.seconds * 1.15 + 5 : 22;
    const questions = config.rounds * config.questionsPerRound;
    const playerFactor = local ? names.length : 1;
    return Math.max(1, Math.round((questions * perQuestion * playerFactor) / 60));
  }, [config, local, names.length]);

  const begin = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onStart({ ...config, packId }, names.map((name, i) => name.trim() || `Player ${i + 1}`));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page fade-in">
      <button type="button" className="btn quiet" onClick={onBack} style={{ alignSelf: "flex-start", width: "auto" }}>
        &larr; Back
      </button>

      <h2>{local ? "Pass and play" : "Host a game"}</h2>

      <section className="card stack-s">
        <span className="eyebrow">Topic</span>
        <div className="stack-s">
          {packs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="chip"
              aria-pressed={entry.id === packId}
              onClick={() => choosePack(entry.id)}
            >
              <span className="chip-name">{entry.name}</span>
              <span className="chip-desc">
                {entry.tagline} &middot; {entry.itemCount} questions
              </span>
            </button>
          ))}
        </div>
      </section>

      {local ? null : (
        <section className="card stack-s">
          <span className="eyebrow">Pace</span>
          {PACING.map((option) => (
            <button
              key={option.id}
              type="button"
              className="chip"
              aria-pressed={config.pacing === option.id}
              onClick={() => patch({ pacing: option.id })}
            >
              <span className="chip-name">{option.name}</span>
              <span className="chip-desc">{option.blurb}</span>
            </button>
          ))}

          {config.pacing === "async" ? (
            <label className="row" style={{ justifyContent: "space-between" }}>
              <span className="tiny muted">Close each round automatically</span>
              <select
                className="input"
                style={{ width: "auto", minHeight: 40, padding: "6px 10px" }}
                value={config.roundOpenMinutes ?? ""}
                onChange={(event) =>
                  patch({
                    roundOpenMinutes: event.target.value ? Number(event.target.value) : null,
                  })
                }
              >
                <option value="">When the host says</option>
                <option value="60">After an hour</option>
                <option value="720">After 12 hours</option>
                <option value="1440">After a day</option>
              </select>
            </label>
          ) : null}
        </section>
      )}

      {local ? (
        <section className="card stack-s">
          <span className="eyebrow">Players</span>
          {names.map((name, index) => (
            <div className="row" key={index}>
              <input
                className="input"
                value={name}
                maxLength={18}
                aria-label={`Player ${index + 1} name`}
                onChange={(event) => {
                  const next = names.slice();
                  next[index] = event.target.value;
                  setNames(next);
                }}
              />
              {names.length > 2 ? (
                <button
                  type="button"
                  className="btn quiet small"
                  onClick={() => setNames(names.filter((_, i) => i !== index))}
                  aria-label={`Remove player ${index + 1}`}
                >
                  &times;
                </button>
              ) : null}
            </div>
          ))}
          {names.length < 8 ? (
            <button
              type="button"
              className="btn ghost small"
              onClick={() => setNames([...names, `Player ${names.length + 1}`])}
            >
              Add a player
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="card stack-s">
        <span className="eyebrow">Puzzle types</span>
        <div className="chip-grid">
          {availableKinds.map((id) => {
            const kind = getKind(id);
            return (
              <button
                key={id}
                type="button"
                className="chip"
                aria-pressed={config.kinds[id] !== false}
                onClick={() => toggleKind(id)}
              >
                <span className="chip-name row" style={{ gap: 6 }}>
                  <KindIcon icon={kind.icon} size={15} />
                  {kind.name}
                </span>
                <span className="chip-desc">{kind.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card stack-s">
        <span className="eyebrow">Shape of it</span>

        <Stepper label="Rounds" value={config.rounds} onStep={(d) => step("rounds", d)} />
        <Stepper
          label="Questions each round"
          value={config.questionsPerRound}
          onStep={(d) => step("questionsPerRound", d)}
        />
        <Stepper
          label="Seconds a question"
          value={config.timerOn ? config.seconds : 0}
          display={config.timerOn ? `${config.seconds}s` : "off"}
          onStep={(d) => step("seconds", d)}
          disabled={!config.timerOn}
        />

        <Toggle
          label="Timer"
          hint="Off means nobody is rushed."
          on={config.timerOn}
          onToggle={() => patch({ timerOn: !config.timerOn })}
        />
        <Toggle
          label="Speed bonus"
          hint="Up to half again for answering fast."
          on={config.speedBonus}
          onToggle={() => patch({ speedBonus: !config.speedBonus })}
        />
        <Toggle
          label="Streak bonus"
          hint="Consecutive perfect answers stack."
          on={config.streakBonus}
          onToggle={() => patch({ streakBonus: !config.streakBonus })}
        />
        <Toggle
          label="Themed rounds"
          hint="Each round sticks to one puzzle type."
          on={config.themedRounds}
          onToggle={() => patch({ themedRounds: !config.themedRounds })}
        />
        {local ? null : (
          <Toggle
            label="Seal scores"
            hint="Nobody sees points until the round closes."
            on={config.hideAnswers}
            onToggle={() => patch({ hideAnswers: !config.hideAnswers })}
          />
        )}
      </section>

      <p className="tiny center faint">Roughly {estimate} minutes.</p>

      <button type="button" className="btn" disabled={busy} onClick={() => void begin()}>
        {busy ? "Setting up…" : local ? "Start playing" : "Open the lobby"}
      </button>
    </div>
  );
}

interface StepperProps {
  label: string;
  value: number;
  display?: string;
  disabled?: boolean;
  onStep(direction: 1 | -1): void;
}

function Stepper({ label, value, display, disabled, onStep }: StepperProps) {
  return (
    <div className="between">
      <span className={disabled ? "faint" : ""}>{label}</span>
      <div className="stepper">
        <button type="button" disabled={disabled} onClick={() => onStep(-1)} aria-label={`Fewer ${label}`}>
          &minus;
        </button>
        <span className="value">{display ?? value}</span>
        <button type="button" disabled={disabled} onClick={() => onStep(1)} aria-label={`More ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}

interface ToggleProps {
  label: string;
  hint: string;
  on: boolean;
  onToggle(): void;
}

function Toggle({ label, hint, on, onToggle }: ToggleProps) {
  return (
    <button type="button" className="chip" aria-pressed={on} onClick={onToggle}>
      <span className="chip-name">
        {label} &middot; {on ? "on" : "off"}
      </span>
      <span className="chip-desc">{hint}</span>
    </button>
  );
}
