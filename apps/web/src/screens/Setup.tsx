import { useMemo, useState } from "react";
import {
  CONFIG_LIMITS,
  defaultConfig,
  getKind,
  oklchToHex,
  type GameConfig,
  type Pacing,
  type PuzzleKindId,
} from "@curio/core";
import { packSummaries, type PackSummary } from "@curio/content";

import { KindIcon, Scene } from "../design/index.js";

interface SetupProps {
  /** Pass-and-play skips the pacing choice; there is only one device. */
  local: boolean;
  onStart(config: GameConfig, playerNames: string[]): Promise<void>;
  onBack(): void;
  /** Previews the chosen pack's world as you browse. */
  onPreview(packId: string): void;
}

const PACING: Array<{ id: Pacing; name: string; blurb: string }> = [
  {
    id: "live",
    name: "Live together",
    blurb: "One question at a time, everyone at once. For a room or a call.",
  },
  {
    id: "async",
    name: "Round by round",
    blurb: "Open a round; everyone plays it whenever they get to it.",
  },
];

export function Setup({ local, onStart, onBack, onPreview }: SetupProps) {
  const packs = useMemo(() => packSummaries(), []);
  const first = packs[0]?.id ?? "hogwarts";
  const [packId, setPackId] = useState(first);
  const [config, setConfig] = useState<GameConfig>(() => ({
    ...defaultConfig(first),
    pacing: local ? "local" : "live",
  }));
  const [names, setNames] = useState(["Player 1", "Player 2"]);
  const [busy, setBusy] = useState(false);

  const pack = packs.find((entry) => entry.id === packId) ?? packs[0];
  const kinds = pack?.kinds ?? [];

  const patch = (changes: Partial<GameConfig>) =>
    setConfig((current) => ({ ...current, ...changes }));

  const choosePack = (id: string) => {
    setPackId(id);
    patch({ packId: id });
    onPreview(id);
  };

  const toggleKind = (kind: PuzzleKindId) => {
    const next = { ...config.kinds, [kind]: config.kinds[kind] === false };
    if (!kinds.some((id) => next[id] !== false)) return; // never leave zero on
    patch({ kinds: next });
  };

  const step = (
    key: "rounds" | "questionsPerRound" | "seconds" | "basePoints",
    direction: 1 | -1,
  ) => {
    const limits = CONFIG_LIMITS[key];
    const increment = "step" in limits ? limits.step : 1;
    const next = config[key] + direction * increment;
    patch({ [key]: Math.max(limits.min, Math.min(limits.max, next)) } as Partial<GameConfig>);
  };

  const minutes = useMemo(() => {
    const perQuestion = config.timerOn ? config.seconds * 1.15 + 5 : 22;
    const questions = config.rounds * config.questionsPerRound;
    return Math.max(1, Math.round((questions * perQuestion * (local ? names.length : 1)) / 60));
  }, [config, local, names.length]);

  const begin = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onStart(
        { ...config, packId },
        names.map((name, index) => name.trim() || `Player ${index + 1}`),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Scene
      id="setup"
      flow="top"
      rail={
        <>
          <button type="button" className="button button--quiet button--inline state" onClick={onBack}>
            ← Back
          </button>
          <span className="eyebrow">{local ? "Pass and play" : "Host"}</span>
        </>
      }
      dock={
        <>
          <p className="tiny faint center">About {minutes} minutes.</p>
          <button type="button" className="button state" disabled={busy} onClick={() => void begin()}>
            {busy ? "Setting up…" : local ? "Start playing" : "Open the lobby"}
          </button>
        </>
      }
    >
      <section className="stack--tight">
        <span className="eyebrow">Topic</span>
        {packs.map((entry) => (
          <PackDrawer
            key={entry.id}
            pack={entry}
            selected={entry.id === packId}
            onSelect={() => choosePack(entry.id)}
          />
        ))}
      </section>

      {local ? null : (
        <section className="stack--tight">
          <span className="eyebrow">Pace</span>
          {PACING.map((option) => (
            <button
              key={option.id}
              type="button"
              className="mode state"
              aria-pressed={config.pacing === option.id}
              onClick={() => patch({ pacing: option.id })}
            >
              <span className="mode__name">{option.name}</span>
              <span className="mode__desc">{option.blurb}</span>
            </button>
          ))}

          {config.pacing === "async" ? (
            <div className="setting">
              <span className="setting__label">Close each round</span>
              <select
                className="input"
                style={{ width: "auto", minHeight: 40, padding: "0 10px" }}
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
            </div>
          ) : null}
        </section>
      )}

      {local ? (
        <section className="stack--tight">
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
                  className="button button--quiet button--inline state"
                  aria-label={`Remove player ${index + 1}`}
                  onClick={() => setNames(names.filter((_, i) => i !== index))}
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))}
          {names.length < 8 ? (
            <button
              type="button"
              className="button button--ghost state"
              onClick={() => setNames([...names, `Player ${names.length + 1}`])}
            >
              Add a player
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="stack--tight">
        <span className="eyebrow">Puzzle types</span>
        <div className="chips">
          {kinds.map((id) => {
            const kind = getKind(id);
            return (
              <button
                key={id}
                type="button"
                className="chip state"
                aria-pressed={config.kinds[id] !== false}
                onClick={() => toggleKind(id)}
              >
                <span className="chip__name">
                  <KindIcon icon={kind.icon} size={14} />
                  {kind.name}
                </span>
                <span className="chip__desc">{kind.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="stack--tight">
        <span className="eyebrow">Shape</span>

        <Stepper label="Rounds" value={config.rounds} onStep={(d) => step("rounds", d)} />
        <Stepper
          label="Questions each round"
          value={config.questionsPerRound}
          onStep={(d) => step("questionsPerRound", d)}
        />
        <Stepper
          label="Seconds a question"
          value={config.seconds}
          display={config.timerOn ? `${config.seconds}s` : "—"}
          disabled={!config.timerOn}
          onStep={(d) => step("seconds", d)}
        />

        <Switch
          label="Timer"
          hint="Off means nobody is rushed."
          on={config.timerOn}
          onToggle={() => patch({ timerOn: !config.timerOn })}
        />
        <Switch
          label="Speed bonus"
          hint="Up to half again for answering fast."
          on={config.speedBonus}
          onToggle={() => patch({ speedBonus: !config.speedBonus })}
        />
        <Switch
          label="Streak bonus"
          hint="Perfect answers in a row stack up."
          on={config.streakBonus}
          onToggle={() => patch({ streakBonus: !config.streakBonus })}
        />
        <Switch
          label="Themed rounds"
          hint="Each round sticks to one puzzle type."
          on={config.themedRounds}
          onToggle={() => patch({ themedRounds: !config.themedRounds })}
        />
        {local ? null : (
          <Switch
            label="Seal scores"
            hint="No points shown until the round closes."
            on={config.hideAnswers}
            onToggle={() => patch({ hideAnswers: !config.hideAnswers })}
          />
        )}
      </section>
    </Scene>
  );
}

/** A pack, shown as a swatch of its own palette so you pick by mood. */
function PackDrawer({
  pack,
  selected,
  onSelect,
}: {
  pack: PackSummary;
  selected: boolean;
  onSelect(): void;
}) {
  const { palette } = pack;
  const swatch = [palette.accent, palette.support, palette.extra, palette.warn].map(
    (role) => role.base,
  );

  return (
    <button type="button" className="drawer state" aria-pressed={selected} onClick={onSelect}>
      <span className="drawer__swatch" aria-hidden="true">
        {swatch.map((colour, index) => (
          <span key={index} style={{ background: colour ? oklchToHex(colour) : "transparent" }} />
        ))}
      </span>
      <span className="grow">
        <span className="drawer__title">{pack.name}</span>
        <span className="drawer__meta">
          {pack.tagline} · {pack.itemCount} questions · {pack.kinds.length} types
        </span>
      </span>
    </button>
  );
}

function Stepper({
  label,
  value,
  display,
  disabled,
  onStep,
}: {
  label: string;
  value: number;
  display?: string;
  disabled?: boolean;
  onStep(direction: 1 | -1): void;
}) {
  return (
    <div className="setting">
      <span className={`setting__label${disabled ? " faint" : ""}`}>{label}</span>
      <div className="stepper">
        <button type="button" disabled={disabled} aria-label={`Fewer ${label}`} onClick={() => onStep(-1)}>
          −
        </button>
        <span className="stepper__value">{display ?? value}</span>
        <button type="button" disabled={disabled} aria-label={`More ${label}`} onClick={() => onStep(1)}>
          +
        </button>
      </div>
    </div>
  );
}

function Switch({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  on: boolean;
  onToggle(): void;
}) {
  return (
    <div className="setting">
      <span className="grow">
        <span className="setting__label">{label}</span>
        <br />
        <span className="setting__hint">{hint}</span>
      </span>
      <button
        type="button"
        className="switch"
        role="switch"
        aria-checked={on}
        aria-pressed={on}
        aria-label={label}
        onClick={onToggle}
      />
    </div>
  );
}
