import { Scene } from "../design/index.js";

interface PassProps {
  name: string;
  round: number;
  onReady(): void;
}

/** Pass-and-play handoff: a screen nobody can accidentally read past. */
export function Pass({ name, round, onReady }: PassProps) {
  return (
    <Scene
      id={`pass-${name}-${round}`}
      rail={<span className="eyebrow">Round {round + 1}</span>}
      dock={
        <button type="button" className="button state" onClick={onReady}>
          I'm looking
        </button>
      }
    >
      <div className="splash splash--solo">
        <span className="ember" />
        <h1>{name}</h1>
        <p className="lede">Pass the device along, then tap when you have it.</p>
      </div>
    </Scene>
  );
}
