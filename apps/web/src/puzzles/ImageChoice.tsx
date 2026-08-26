import { OptionList } from "../design/index.js";
import type { PuzzleProps } from "./types.js";

export function ImageChoice({ question, locked, onCommit, morphId }: PuzzleProps<"imageChoice">) {
  const media = question.media?.[0];

  return (
    <div className="stack--loose">
      {media ? (
        <img
          className="figure"
          src={media.src}
          alt={media.alt}
          style={media.aspect ? { aspectRatio: String(media.aspect) } : undefined}
        />
      ) : null}
      <p className="prompt center">{question.prompt}</p>
      <OptionList
        options={question.view.options}
        locked={locked}
        label={question.prompt}
        morphId={morphId}
        onPick={(choice) => onCommit({ choice })}
      />
    </div>
  );
}
