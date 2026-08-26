import { Options } from "./Options.js";
import type { PuzzleProps } from "./types.js";

export function ImageChoice({ question, locked, onCommit }: PuzzleProps<"imageChoice">) {
  const media = question.media?.[0];

  return (
    <div className="stack">
      {media ? (
        <img
          className="puzzle-image"
          src={media.src}
          alt={media.alt}
          style={media.aspect ? { aspectRatio: String(media.aspect) } : undefined}
        />
      ) : null}
      <p className="prompt">{question.prompt}</p>
      <Options
        options={question.view.options}
        locked={locked}
        onPick={(choice) => onCommit({ choice })}
      />
    </div>
  );
}
