interface PassProps {
  name: string;
  round: number;
  onReady(): void;
}

/** Pass-and-play handoff: a screen nobody can accidentally read past. */
export function Pass({ name, round, onReady }: PassProps) {
  return (
    <div className="page fade-in">
      <div className="splash">
        <span className="eyebrow">Round {round + 1}</span>
        <h1>{name}</h1>
        <p className="serif-i">Pass the device along, then tap when you're looking.</p>
        <button type="button" className="btn" style={{ maxWidth: 260 }} onClick={onReady}>
          I'm ready
        </button>
      </div>
    </div>
  );
}
